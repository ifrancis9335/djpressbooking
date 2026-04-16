import { FieldValue } from "firebase-admin/firestore";
import { getServerFirestore } from "./firebase/admin";
import { Booking, BookingRequest, BookingStatus } from "../types/booking";
import { AvailabilityRecord } from "../types/availability";
import { stripUndefinedFields } from "../utils/sanitize";
import { buildBookingNotificationWritePayload } from "./notifications/store";

const BOOKINGS_COLLECTION = "bookings";
const BLOCKED_DATES_COLLECTION = "blocked_dates";

export class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingConflictError";
  }
}

function isIsoDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function localTodayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function isPastDate(date: string) {
  return date < localTodayIso();
}

function toIsoString(value: Booking["createdAt"] | { toDate?: () => Date } | undefined) {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "object" && value.toDate) return value.toDate().toISOString();
  return new Date().toISOString();
}

function toBooking(id: string, data: Partial<Booking>): Booking {
  return {
    id,
    createdAt: toIsoString(data.createdAt),
    fullName: data.fullName ?? "",
    email: data.email ?? "",
    phone: data.phone ?? "",
    eventType: data.eventType ?? "",
    eventDate: data.eventDate ?? "",
    startTime: data.startTime ?? "",
    endTime: data.endTime ?? "",
    venueName: data.venueName ?? "",
    venueAddress: data.venueAddress ?? "",
    city: data.city ?? "",
    settingType: data.settingType ?? "indoor",
    guestCount: data.guestCount ?? 1,
    genres: data.genres ?? "",
    cleanMusic: data.cleanMusic ?? "yes",
    mcService: data.mcService ?? "no",
    lights: data.lights ?? "no",
    packageId: data.packageId || undefined,
    addOns: data.addOns ?? data.selectedAddOns ?? [],
    selectedAddOns: data.selectedAddOns ?? data.addOns ?? [],
    budgetRange: data.budgetRange ?? "",
    preferredContactMethod: data.preferredContactMethod ?? "email",
    specialNotes: data.specialNotes ?? "",
    status: data.status ?? "new"
  };
}

function toAvailabilityRecord(date: string, input: Partial<AvailabilityRecord>): AvailabilityRecord {
  return {
    date,
    status: input.status ?? "available",
    note: input.note,
    bookingId: input.bookingId,
    updatedAt: toIsoString(input.updatedAt)
  };
}

export async function createBooking(payload: BookingRequest): Promise<Booking> {
  if (!isIsoDate(payload.eventDate)) {
    throw new Error("Invalid event date format.");
  }
  if (isPastDate(payload.eventDate)) {
    throw new Error("Event date cannot be in the past.");
  }

  const db = getServerFirestore();
  const bookingDocRef = db.collection(BOOKINGS_COLLECTION).doc();
  const isDev = process.env.NODE_ENV !== "production";

  try {
    const result = await db.runTransaction(async (transaction) => {
      const blockedDatesQuery = db.collection(BLOCKED_DATES_COLLECTION).where("date", "==", payload.eventDate);

      const blockedDateSnapshot = await transaction.get(blockedDatesQuery);

      if (!blockedDateSnapshot.empty) {
        throw new BookingConflictError("Selected date is unavailable.");
      }

      const nowIso = new Date().toISOString();
      const booking: Booking = {
        id: bookingDocRef.id,
        createdAt: nowIso,
        status: "awaiting_response",
        packageId: payload.packageId?.trim() || undefined,
        addOns: payload.selectedAddOns ?? payload.addOns ?? [],
        selectedAddOns: payload.selectedAddOns ?? payload.addOns ?? [],
        specialNotes: payload.specialNotes?.trim() ?? "",
        fullName: payload.fullName,
        email: payload.email.trim().toLowerCase(),
        phone: payload.phone,
        eventType: payload.eventType,
        eventDate: payload.eventDate,
        startTime: payload.startTime ?? "",
        endTime: payload.endTime ?? "",
        venueName: payload.venueName ?? "",
        venueAddress: payload.venueAddress ?? "",
        city: payload.city ?? "",
        settingType: payload.settingType ?? "indoor",
        guestCount: payload.guestCount ?? 1,
        genres: payload.genres ?? "",
        cleanMusic: payload.cleanMusic ?? "yes",
        mcService: payload.mcService ?? "no",
        lights: payload.lights ?? "no",
        budgetRange: payload.budgetRange ?? "",
        preferredContactMethod: payload.preferredContactMethod
      };

      const bookingWritePayloadBeforeClean = {
        ...booking,
        createdAt: FieldValue.serverTimestamp()
      };
      const bookingWritePayload = stripUndefinedFields(bookingWritePayloadBeforeClean);

      if (isDev) {
        console.info("[bookings][dev] firestore_payload_before_clean", bookingWritePayloadBeforeClean);
        console.info("[bookings][dev] firestore_payload_after_clean", bookingWritePayload);
      }

      transaction.set(bookingDocRef, bookingWritePayload);

      const notificationDocRef = db.collection("notifications").doc();
      transaction.set(notificationDocRef, buildBookingNotificationWritePayload(booking));

      return booking;
    });

    if (isDev) {
      console.info("[bookings][dev] firestore_write_success", {
        bookingId: result.id,
        eventDate: result.eventDate
      });
    }

    return result;
  } catch (error) {
    if (isDev) {
      console.error("[bookings][dev] firestore_write_failure", error);
    }
    throw error;
  }
}

