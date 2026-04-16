import { getBlockedDateByEventDate, listBlockedDatesForMonth } from "./availability-db";
import { AvailabilityRecord } from "../types/availability";

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
  const blockedDates = await listBlockedDatesForMonth(monthIso);

  const blockedDateSet = new Set(blockedDates.map((entry) => entry.eventDate));
  const dates: AvailabilityRecord[] = [];

  const [yearRaw, monthRaw] = monthIso.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const totalDays = new Date(year, month, 0).getDate();

  for (let day = 1; day <= totalDays; day += 1) {
    const isoDate = `${yearRaw}-${monthRaw.padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (blockedDateSet.has(isoDate)) {
      dates.push(normalizeRecord(isoDate, { status: "blocked", note: "Not available" }));
      continue;
    }

    dates.push(normalizeRecord(isoDate, { status: "available" }));
  }

  return dates.filter((entry) => entry.date >= start && entry.date <= end);
}

export async function getAvailabilityByDate(date: string): Promise<AvailabilityRecord> {
  const blockedDate = await getBlockedDateByEventDate(date);

  if (blockedDate?.status === "blocked") {
    return normalizeRecord(date, { status: "blocked", note: blockedDate.note || "Not available" });
  }

  return normalizeRecord(date, { status: "available" });
}
