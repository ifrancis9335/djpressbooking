import { FieldValue } from "firebase-admin/firestore";
import { Booking } from "../types/booking";
import {
  AdminActivity,
  AdminActivityAction,
  AdminActivityActorType,
  AdminActivityMetadataValue
} from "../types/admin-activity";
import { getServerFirestore } from "./firebase/admin";

const ADMIN_ACTIVITY_COLLECTION = "admin_activity";

function toIsoString(value: string | { toDate?: () => Date } | undefined) {
  if (!value) {
    return new Date().toISOString();
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value !== null && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }

  return new Date().toISOString();
}

function toMetadata(
  input: Record<string, AdminActivityMetadataValue> | undefined
): Record<string, AdminActivityMetadataValue> {
  if (!input) {
    return {};
  }

  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

function toAdminActivity(id: string, data: Partial<AdminActivity>): AdminActivity {
  return {
    id,
    bookingId: data.bookingId ?? "",
    action: data.action ?? "booking_created",
    actorType: data.actorType ?? "system",
    summary: data.summary ?? "",
    customerName: data.customerName ?? "",
    eventDate: data.eventDate ?? "",
    createdAt: toIsoString(data.createdAt),
    metadata:
      data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata)
        ? (data.metadata as Record<string, AdminActivityMetadataValue>)
        : {}
  };
}

export async function logAdminActivity(input: {
  bookingId: string;
  action: AdminActivityAction;
  actorType: AdminActivityActorType;
  summary: string;
  booking?: Pick<Booking, "id" | "fullName" | "eventDate"> | null;
  metadata?: Record<string, AdminActivityMetadataValue>;
}) {
  if (!input.bookingId.trim()) {
    return;
  }

  const db = getServerFirestore();
  await db.collection(ADMIN_ACTIVITY_COLLECTION).add({
    bookingId: input.bookingId.trim(),
    action: input.action,
    actorType: input.actorType,
    summary: input.summary.trim(),
    customerName: input.booking?.fullName?.trim() || "",
    eventDate: input.booking?.eventDate?.trim() || "",
    metadata: toMetadata(input.metadata),
    createdAt: FieldValue.serverTimestamp()
  });
}

export async function listAdminActivity(options?: {
  bookingId?: string;
  limit?: number;
}): Promise<AdminActivity[]> {
  const db = getServerFirestore();
  const requestedLimit = options?.limit ?? 12;
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.floor(requestedLimit), 1), 50) : 12;
  const bookingId = options?.bookingId?.trim() || "";

  if (bookingId) {
    const snapshot = await db.collection(ADMIN_ACTIVITY_COLLECTION).where("bookingId", "==", bookingId).get();
    return snapshot.docs
      .map((doc) => toAdminActivity(doc.id, doc.data() as Partial<AdminActivity>))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, limit);
  }

  const snapshot = await db.collection(ADMIN_ACTIVITY_COLLECTION).orderBy("createdAt", "desc").limit(limit).get();
  return snapshot.docs.map((doc) => toAdminActivity(doc.id, doc.data() as Partial<AdminActivity>));
}
