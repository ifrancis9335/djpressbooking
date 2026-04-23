import { NextResponse } from "next/server";
import {
  buildBookingHistoryUrl,
  buildBookingReplyUrl,
  findBookingForCustomerAccess,
  sendCustomerBookingAccessEmail
} from "../../../../lib/customer-access";

interface FindBookingBody {
  email?: string;
  bookingIdOrPhone?: string;
  action?: "email" | "open";
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as FindBookingBody | null;
    const email = body?.email?.trim().toLowerCase() || "";
    const bookingIdOrPhone = body?.bookingIdOrPhone?.trim() || "";
    const action = body?.action === "open" ? "open" : "email";

    if (!email || !bookingIdOrPhone) {
      return NextResponse.json({ message: "Email and booking ID or phone are required." }, { status: 400 });
    }

    const result = await findBookingForCustomerAccess(email, bookingIdOrPhone);
    if (!result.booking) {
      return NextResponse.json({ message: "No matching booking was found for the details provided." }, { status: 404 });
    }

    const replyUrl = buildBookingReplyUrl(result.booking);
    const historyUrl = buildBookingHistoryUrl(result.booking.email);

    if (action === "open") {
      if (result.matchedBy !== "bookingId") {
        return NextResponse.json(
          {
            message: "Direct open is only available when using booking ID. Use email delivery for phone-based lookup.",
            requireEmailDelivery: true
          },
          { status: 403 }
        );
      }

      return NextResponse.json({
        message: "Access verified.",
        redirectUrl: replyUrl
      });
    }

    const emailResult = await sendCustomerBookingAccessEmail({
      to: result.booking.email,
      booking: result.booking,
      replyUrl,
      historyUrl
    });

    if (!emailResult.sent) {
      return NextResponse.json(
        {
          message: "Unable to send booking access email right now. Try Open Chat with booking ID or try again shortly."
        },
        { status: 503 }
      );
    }

    return NextResponse.json({
      message: "A fresh secure booking access link has been sent to your email.",
      sent: true
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to process booking lookup" },
      { status: 500 }
    );
  }
}