export async function getBookings(): Promise<Booking[]> {
  const db = getServerFirestore();
  const snapshot = await db.collection(BOOKINGS_COLLECTION).orderBy("createdAt", "desc").get();
  return snapshot.docs.map((doc) => toBooking(doc.id, doc.data() as Partial<Booking>));
}

export async function getBookingByDate(date: string): Promise<Booking | null> {
  const db = getServerFirestore();
  const snapshot = await db
    .collection(BOOKINGS_COLLECTION)
    .where("eventDate", "==", date)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return toBooking(doc.id, doc.data() as Partial<Booking>);
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const db = getServerFirestore();
  const doc = await db.collection(BOOKINGS_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return toBooking(doc.id, doc.data() as Partial<Booking>);
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<{ booking: Booking; previousStatus: BookingStatus }> {
  const db = getServerFirestore();
  const bookingRef = db.collection(BOOKINGS_COLLECTION).doc(id);

  const updated = await db.runTransaction(async (transaction) => {
    const bookingSnap = await transaction.get(bookingRef);
    if (!bookingSnap.exists) {
      throw new Error("Booking not found.");
    }

    const current = toBooking(bookingSnap.id, bookingSnap.data() as Partial<Booking>);
    transaction.update(bookingRef, {
      status,
      updatedAt: FieldValue.serverTimestamp()
    });

    return {
      booking: {
        ...current,
        status
      },
      previousStatus: current.status
    };
  });

  return updated;
}

export async function getAvailabilityForMonth(monthIso: string): Promise<AvailabilityRecord[]> {
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
  const snapshot = await db.collection(BOOKINGS_COLLECTION).where("status", "==", "confirmed").get();

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Partial<Booking>) }))
    .filter((booking) => typeof booking.eventDate === "string" && booking.eventDate >= start && booking.eventDate <= end)
    .sort((left, right) => String(left.eventDate).localeCompare(String(right.eventDate)))
    .map((booking) => toAvailabilityRecord(String(booking.eventDate), {
      status: "booked",
      note: booking.eventType,
      bookingId: booking.id,
      updatedAt: booking.createdAt
    }));
}

export async function getConfirmedBookingByDate(date: string): Promise<Booking | null> {
  const db = getServerFirestore();
  const snapshot = await db.collection(BOOKINGS_COLLECTION)
    .where("eventDate", "==", date)
    .where("status", "==", "confirmed")
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const confirmedDoc = snapshot.docs[0];
  return toBooking(confirmedDoc.id, confirmedDoc.data() as Partial<Booking>);
}

export async function listBookingsByCustomerEmail(email: string): Promise<Booking[]> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const db = getServerFirestore();
  const exactSnapshot = await db.collection(BOOKINGS_COLLECTION).where("email", "==", normalized).get();

  if (!exactSnapshot.empty) {
    return exactSnapshot.docs
      .map((doc) => toBooking(doc.id, doc.data() as Partial<Booking>))
      .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
  }

  // Backward-compatible fallback for historical rows that may have mixed-case emails.
  const allSnapshot = await db.collection(BOOKINGS_COLLECTION).get();
  return allSnapshot.docs
    .map((doc) => toBooking(doc.id, doc.data() as Partial<Booking>))
    .filter((booking) => booking.email.trim().toLowerCase() === normalized)
    .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
}
