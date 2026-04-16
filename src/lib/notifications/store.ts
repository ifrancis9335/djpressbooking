import { FieldValue } from "firebase-admin/firestore";
import { Booking } from "../../types/booking";
import { AdminNotification } from "../../types/notification";
import { getServerFirestore } from "../firebase/admin";

const NOTIFICATIONS_COLLECTION = "notifications";
const DEFAULT_LIMIT = 25;

function toIsoString(value: string | { toDate?: () => Date } | undefined) {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return new Date().toISOString();
}

export function buildBookingNotificationWritePayload(booking: Booking) {
  return {
    type: "new_booking" as const,
    bookingId: booking.id,
    name: booking.fullName,
    date: booking.eventDate,
    timestamp: FieldValue.serverTimestamp(),
    read: false
  };
}

export function toAdminNotification(id: string, data: Partial<AdminNotification>): AdminNotification {
  return {
    id,
    type: data.type === "new_booking" ? "new_booking" : "new_booking",
    bookingId: data.bookingId ?? "",
    name: data.name ?? "",
    date: data.date ?? "",
    timestamp: toIsoString(data.timestamp),
    read: Boolean(data.read)
  };
}

export function getNotificationsQuery(limitCount = DEFAULT_LIMIT) {
  return getServerFirestore().collection(NOTIFICATIONS_COLLECTION).orderBy("timestamp", "desc").limit(limitCount);
}

export async function listNotifications(limitCount = DEFAULT_LIMIT): Promise<AdminNotification[]> {
  const snapshot = await getNotificationsQuery(limitCount).get();
  return snapshot.docs.map((doc) => toAdminNotification(doc.id, doc.data() as Partial<AdminNotification>));
}

export async function markNotificationRead(id: string): Promise<AdminNotification> {
  const db = getServerFirestore();
  const ref = db.collection(NOTIFICATIONS_COLLECTION).doc(id);
  const snapshot = await ref.get();

  if (!snapshot.exists) {
    throw new Error("Notification not found.");
  }

  await ref.set({ read: true }, { merge: true });
  const updated = await ref.get();
  return toAdminNotification(updated.id, updated.data() as Partial<AdminNotification>);
}