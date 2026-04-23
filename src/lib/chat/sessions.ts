import { FieldValue } from "firebase-admin/firestore";
import { getServerFirestore, isFirebaseAdminConfigured } from "../firebase/admin";
import type { ChatBookingSessionState } from "./types";

export interface ChatSessionRecord {
  requestId: string;
  conversationId?: string;
  eventType?: string;
  eventDate?: string;
  location?: string;
  guestCount?: number;
  readyForBooking: boolean;
  conversionIntent: string;
  lastMessageAt?: unknown;
  createdAt?: unknown;
}

function normalizeTimestamp(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (typeof value === "object" && value !== null) {
    if ("toDate" in value && typeof (value as { toDate?: () => Date }).toDate === "function") {
      const date = (value as { toDate: () => Date }).toDate();
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }

    if ("seconds" in value && typeof (value as { seconds?: number }).seconds === "number") {
      const date = new Date((value as { seconds: number }).seconds * 1000);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }
  }

  return null;
}

function mapChatSessionRecord(doc: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>) {
  const data = doc.data() as ChatSessionRecord;
  return {
    id: doc.id,
    requestId: data.requestId,
    conversationId: data.conversationId ?? null,
    eventType: data.eventType ?? null,
    eventDate: data.eventDate ?? null,
    location: data.location ?? null,
    guestCount: typeof data.guestCount === "number" ? data.guestCount : null,
    readyForBooking: Boolean(data.readyForBooking),
    conversionIntent: data.conversionIntent || "unknown",
    createdAt: normalizeTimestamp(data.createdAt),
    updatedAt: normalizeTimestamp(data.lastMessageAt ?? data.createdAt)
  };
}

export async function persistChatSession(input: {
  requestId: string;
  bookingFlow?: ChatBookingSessionState;
  readyForBooking: boolean;
  conversionIntent: string;
}) {
  if (!isFirebaseAdminConfigured()) {
    return false;
  }

  try {
    await getServerFirestore().collection("chat_sessions").add({
      requestId: input.requestId,
      eventType: input.bookingFlow?.eventType || null,
      eventDate: input.bookingFlow?.date || null,
      location: input.bookingFlow?.location || null,
      guestCount: input.bookingFlow?.guestCount || null,
      readyForBooking: input.readyForBooking,
      conversionIntent: input.conversionIntent,
      lastMessageAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp()
    } as ChatSessionRecord);

    return true;
  } catch (error) {
    console.error("[CHAT SESSION PERSIST ERROR]", error);
    return false;
  }
}

export async function getRecentChatSessions(limit: number = 10) {
  if (!isFirebaseAdminConfigured()) {
    return [];
  }

  try {
    const snapshot = await getServerFirestore()
      .collection("chat_sessions")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return snapshot.docs.map(mapChatSessionRecord);
  } catch (error) {
    console.error("[CHAT SESSION FETCH ERROR]", error);
    return [];
  }
}

export async function getReadyForBookingSessions() {
  if (!isFirebaseAdminConfigured()) {
    return [];
  }

  try {
    const snapshot = await getServerFirestore()
      .collection("chat_sessions")
      .where("readyForBooking", "==", true)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    return snapshot.docs.map(mapChatSessionRecord);
  } catch (error) {
    console.error("[READY FOR BOOKING SESSIONS FETCH ERROR]", error);
    return [];
  }
}
