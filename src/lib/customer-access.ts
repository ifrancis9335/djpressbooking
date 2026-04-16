import crypto from "crypto";
import { Booking } from "../types/booking";
import { getLatestBookingMessage, buildBookingReplyToken } from "./booking-threads";
import { getBookingById, listBookingsByCustomerEmail } from "./bookings";
import { toPublicAbsoluteUrl } from "./public-url";

const HISTORY_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 14;

interface HistoryTokenPayload {
  kind: "history";
  email: string;
  exp: number;
}

function getAccessSecret() {
  return process.env.ADMIN_API_KEY || process.env.ADMIN_PASSWORD || "";
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payloadBase64: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payloadBase64).digest("base64url");
}

function timingSafeEqualStrings(left: string, right: string) {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  if (leftBytes.length !== rightBytes.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBytes, rightBytes);
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export function buildCustomerHistoryToken(email: string) {
  const secret = getAccessSecret();
  if (!secret) {
    return "";
  }

  const payload: HistoryTokenPayload = {
    kind: "history",
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + HISTORY_TOKEN_TTL_SECONDS
  };

  const payloadBase64 = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadBase64, secret);
  return `${payloadBase64}.${signature}`;
}

export function verifyCustomerHistoryToken(token: string): { email: string } {
  const secret = getAccessSecret();
  if (!secret) {
    throw new Error("Customer access is not configured.");
  }

  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) {
    throw new Error("Invalid history link.");
  }

  const expectedSignature = signPayload(payloadBase64, secret);
  if (!timingSafeEqualStrings(signature, expectedSignature)) {
    throw new Error("Invalid history link.");
  }

  const payload = JSON.parse(fromBase64Url(payloadBase64)) as HistoryTokenPayload;
  if (payload.kind !== "history" || !payload.email || typeof payload.exp !== "number") {
    throw new Error("Invalid history link.");
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    throw new Error("This history link has expired.");
  }

  return { email: payload.email.trim().toLowerCase() };
}

export function buildBookingReplyUrl(booking: Booking) {
  const token = buildBookingReplyToken(booking);
  return toPublicAbsoluteUrl(`/booking-reply?token=${encodeURIComponent(token)}`);
}

export function buildBookingHistoryUrl(email: string) {
  const token = buildCustomerHistoryToken(email);
  return toPublicAbsoluteUrl(`/booking-history?token=${encodeURIComponent(token)}`);
}

export async function findBookingForCustomerAccess(email: string, bookingIdOrPhone: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const rawIdentifier = bookingIdOrPhone.trim();

  if (!normalizedEmail || !rawIdentifier) {
    return { booking: null, matchedBy: null as "bookingId" | "phone" | null };
  }

  const byId = await getBookingById(rawIdentifier);
  if (byId && byId.email.trim().toLowerCase() === normalizedEmail) {
    return { booking: byId, matchedBy: "bookingId" as const };
  }

  const candidateBookings = await listBookingsByCustomerEmail(normalizedEmail);
  const phoneDigits = normalizePhone(rawIdentifier);
  if (phoneDigits.length >= 7) {
    const byPhone = candidateBookings.find((booking) => normalizePhone(booking.phone) === phoneDigits) || null;
    if (byPhone) {
      return { booking: byPhone, matchedBy: "phone" as const };
    }
  }

  return { booking: null, matchedBy: null as "bookingId" | "phone" | null };
}

export async function listCustomerBookingHistory(email: string) {
  const bookings = await listBookingsByCustomerEmail(email);

  const items = await Promise.all(
    bookings.map(async (booking) => {
      const latestMessage = await getLatestBookingMessage(booking.id, { includeInternal: false });
      return {
        booking,
        latestMessageBody: latestMessage?.body || "No messages yet.",
        latestMessageSender: latestMessage?.senderType || "system",
        latestMessageTimestamp: latestMessage?.timestamp || booking.createdAt
      };
    })
  );

  return items;
}

export async function sendCustomerBookingAccessEmail(input: {
  to: string;
  booking: Booking;
  replyUrl: string;
  historyUrl: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim() || "";
  const from = process.env.BOOKING_NOTIFICATION_EMAIL_FROM?.trim() || "";
  const replyTo = (process.env.BOOKING_REPLY_TO?.trim() || "djpressbookings@gmail.com").trim();

  if (!apiKey || !from) {
    return {
      sent: false,
      reason: "email_not_configured"
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: `Booking Update: Access Link for ${input.booking.eventDate}`,
      replyTo,
      html: `<!doctype html>
<html>
  <body style="font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;padding:20px;">
    <h2 style="margin:0 0 12px;">Your DJ Press booking access links</h2>
    <p style="margin:0 0 14px;line-height:1.5;">Use these private links to return to your booking conversation and booking history.</p>
    <p style="margin:0 0 8px;"><strong>Booking ID:</strong> ${input.booking.id}</p>
    <p style="margin:0 0 8px;"><strong>Event Date:</strong> ${input.booking.eventDate}</p>
    <p style="margin:14px 0;"><a href="${input.replyUrl}" style="color:#0f5fe0;font-weight:700;">Open Booking Chat</a></p>
    <p style="margin:0;"><a href="${input.historyUrl}" style="color:#0f5fe0;font-weight:700;">View Booking History</a></p>
  </body>
</html>`,
      text: [
        "Your DJ Press booking access links",
        `Booking ID: ${input.booking.id}`,
        `Event Date: ${input.booking.eventDate}`,
        "",
        `Open Booking Chat: ${input.replyUrl}`,
        `View Booking History: ${input.historyUrl}`
      ].join("\n")
    })
  });

  if (!response.ok) {
    const details = await response.text();
    return {
      sent: false,
      reason: details || `email_send_failed_${response.status}`
    };
  }

  return {
    sent: true,
    reason: ""
  };
}
