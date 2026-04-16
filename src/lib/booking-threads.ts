import crypto from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { getServerFirestore } from "./firebase/admin";
import { Booking } from "../types/booking";
import { BookingMessage, BookingMessageSenderType, BookingReplyTokenPayload } from "../types/booking-thread";
import { getBookingById } from "./bookings";

const BOOKINGS_COLLECTION = "bookings";
const MESSAGES_SUBCOLLECTION = "messages";
const REPLY_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 14;

function getReplySecret() {
  return process.env.ADMIN_API_KEY || process.env.ADMIN_PASSWORD || "";
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signReplyPayload(payloadBase64: string, secret: string) {
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

function toIsoString(value: string | { toDate?: () => Date } | undefined) {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return new Date().toISOString();
}

function normalizeMessageBody(body: string) {
  return body.replace(/\r\n/g, "\n").trim();
}

function toBookingMessage(bookingId: string, id: string, data: Partial<BookingMessage>): BookingMessage {
  return {
    id,
    bookingId,
    senderType: data.senderType === "customer" || data.senderType === "system" ? data.senderType : "admin",
    body: data.body ?? "",
    timestamp: toIsoString(data.timestamp),
    read: Boolean(data.read)
  };
}

function getMessagesCollection(bookingId: string) {
  return getServerFirestore().collection(BOOKINGS_COLLECTION).doc(bookingId).collection(MESSAGES_SUBCOLLECTION);
}

export async function listBookingMessages(bookingId: string): Promise<BookingMessage[]> {
  const snapshot = await getMessagesCollection(bookingId).orderBy("timestamp", "asc").get();
  return snapshot.docs.map((doc) => toBookingMessage(bookingId, doc.id, doc.data() as Partial<BookingMessage>));
}

export async function getLatestBookingMessage(bookingId: string): Promise<BookingMessage | null> {
  const snapshot = await getMessagesCollection(bookingId).orderBy("timestamp", "desc").limit(1).get();
  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return toBookingMessage(bookingId, doc.id, doc.data() as Partial<BookingMessage>);
}

export async function listAdminBookingMessages(bookingId: string): Promise<BookingMessage[]> {
  const db = getServerFirestore();
  const messagesRef = getMessagesCollection(bookingId);
  const snapshot = await messagesRef.orderBy("timestamp", "asc").get();
  const unreadCustomerMessages = snapshot.docs.filter((doc) => {
    const data = doc.data() as Partial<BookingMessage>;
    return data.senderType === "customer" && !data.read;
  });

  if (unreadCustomerMessages.length > 0) {
    const batch = db.batch();
    unreadCustomerMessages.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
  }

  return snapshot.docs.map((doc) =>
    toBookingMessage(bookingId, doc.id, {
      ...(doc.data() as Partial<BookingMessage>),
      read: (doc.data() as Partial<BookingMessage>).senderType === "customer" ? true : Boolean((doc.data() as Partial<BookingMessage>).read)
    })
  );
}

export async function listCustomerBookingMessages(bookingId: string): Promise<BookingMessage[]> {
  const db = getServerFirestore();
  const messagesRef = getMessagesCollection(bookingId);
  const snapshot = await messagesRef.orderBy("timestamp", "asc").get();
  const unreadAdminMessages = snapshot.docs.filter((doc) => {
    const data = doc.data() as Partial<BookingMessage>;
    return (data.senderType === "admin" || data.senderType === "system") && !data.read;
  });

  if (unreadAdminMessages.length > 0) {
    const batch = db.batch();
    unreadAdminMessages.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    await batch.commit();
  }

  return snapshot.docs.map((doc) =>
    toBookingMessage(bookingId, doc.id, {
      ...(doc.data() as Partial<BookingMessage>),
      read:
        (doc.data() as Partial<BookingMessage>).senderType === "admin" || (doc.data() as Partial<BookingMessage>).senderType === "system"
          ? true
          : Boolean((doc.data() as Partial<BookingMessage>).read)
    })
  );
}

export async function createBookingMessage(input: {
  bookingId: string;
  senderType: BookingMessageSenderType;
  body: string;
  read?: boolean;
}): Promise<BookingMessage> {
  const booking = await getBookingById(input.bookingId);
  if (!booking) {
    throw new Error("Booking not found.");
  }

  const normalizedBody = normalizeMessageBody(input.body);
  if (!normalizedBody) {
    throw new Error("Message body is required.");
  }

  const docRef = getMessagesCollection(input.bookingId).doc();
  await docRef.set({
    senderType: input.senderType,
    body: normalizedBody,
    timestamp: FieldValue.serverTimestamp(),
    read: typeof input.read === "boolean" ? input.read : false
  });

  const saved = await docRef.get();
  return toBookingMessage(input.bookingId, saved.id, saved.data() as Partial<BookingMessage>);
}

export function buildBookingReplyToken(booking: Booking) {
  const secret = getReplySecret();
  if (!secret) {
    return "";
  }

  const payload: BookingReplyTokenPayload = {
    bookingId: booking.id,
    email: booking.email,
    exp: Math.floor(Date.now() / 1000) + REPLY_TOKEN_TTL_SECONDS
  };
  const payloadBase64 = toBase64Url(JSON.stringify(payload));
  const signature = signReplyPayload(payloadBase64, secret);
  return `${payloadBase64}.${signature}`;
}

export async function verifyBookingReplyToken(token: string): Promise<{ booking: Booking; payload: BookingReplyTokenPayload }> {
  const secret = getReplySecret();
  if (!secret) {
    throw new Error("Reply flow is not configured.");
  }

  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) {
    throw new Error("Invalid reply link.");
  }

  const expectedSignature = signReplyPayload(payloadBase64, secret);
  if (!timingSafeEqualStrings(signature, expectedSignature)) {
    throw new Error("Invalid reply link.");
  }

  const payload = JSON.parse(fromBase64Url(payloadBase64)) as BookingReplyTokenPayload;
  if (!payload.bookingId || !payload.email || typeof payload.exp !== "number") {
    throw new Error("Invalid reply link.");
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    throw new Error("This reply link has expired.");
  }

  const booking = await getBookingById(payload.bookingId);
  if (!booking || booking.email.trim().toLowerCase() !== payload.email.trim().toLowerCase()) {
    throw new Error("Invalid reply link.");
  }

  return { booking, payload };
}