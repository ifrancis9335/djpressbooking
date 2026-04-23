import { NextResponse } from "next/server";
import { z } from "zod";
import { logAdminActivity } from "../admin-activity";
import { requireAdminCsrf, requireAdminRequest } from "../auth/admin";
import {
  createBookingMessage,
  listAdminBookingMessages,
  listCustomerBookingMessages,
  verifyBookingReplyToken
} from "../booking-threads";
import { getBookingById } from "../bookings";
import { sendBookingThreadAdminMessageNotifications, sendBookingThreadCustomerReplyNotifications } from "../notifications";
import { getSiteSettings } from "../site-settings";
import { writeRequestLog } from "../data/request-logs";

const adminBookingParamsSchema = z.object({
  bookingId: z.string().trim().min(1)
});

const adminBookingMessageBodySchema = z.object({
  body: z.string().trim().min(1),
  visibility: z.enum(["customer", "internal"]).optional()
});

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

function toDeliveryStatus(result: { attempted: boolean; sent: boolean }) {
  if (!result.attempted) return "skipped";
  if (result.sent) return "sent";
  return "failed";
}

function toPublicReplyMessage(message: Awaited<ReturnType<typeof listCustomerBookingMessages>>[number]) {
  return {
    id: message.id,
    senderType: message.senderType,
    body: message.body,
    timestamp: message.timestamp,
    read: message.read
  };
}

export async function getPublicBookingReplyRoute(request: Request) {
  const requestId = crypto.randomUUID();
  const path = new URL(request.url).pathname;

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")?.trim() || "";
    if (!token) {
      return NextResponse.json({ message: "Reply token is required." }, { status: 400 });
    }

    const { booking } = await verifyBookingReplyToken(token);
    const messages = await listCustomerBookingMessages(booking.id);
    void writeRequestLog(request, {
      requestId,
      domain: "chat",
      action: "booking_reply_thread_loaded",
      method: "GET",
      path,
      statusCode: 200,
      metadata: { bookingId: booking.id, messageCount: messages.length }
    });

    return NextResponse.json({ messages: messages.map(toPublicReplyMessage) });
  } catch (error) {
    void writeRequestLog(request, {
      requestId,
      domain: "chat",
      action: "booking_reply_thread_error",
      method: "GET",
      path,
      statusCode: 500,
      metadata: { message: error instanceof Error ? error.message : String(error) }
    });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load reply thread" },
      { status: 500 }
    );
  }
}

export async function postPublicBookingReplyRoute(request: Request) {
  const requestId = crypto.randomUUID();
  const path = new URL(request.url).pathname;

  try {
    const body = (await request.json().catch(() => null)) as { token?: string; body?: string } | null;
    if (!body || typeof body.token !== "string" || typeof body.body !== "string") {
      return NextResponse.json({ message: "Reply token and message body are required." }, { status: 400 });
    }

    const { booking } = await verifyBookingReplyToken(body.token);
    const message = await createBookingMessage({
      bookingId: booking.id,
      senderType: "customer",
      body: body.body,
      read: false
    });

    await logAdminActivity({
      bookingId: booking.id,
      action: "customer_reply_received",
      actorType: "customer",
      summary: `Customer reply received from ${booking.fullName}`,
      booking,
      metadata: {
        messagePreview: message.body.slice(0, 160)
      }
    });

    const siteSettings = await getSiteSettings();
    const packageLabel = resolvePackageLabel(booking.packageId, siteSettings);

    void sendBookingThreadCustomerReplyNotifications({
      booking,
      message,
      packageLabel,
      businessContact: siteSettings.contact
    })
      .then((results) => {
        const failed = results.filter((result) => result.attempted && !result.sent);
        if (failed.length > 0) {
          console.warn("[booking-threads] customer_reply_delivery_issues", {
            requestId,
            bookingId: booking.id,
            failedChannels: failed.map((item) => ({ channel: item.channel, reason: item.reason || "unknown" }))
          });
        }
      })
      .catch((notificationError) => {
        console.error("[booking-threads] customer_reply_delivery_failed", {
          requestId,
          bookingId: booking.id,
          message: notificationError instanceof Error ? notificationError.message : String(notificationError)
        });
      });

    void writeRequestLog(request, {
      requestId,
      domain: "chat",
      action: "booking_reply_sent",
      method: "POST",
      path,
      statusCode: 201,
      metadata: { bookingId: booking.id, messageId: message.id }
    });

    return NextResponse.json({ message: "Reply sent" }, { status: 201 });
  } catch (error) {
    void writeRequestLog(request, {
      requestId,
      domain: "chat",
      action: "booking_reply_send_error",
      method: "POST",
      path,
      statusCode: 500,
      metadata: { message: error instanceof Error ? error.message : String(error) }
    });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to send reply" },
      { status: 500 }
    );
  }
}

