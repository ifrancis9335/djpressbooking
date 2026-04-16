import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { logAdminDebug, logAdminDebugError } from "./admin-debug";
import { getServerFirestore } from "./firebase/admin";

export type BlockedDateStatus = "blocked" | "available";

const BLOCKED_DATES_COLLECTION = "blocked_dates";

export interface BlockedDateRow {
  id: string;
  eventDate: string;
  status: BlockedDateStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

function toIsoString(value: string | Date | { toDate?: () => Date } | undefined) {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && value !== null && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return new Date().toISOString();
}

function mapBlockedDateDoc(
  id: string,
  data: Partial<{
    date: string;
    note: string | null;
    createdAt: string | Date | { toDate?: () => Date };
    updatedAt: string | Date | { toDate?: () => Date };
  }>
): BlockedDateRow {
  return {
    id,
    eventDate: data.date ?? id,
    status: "blocked",
    note: data.note ?? null,
    createdAt: toIsoString(data.createdAt),
    updatedAt: toIsoString(data.updatedAt)
  };
}

export async function isDateAvailable(date: string): Promise<boolean> {
  const db = getServerFirestore();

  const blockedDates = await db.collection(BLOCKED_DATES_COLLECTION)
    .where("date", "==", date)
    .get();

  if (!blockedDates.empty) return false;

  return true;
}

export async function getBlockedDateByEventDate(date: string): Promise<BlockedDateRow | null> {
  const db = getServerFirestore();
  const snapshot = await db.collection(BLOCKED_DATES_COLLECTION).where("date", "==", date).limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return mapBlockedDateDoc(doc.id, doc.data());
}

export async function listBlockedDates(): Promise<BlockedDateRow[]> {
  try {
    const db = getServerFirestore();
    const snapshot = await db.collection(BLOCKED_DATES_COLLECTION).orderBy("date", "asc").get();

    logAdminDebug("blocked_dates_list_success", { count: snapshot.size });
    return snapshot.docs.map((doc) => mapBlockedDateDoc(doc.id, doc.data()));
  } catch (error) {
    logAdminDebugError("blocked_dates_list_error", error);
    throw error;
  }
}

export async function listBlockedDatesForMonth(monthIso: string): Promise<BlockedDateRow[]> {
  const [yearRaw, monthRaw] = monthIso.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid month format. Use YYYY-MM.");
  }

  const start = `${yearRaw}-${monthRaw.padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${yearRaw}-${monthRaw.padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const db = getServerFirestore();
  const snapshot = await db.collection(BLOCKED_DATES_COLLECTION)
    .where("date", ">=", start)
    .where("date", "<=", end)
    .orderBy("date", "asc")
    .get();

  return snapshot.docs.map((doc) => mapBlockedDateDoc(doc.id, doc.data()));
}

export async function blockDate(date: string, note?: string): Promise<BlockedDateRow> {
  const db = getServerFirestore();
  const docRef = db.collection(BLOCKED_DATES_COLLECTION).doc(date);
  const existing = await docRef.get();
  const now = FieldValue.serverTimestamp();

  await docRef.set(
    {
      date,
      note: note?.trim() || null,
      createdAt: existing.exists ? existing.data()?.createdAt ?? now : now,
      updatedAt: now
    },
    { merge: true }
  );

  const updated = await docRef.get();
  return mapBlockedDateDoc(updated.id, updated.data() ?? { date, note: note?.trim() || null });
}

export async function unblockDate(date: string): Promise<BlockedDateRow | null> {
  const current = await getBlockedDateByEventDate(date);
  if (!current) {
    return null;
  }

  const db = getServerFirestore();
  await db.collection(BLOCKED_DATES_COLLECTION).doc(current.id).delete();

  return {
    ...current,
    status: "available",
    note: null,
    updatedAt: new Date().toISOString()
  };
}
