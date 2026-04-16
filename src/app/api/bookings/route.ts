import { NextResponse } from "next/server";
import {
  BookingConflictError,
  createBooking,
  getBookingByDate,
  getBookings,
  updateBookingStatus
} from "../../../lib/bookings";
import { bookingSchema } from "../../../lib/validators/booking";
import { isoDateSchema } from "../../../lib/validators/api";
import { BookingStatus } from "../../../types/booking";
import { requireAdminCsrf, requireAdminRequest } from "../../../lib/admin-auth";
import { logAdminActivity } from "../../../lib/admin-activity";
import { isFirebaseAdminConfigured } from "../../../lib/firebase/admin";
import { getSiteSettings } from "../../../lib/site-settings";
import { isDateAvailable } from "../../../lib/availability-db";
import { stripUndefinedFields } from "../../../utils/sanitize";
import { checkRateLimit } from "../../../lib/security/rate-limit";
import { sendBookingCreatedNotifications, sendBookingStatusUpdatedNotifications } from "../../../lib/notifications";
import { buildBookingReplyToken } from "../../../lib/booking-threads";

const validStatuses: BookingStatus[] = [
  "new",
  "awaiting_response",
  "pending_deposit",
  "confirmed",
  "completed",
  "cancelled"
];

function resolvePackageLabel(packageId: string | undefined, siteSettings: Awaited<ReturnType<typeof getSiteSettings>>) {
  if (!packageId?.trim()) {
    return "Not selected";
  }

  const packageNameById: Record<string, string> = {
    basic: siteSettings.packages.basic.name || "Basic",
    premium: siteSettings.packages.premium.name || "Premium",
    vip: siteSettings.packages.vip.name || "Luxury / VIP"
  };

  return packageNameById[packageId.trim().toLowerCase()] || packageId;
}

function getCustomerStatus(status: BookingStatus): "reviewed" | "confirmed" | "declined" | null {
  if (status === "pending_deposit") return "reviewed";
  if (status === "confirmed") return "confirmed";
  if (status === "cancelled") return "declined";
  return null;
}

function toDeliveryStatus(result: { attempted: boolean; sent: boolean }) {
  if (!result.attempted) return "skipped";
  if (result.sent) return "sent";
  return "failed";
}

export async function GET(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ message: "Firebase Admin is not configured." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (date) {
      const parsedDate = isoDateSchema.safeParse(date);
      if (!parsedDate.success) {
        return NextResponse.json({ message: "Invalid date query. Use YYYY-MM-DD." }, { status: 400 });
      }
      const booking = await getBookingByDate(date);
      return NextResponse.json({ booking });
    }

    const bookings = await getBookings();
    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load bookings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  const csrfError = requireAdminCsrf(request);
  if (csrfError) {
    return NextResponse.json({ message: csrfError }, { status: 403 });
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ message: "Firebase Admin is not configured." }, { status: 503 });
  }

  try {
    const requestId = crypto.randomUUID();
    const body = (await request.json().catch(() => null)) as { id?: string; status?: BookingStatus } | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }
    if (!body.id || !body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json({ message: "Valid booking id and status are required" }, { status: 400 });
    }

    const siteSettings = await getSiteSettings();
    const { booking, previousStatus } = await updateBookingStatus(body.id, body.status);
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
      const flow = customerStatus === "reviewed" ? "status_reviewed" : customerStatus === "confirmed" ? "status_confirmed" : "status_declined";
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

    return NextResponse.json({ message: "Booking status updated", booking });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update booking status" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    console.info("[bookings] submit_request", { requestId });
  }

  const rateLimit = checkRateLimit(request, "bookings-submit", { windowMs: 10 * 60 * 1000, maxRequests: 30 });
  if (rateLimit.limited) {
    const response = NextResponse.json({ message: "Too many booking attempts. Please try again shortly." }, { status: 429 });
    response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
    return response;
  }

  if (!isFirebaseAdminConfigured()) {
    console.warn("[bookings] firebase_not_configured", { requestId });
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

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }
    if (isDev) {
      console.info("[bookings] submit_payload_received", {
        requestId,
        eventDate: typeof body?.eventDate === "string" ? body.eventDate : "unknown"
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

    const booking = await createBooking(cleanedPayload);
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

    return NextResponse.json(
      {
        message: "Booking inquiry submitted successfully",
        booking,
        replyToken
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof BookingConflictError) {
      console.warn("[bookings] booking_conflict", { requestId, message: error.message });
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error("[bookings] booking_failed", {
      requestId,
      message: error instanceof Error ? error.message : "Unknown error"
    });

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to process booking request" },
      { status: 500 }
    );
  }
}
