import { NextResponse } from "next/server";
import { readJsonBody, withRetryAfter } from "../api/http";
import { requireAdminCsrf, requireAdminRequest } from "../auth/admin";
import { isDateAvailable } from "../availability-db";
import { isFirebaseAdminConfigured } from "../firebase/admin";
import { sendBookingCreatedNotifications, sendBookingStatusUpdatedNotifications } from "../notifications";
import { checkRateLimit } from "../security/rate-limit";
import { getSiteSettings } from "../site-settings";
import { bookingSchema } from "../validators/booking";
import { isoDateSchema, monthSchema } from "../validators/api";
import { contactSchema } from "../validators/contact";
import { stripUndefinedFields } from "../../utils/sanitize";
import { buildBookingReplyToken } from "../booking-threads";
import { logAdminActivity } from "../admin-activity";
import { writeRequestLog } from "./request-logs";
import { availabilityDataService } from "./availability";
import { BookingConflictError, bookingDataService, getCustomerStatus, resolvePackageLabel, toDeliveryStatus } from "./bookings";
import { contactDataService } from "./contacts";
import { validBookingStatuses } from "./types";
import type { BookingStatus } from "../../types/booking";

function monthFromNow() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function logAvailability(event: string, details: Record<string, unknown>) {
  console.info("[availability]", event, details);
}

export async function getBookingsRoute(request: Request) {
  const requestId = crypto.randomUUID();
  const path = new URL(request.url).pathname;
  const authError = requireAdminRequest(request);
  if (authError) {
    const status = authError === "Unauthorized" ? 401 : 503;
    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "bookings_get_denied",
      method: "GET",
      path,
      statusCode: status,
      metadata: { reason: authError }
    });
    return NextResponse.json({ message: authError }, { status });
  }

  if (!isFirebaseAdminConfigured()) {
    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "bookings_get_unconfigured",
      method: "GET",
      path,
      statusCode: 503
    });
    return NextResponse.json({ message: "Firebase Admin is not configured." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    if (includeDeleted) {
      await bookingDataService.purgeExpired();
    }

    if (date) {
      const parsedDate = isoDateSchema.safeParse(date);
      if (!parsedDate.success) {
        void writeRequestLog(request, {
          requestId,
          domain: "data",
          action: "bookings_get_invalid_date",
          method: "GET",
          path,
          statusCode: 400
        });
        return NextResponse.json({ message: "Invalid date query. Use YYYY-MM-DD." }, { status: 400 });
      }

      const booking = await bookingDataService.getByDate(date, { includeDeleted });
      void writeRequestLog(request, {
        requestId,
        domain: "data",
        action: "bookings_get_by_date",
        method: "GET",
        path,
        statusCode: 200,
        metadata: { date, found: Boolean(booking), includeDeleted }
      });
      return NextResponse.json({ booking });
    }

    const bookings = await bookingDataService.list({ includeDeleted });
    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "bookings_list",
      method: "GET",
      path,
      statusCode: 200,
      metadata: { count: bookings.length, includeDeleted }
    });
    return NextResponse.json({ bookings });
  } catch (error) {
    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "bookings_get_error",
      method: "GET",
      path,
      statusCode: 500,
      metadata: { message: error instanceof Error ? error.message : String(error) }
    });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load bookings" },
      { status: 500 }
    );
  }
}

