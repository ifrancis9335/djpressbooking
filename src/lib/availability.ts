import { getServerFirestore } from "./firebase";
import { AvailabilityRecord } from "../types/availability";

const COLLECTION = "availability";

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthRange(monthIso: string) {
  const [yearRaw, monthRaw] = monthIso.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid month format. Use YYYY-MM.");
  }

  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  return { start: formatIsoDate(first), end: formatIsoDate(last) };
}

function toIsoString(input: AvailabilityRecord["updatedAt"] | undefined) {
  if (!input) return new Date().toISOString();
  if (typeof input === "string") return input;
  if (typeof input === "object" && input !== null && "toDate" in input && typeof input.toDate === "function") {
    return input.toDate().toISOString();
  }
  return new Date().toISOString();
}

function normalizeRecord(date: string, input?: Partial<AvailabilityRecord>): AvailabilityRecord {
  return {
    date,
    status: input?.status ?? "available",
    note: input?.note,
    bookingId: input?.bookingId,
    updatedAt: toIsoString(input?.updatedAt)
  };
}

export async function getAvailabilityForMonth(monthIso: string): Promise<AvailabilityRecord[]> {
  const { start, end } = monthRange(monthIso);
  const db = getServerFirestore();
  const snapshot = await db
    .collection(COLLECTION)
    .where("date", ">=", start)
    .where("date", "<=", end)
    .orderBy("date", "asc")
    .get();

  return snapshot.docs.map((doc) => normalizeRecord(doc.id, doc.data() as Partial<AvailabilityRecord>));
}

export async function getAvailabilityByDate(date: string): Promise<AvailabilityRecord> {
  const db = getServerFirestore();
  const doc = await db.collection(COLLECTION).doc(date).get();

  if (!doc.exists) {
    return normalizeRecord(date, { status: "available" });
  }

  return normalizeRecord(doc.id, doc.data() as Partial<AvailabilityRecord>);
}