export async function getAdminBookingMessagesRoute(
  request: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  const requestId = crypto.randomUUID();
  const path = new URL(request.url).pathname;
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  try {
    const parsedParams = adminBookingParamsSchema.safeParse(await context.params);
    if (!parsedParams.success) {
      return NextResponse.json(
        { ok: false, message: "Invalid request.", errors: parsedParams.error.flatten() },
        { status: 400 }
      );
    }

    const { bookingId } = parsedParams.data;
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    }

    const messages = await listAdminBookingMessages(bookingId);
    void writeRequestLog(request, {
      requestId,
      domain: "chat",
      action: "admin_messages_list",
      method: "GET",
      path,
      statusCode: 200,
      metadata: { bookingId, messageCount: messages.length }
    });
    return NextResponse.json({ messages });
  } catch (error) {
    void writeRequestLog(request, {
      requestId,
      domain: "chat",
      action: "admin_messages_list_error",
      method: "GET",
      path,
      statusCode: 500,
      metadata: { message: error instanceof Error ? error.message : String(error) }
    });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load booking messages" },
      { status: 500 }
    );
  }
}

export async function postAdminBookingMessagesRoute(
  request: Request,
  context: { params: Promise<{ bookingId: string }> }
) {
  const requestId = crypto.randomUUID();
  const path = new URL(request.url).pathname;
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  const csrfError = requireAdminCsrf(request);
  if (csrfError) {
    return NextResponse.json({ message: csrfError }, { status: 403 });
  }

  try {
    const parsedParams = adminBookingParamsSchema.safeParse(await context.params);
    if (!parsedParams.success) {
      return NextResponse.json(
        { ok: false, message: "Invalid request.", errors: parsedParams.error.flatten() },
        { status: 400 }
      );
    }

    const { bookingId } = parsedParams.data;
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as unknown;
    const parsedBody = adminBookingMessageBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { ok: false, message: "Invalid request.", errors: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const visibility = parsedBody.data.visibility === "internal" ? "internal" : "customer";
    const message = await createBookingMessage({
      bookingId,
      senderType: visibility === "internal" ? "internal" : "admin",
      body: parsedBody.data.body,
      read: visibility === "internal"
    });

    await logAdminActivity({
      bookingId,
      action: visibility === "internal" ? "internal_note_added" : "thread_message_sent",
      actorType: "admin",
      summary:
        visibility === "internal"
          ? `Internal note added for ${booking.fullName}`
          : `Admin message sent to ${booking.fullName}`,
      booking,
      metadata: {
        messagePreview: message.body.slice(0, 160),
        visibility
      }
    });

    if (visibility === "internal") {
      void writeRequestLog(request, {
        requestId,
        domain: "chat",
        action: "admin_internal_note_saved",
        method: "POST",
        path,
        statusCode: 201,
        metadata: { bookingId, messageId: message.id }
      });
      return NextResponse.json({ message: "Internal note saved", threadMessage: message }, { status: 201 });
    }

    const siteSettings = await getSiteSettings();
    const packageLabel = resolvePackageLabel(booking.packageId, siteSettings);
    const recipient = booking.email?.trim().toLowerCase() || "";

    try {
      const results = await sendBookingThreadAdminMessageNotifications({
        booking,
        message,
        packageLabel,
        businessContact: siteSettings.contact
      });

      results.forEach((result) => {
        const deliveryStatus = toDeliveryStatus(result);
        const logger = deliveryStatus === "sent" ? console.info : console.warn;
        logger("[booking-threads] customer_notification_delivery", {
          requestId,
          flow: "admin_thread_message",
          bookingId,
          recipient,
          channel: result.channel,
          deliveryStatus,
          reason: result.reason || ""
        });
      });
    } catch (notificationError) {
      console.error("[booking-threads] customer_notification_delivery", {
        requestId,
        flow: "admin_thread_message",
        bookingId,
        recipient,
        channel: "email",
        deliveryStatus: "failed",
        reason: notificationError instanceof Error ? notificationError.message : String(notificationError)
      });
    }

    void writeRequestLog(request, {
      requestId,
      domain: "chat",
      action: "admin_message_sent",
      method: "POST",
      path,
      statusCode: 201,
      metadata: { bookingId, messageId: message.id }
    });
    return NextResponse.json({ message: "Message sent", threadMessage: message }, { status: 201 });
  } catch (error) {
    void writeRequestLog(request, {
      requestId,
      domain: "chat",
      action: "admin_message_send_error",
      method: "POST",
      path,
      statusCode: 500,
      metadata: { message: error instanceof Error ? error.message : String(error) }
    });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to send booking message" },
      { status: 500 }
    );
  }
}