export async function patchBookingsRoute(request: Request) {
  const requestId = crypto.randomUUID();
  const path = new URL(request.url).pathname;
  const authError = requireAdminRequest(request);
  if (authError) {
    const status = authError === "Unauthorized" ? 401 : 503;
    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "bookings_patch_denied",
      method: "PATCH",
      path,
      statusCode: status,
      metadata: { reason: authError }
    });
    return NextResponse.json({ message: authError }, { status });
  }

  const csrfError = requireAdminCsrf(request);
  if (csrfError) {
    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "bookings_patch_csrf_failed",
      method: "PATCH",
      path,
      statusCode: 403
    });
    return NextResponse.json({ message: csrfError }, { status: 403 });
  }

  if (!isFirebaseAdminConfigured()) {
    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "bookings_patch_unconfigured",
      method: "PATCH",
      path,
      statusCode: 503
    });
    return NextResponse.json({ message: "Firebase Admin is not configured." }, { status: 503 });
  }

  try {
    const body = await readJsonBody<{
      id?: string;
      bookingId?: string;
      status?: BookingStatus;
      action?: "delete" | "restore" | "status" | "deleteForever" | "delete_forever" | "purge_expired" | "purge_test";
      deletionReason?: string;
    }>(request);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }

    const bookingId = body.bookingId || body.id;

    if (body.action === "purge_expired") {
      const purgedBookings = await bookingDataService.purgeExpired();
      await Promise.all(
        purgedBookings.map((booking) =>
          logAdminActivity({
            bookingId: booking.id,
            action: "booking_status_updated",
            actorType: "admin",
            summary: "Booking permanently purged after trash retention expired",
            booking,
            metadata: { lifecycleAction: "purge_expired" }
          })
        )
      );

      void writeRequestLog(request, {
        requestId,
        domain: "data",
        action: "booking_trash_purged_expired",
        method: "PATCH",
        path,
        statusCode: 200,
        metadata: { purgedCount: purgedBookings.length }
      });

      return NextResponse.json({
        message: purgedBookings.length > 0 ? `Purged ${purgedBookings.length} expired trashed booking(s)` : "No expired trash to purge",
        purgedCount: purgedBookings.length,
        bookings: purgedBookings
      });
    }

    if (body.action === "purge_test") {
      const purgedBookings = await bookingDataService.purgeTestDeleted();
      await Promise.all(
        purgedBookings.map((booking) =>
          logAdminActivity({
            bookingId: booking.id,
            action: "booking_status_updated",
            actorType: "admin",
            summary: "Test booking permanently purged from trash",
            booking,
            metadata: { lifecycleAction: "purge_test" }
          })
        )
      );

      void writeRequestLog(request, {
        requestId,
        domain: "data",
        action: "booking_test_trash_purged",
        method: "PATCH",
        path,
        statusCode: 200,
        metadata: { purgedCount: purgedBookings.length }
      });

      return NextResponse.json({
        message: purgedBookings.length > 0 ? `Purged ${purgedBookings.length} deleted test booking(s)` : "No deleted test bookings to purge",
        purgedCount: purgedBookings.length,
        bookings: purgedBookings
      });
    }

    if (!bookingId) {
      return NextResponse.json({ message: "Booking id is required" }, { status: 400 });
    }

    if (body.action === "delete") {
      const booking = await bookingDataService.softDelete(bookingId, "admin", { deletionReason: body.deletionReason ?? null });
      await logAdminActivity({
        bookingId: booking.id,
        action: "booking_status_updated",
        actorType: "admin",
        summary: "Booking soft-deleted from admin inbox",
        booking,
        metadata: {
          lifecycleAction: "delete",
          purgeAt: booking.purgeAt ?? null,
          deletionReason: booking.deletionReason ?? null
        }
      });

      void writeRequestLog(request, {
        requestId,
        domain: "data",
        action: "booking_soft_deleted",
        method: "PATCH",
        path,
        statusCode: 200,
        metadata: { bookingId: booking.id }
      });

      return NextResponse.json({ message: "Booking moved to deleted", booking });
    }

    if (body.action === "restore") {
      const booking = await bookingDataService.restore(bookingId);
      await logAdminActivity({
        bookingId: booking.id,
        action: "booking_status_updated",
        actorType: "admin",
        summary: "Booking restored from deleted view",
        booking,
        metadata: {
          lifecycleAction: "restore"
        }
      });

      void writeRequestLog(request, {
        requestId,
        domain: "data",
        action: "booking_restored",
        method: "PATCH",
        path,
        statusCode: 200,
        metadata: { bookingId: booking.id }
      });

      return NextResponse.json({ message: "Booking restored", booking });
    }

    if (body.action === "deleteForever" || body.action === "delete_forever") {
      const deletedBooking = await bookingDataService.permanentlyDelete(bookingId);
      if (!deletedBooking) {
        return NextResponse.json({ message: "Booking not found" }, { status: 404 });
      }

      await logAdminActivity({
        bookingId: deletedBooking.id,
        action: "booking_status_updated",
        actorType: "admin",
        summary: "Booking permanently deleted from trash",
        booking: deletedBooking,
        metadata: { lifecycleAction: "deleteForever" }
      });

      void writeRequestLog(request, {
        requestId,
        domain: "data",
        action: "booking_permanently_deleted",
        method: "PATCH",
        path,
        statusCode: 200,
        metadata: { bookingId: deletedBooking.id }
      });

      return NextResponse.json({ message: "Booking permanently deleted", bookingId: deletedBooking.id });
    }

    if ((!body.status || !validBookingStatuses.includes(body.status)) && body.action !== "status") {
      return NextResponse.json({ message: "Valid booking status is required" }, { status: 400 });
    }

    if (!body.status || !validBookingStatuses.includes(body.status)) {
      return NextResponse.json({ message: "Valid booking status is required" }, { status: 400 });
    }

    const siteSettings = await getSiteSettings();
    const { booking, previousStatus } = await bookingDataService.updateStatus(bookingId, body.status);
    const customerStatus = getCustomerStatus(body.status);

    await logAdminActivity({
      bookingId: booking.id,
      action: "booking_status_updated",
      actorType: "admin",
      summary: `Booking moved from ${previousStatus.replace(/_/g, " ")} to ${body.status.replace(/_/g, " ")}`,
      booking,
      metadata: {
        previousStatus,
        nextStatus: body.status
      }
    });

    if (customerStatus) {
      const packageLabel = resolvePackageLabel(booking.packageId, siteSettings);
      const flow =
        customerStatus === "reviewed"
          ? "status_reviewed"
          : customerStatus === "confirmed"
            ? "status_confirmed"
            : "status_declined";
      const recipient = booking.email?.trim().toLowerCase() || "";

      try {
        const results = await sendBookingStatusUpdatedNotifications({
          booking,
          packageLabel,
          customerStatus,
          businessContact: siteSettings.contact
        });

        results.forEach((result) => {
          const deliveryStatus = toDeliveryStatus(result);
          const logger = deliveryStatus === "sent" ? console.info : console.warn;
          logger("[bookings] customer_notification_delivery", {
            requestId,
            flow,
            bookingId: booking.id,
            recipient,
            channel: result.channel,
            deliveryStatus,
            reason: result.reason || ""
          });
        });
      } catch (notificationError) {
        console.error("[bookings] customer_notification_delivery", {
          requestId,
          flow,
          bookingId: booking.id,
          recipient,
          channel: "email",
          deliveryStatus: "failed",
          reason: notificationError instanceof Error ? notificationError.message : String(notificationError)
        });
      }
    }

    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "booking_status_updated",
      method: "PATCH",
      path,
      statusCode: 200,
      metadata: { bookingId: booking.id, previousStatus, nextStatus: body.status }
    });

    return NextResponse.json({ message: "Booking status updated", booking });
  } catch (error) {
    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "bookings_patch_error",
      method: "PATCH",
      path,
      statusCode: 500,
      metadata: { message: error instanceof Error ? error.message : String(error) }
    });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update booking status" },
      { status: 500 }
    );
  }
}

