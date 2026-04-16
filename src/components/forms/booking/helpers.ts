import { BookingRequest } from "../../../types/booking";

export const week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const initialState: BookingRequest = {
  fullName: "",
  email: "",
  phone: "",
  eventType: "",
  eventDate: "",
  preferredContactMethod: "email",
  specialNotes: ""
};

export function toIsoDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toMonthIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function parseIsoDate(value: string) {
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return new Date(year, month - 1, day);
}

export function normalizePackageId(value: string | null, allowedPackageIds: Set<string>) {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return allowedPackageIds.has(normalized) ? normalized : null;
}
