import { NextResponse } from "next/server";
import { createBookingMessage, listCustomerBookingMessages, verifyBookingReplyToken } from "../../../../lib/booking-threads";
import { getSiteSettings } from "../../../../lib/site-settings";
import { sendBookingThreadCustomerReplyNotifications } from "../../../../lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token")?.trim() || "";
    if (!token) {
      return NextResponse.json({ message: "Reply token is required." }, { status: 400 });
    }

    const { booking } = await verifyBookingReplyToken(token);
    const messages = await listCustomerBookingMessages(booking.id);

    return NextResponse.json({
      booking: {
        id: booking.id,
        eventDate: booking.eventDate,
        fullName: booking.fullName
      },
      messages
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load reply thread" },
      { status: 500 }
    );
  }
}

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

export async function POST(request: Request) {
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

    const siteSettings = await getSiteSettings();
    const packageLabel = resolvePackageLabel(booking.packageId, siteSettings);
    const requestId = crypto.randomUUID();

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

    return NextResponse.json({ message: "Reply sent", threadMessage: message }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to send reply" },
      { status: 500 }
    );
  }
}