export async function postBookingsRoute(request: Request) {
  const requestId = crypto.randomUUID();
  const path = new URL(request.url).pathname;
  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    console.info("[bookings] submit_request", { requestId });
  }

  const rateLimit = checkRateLimit(request, "bookings-submit", { windowMs: 10 * 60 * 1000, maxRequests: 30 });
  if (rateLimit.limited) {
    const response = NextResponse.json(
      { message: "Too many booking attempts. Please try again shortly." },
      { status: 429 }
    );
    withRetryAfter(response, rateLimit.retryAfterSeconds);
    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "bookings_submit_limited",
      method: "POST",
      path,
      statusCode: 429,
      metadata: { retryAfterSeconds: rateLimit.retryAfterSeconds }
    });
    return response;
  }

  if (!isFirebaseAdminConfigured()) {
    console.warn("[bookings] firebase_not_configured", { requestId });
    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "bookings_submit_unconfigured",
      method: "POST",
      path,
      statusCode: 503
    });
    return NextResponse.json({ message: "Firebase Admin is not configured." }, { status: 503 });
  }

  try {
    const siteSettings = await getSiteSettings();
    if (!siteSettings.booking.enabled) {
      return NextResponse.json(
        { message: siteSettings.booking.notice || "Bookings are temporarily paused." },
        { status: 403 }
      );
    }

    const body = await readJsonBody<Record<string, unknown>>(request);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }

    if (isDev) {
      console.info("[bookings] submit_payload_received", {
        requestId,
        eventDate: typeof body.eventDate === "string" ? body.eventDate : "unknown"
      });
    }

    const parsed = bookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const available = await isDateAvailable(parsed.data.eventDate);
    if (!available) {
      if (isDev) {
        console.info("[bookings] unavailable_date_rejected", {
          requestId,
          date: parsed.data.eventDate,
          source: "firestore_live_data"
        });
      }

      return NextResponse.json({ message: "Date not available" }, { status: 409 });
    }

    if (isDev) {
      console.info("[bookings][dev] payload_before_clean", { requestId, payload: parsed.data });
    }

    const cleanedPayload = stripUndefinedFields(parsed.data) as typeof parsed.data;

    if (isDev) {
      console.info("[bookings][dev] payload_after_clean", { requestId, payload: cleanedPayload });
    }

    const booking = await bookingDataService.create(cleanedPayload);
    await logAdminActivity({
      bookingId: booking.id,
      action: "booking_created",
      actorType: "system",
      summary: `New booking inquiry from ${booking.fullName} for ${booking.eventDate}`,
      booking,
      metadata: {
        packageId: booking.packageId || null,
        preferredContactMethod: booking.preferredContactMethod
      }
    });

    if (isDev) {
      console.info("[bookings] booking_created", { requestId, bookingId: booking.id, date: booking.eventDate });
    }

    const packageLabel = resolvePackageLabel(cleanedPayload.packageId, siteSettings);
    void sendBookingCreatedNotifications({ booking, packageLabel })
      .then((results) => {
        const failed = results.filter((result) => result.attempted && !result.sent);
        if (failed.length > 0) {
          console.warn("[bookings] notification_delivery_issues", {
            requestId,
            bookingId: booking.id,
            failedChannels: failed.map((item) => ({ channel: item.channel, reason: item.reason || "unknown" }))
          });
        }
      })
      .catch((notificationError) => {
        console.error("[bookings] notification_dispatch_failed", {
          requestId,
          bookingId: booking.id,
          message: notificationError instanceof Error ? notificationError.message : String(notificationError)
        });
      });

    const replyToken = buildBookingReplyToken(booking);
    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "booking_created",
      method: "POST",
      path,
      statusCode: 201,
      metadata: { bookingId: booking.id, eventDate: booking.eventDate }
    });

    return NextResponse.json(
      {
        message: "Booking inquiry submitted successfully",
        booking: {
          id: booking.id
        },
        replyToken
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof BookingConflictError) {
      console.warn("[bookings] booking_conflict", { requestId, message: error.message });
      void writeRequestLog(request, {
        requestId,
        domain: "data",
        action: "booking_conflict",
        method: "POST",
        path,
        statusCode: 409,
        metadata: { message: error.message }
      });
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error("[bookings] booking_submit_failed", {
      requestId,
      message: error instanceof Error ? error.message : String(error)
    });
    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "bookings_submit_error",
      method: "POST",
      path,
      statusCode: 500,
      metadata: { message: error instanceof Error ? error.message : String(error) }
    });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to submit booking inquiry" },
      { status: 500 }
    );
  }
}

