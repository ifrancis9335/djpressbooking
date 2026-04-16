import { NextResponse } from "next/server";
import { logAdminActivity } from "../../../../../../lib/admin-activity";
import { requireAdminCsrf, requireAdminRequest } from "../../../../../../lib/admin-auth";
import { createBookingMessage, listAdminBookingMessages } from "../../../../../../lib/booking-threads";
import { getBookingById } from "../../../../../../lib/bookings";
import { getSiteSettings } from "../../../../../../lib/site-settings";
import { sendBookingThreadAdminMessageNotifications } from "../../../../../../lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  try {
    const { bookingId } = await context.params;
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    }

    const messages = await listAdminBookingMessages(bookingId);
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load booking messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: { params: Promise<{ bookingId: string }> }) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  const csrfError = requireAdminCsrf(request);
  if (csrfError) {
    return NextResponse.json({ message: csrfError }, { status: 403 });
  }

  try {
    const { bookingId } = await context.params;
    const booking = await getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as { body?: string; visibility?: "customer" | "internal" } | null;
    if (!body || typeof body.body !== "string") {
      return NextResponse.json({ message: "Message body is required." }, { status: 400 });
    }

    const visibility = body.visibility === "internal" ? "internal" : "customer";

    const message = await createBookingMessage({
      bookingId,
      senderType: visibility === "internal" ? "internal" : "admin",
      body: body.body,
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
      return NextResponse.json({ message: "Internal note saved", threadMessage: message }, { status: 201 });
    }

    const siteSettings = await getSiteSettings();
    const packageLabel = resolvePackageLabel(booking.packageId, siteSettings);
    const requestId = crypto.randomUUID();
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

    return NextResponse.json({ message: "Message sent", threadMessage: message }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to send booking message" },
      { status: 500 }
    );
  }
}