export async function getAvailabilityRoute(request: Request) {
  const requestId = crypto.randomUUID();
  const path = new URL(request.url).pathname;

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const date = searchParams.get("date");
    const list = searchParams.get("list");

    if (list === "blocked") {
      const blockedDates = await availabilityDataService.listBlockedDates();
      logAvailability("list_blocked", { requestId, count: blockedDates.length });
      void writeRequestLog(request, {
        requestId,
        domain: "data",
        action: "availability_blocked_list",
        method: "GET",
        path,
        statusCode: 200,
        metadata: { count: blockedDates.length }
      });
      return NextResponse.json({ blockedDates });
    }

    if (date) {
      const parsedDate = isoDateSchema.safeParse(date);
      if (!parsedDate.success) {
        return NextResponse.json({ message: "Invalid date query. Use YYYY-MM-DD." }, { status: 400 });
      }

      const availability = await availabilityDataService.getByDate(date);
      if (availability.status !== "blocked") {
        logAvailability("date_check_available", { requestId, date, source: "firestore_live_data" });
        void writeRequestLog(request, {
          requestId,
          domain: "data",
          action: "availability_date_available",
          method: "GET",
          path,
          statusCode: 200,
          metadata: { date }
        });
        return NextResponse.json({ available: true, status: "available", source: "firestore_live_data" });
      }

      logAvailability("date_check_blocked", { requestId, date, source: "blocked_dates" });
      void writeRequestLog(request, {
        requestId,
        domain: "data",
        action: "availability_date_blocked",
        method: "GET",
        path,
        statusCode: 200,
        metadata: { date }
      });
      return NextResponse.json({
        available: false,
        status: "blocked",
        source: "blocked_dates",
        blockedDate: { date, note: availability.note }
      });
    }

    const parsedMonth = monthSchema.safeParse(month ?? undefined);
    if (!parsedMonth.success) {
      return NextResponse.json({ message: "Invalid month query. Use YYYY-MM." }, { status: 400 });
    }

    const selectedMonth = parsedMonth.data ?? monthFromNow();
    const mergedAvailability = await availabilityDataService.getForMonth(selectedMonth);
    const blockedByMonth = mergedAvailability.filter((entry) => entry.status === "blocked");

    logAvailability("month_view", {
      requestId,
      month: selectedMonth,
      blockedDates: blockedByMonth.length,
      mergedRecords: mergedAvailability.length
    });

    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "availability_month",
      method: "GET",
      path,
      statusCode: 200,
      metadata: { month: selectedMonth, records: mergedAvailability.length }
    });

    return NextResponse.json({ availability: mergedAvailability });
  } catch (error) {
    console.error("[availability] request_failed", {
      requestId,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "availability_error",
      method: "GET",
      path,
      statusCode: 500,
      metadata: { message: error instanceof Error ? error.message : String(error) }
    });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load availability" },
      { status: 500 }
    );
  }
}

export async function getContactsRoute(request: Request) {
  const requestId = crypto.randomUUID();
  const path = new URL(request.url).pathname;
  const authError = requireAdminRequest(request);
  if (authError) {
    const status = authError === "Unauthorized" ? 401 : 503;
    return NextResponse.json({ message: authError }, { status });
  }

  try {
    const messages = await contactDataService.list();
    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "contacts_list",
      method: "GET",
      path,
      statusCode: 200,
      metadata: { count: messages.length }
    });
    return NextResponse.json({ messages });
  } catch (error) {
    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "contacts_list_error",
      method: "GET",
      path,
      statusCode: 500,
      metadata: { message: error instanceof Error ? error.message : String(error) }
    });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load contact messages" },
      { status: 500 }
    );
  }
}

export async function postContactsRoute(request: Request) {
  const requestId = crypto.randomUUID();
  const path = new URL(request.url).pathname;

  try {
    const rateLimit = checkRateLimit(request, "contact-submit", { windowMs: 10 * 60 * 1000, maxRequests: 20 });
    if (rateLimit.limited) {
      const response = NextResponse.json(
        { message: "Too many contact attempts. Please try again later." },
        { status: 429 }
      );
      withRetryAfter(response, rateLimit.retryAfterSeconds);
      void writeRequestLog(request, {
        requestId,
        domain: "data",
        action: "contact_submit_limited",
        method: "POST",
        path,
        statusCode: 429,
        metadata: { retryAfterSeconds: rateLimit.retryAfterSeconds }
      });
      return response;
    }

    const body = await readJsonBody<Record<string, unknown>>(request);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const message = await contactDataService.create(parsed.data);
    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "contact_created",
      method: "POST",
      path,
      statusCode: 201,
      metadata: { contactId: message.id }
    });
    return NextResponse.json(
      {
        message: "Contact inquiry submitted successfully",
        contactId: message.id
      },
      { status: 201 }
    );
  } catch (error) {
    void writeRequestLog(request, {
      requestId,
      domain: "data",
      action: "contact_submit_error",
      method: "POST",
      path,
      statusCode: 500,
      metadata: { message: error instanceof Error ? error.message : String(error) }
    });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to process contact request" },
      { status: 500 }
    );
  }
}