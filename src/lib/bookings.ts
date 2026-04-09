import { FieldValue } from "firebase-admin/firestore";
import { getServerFirestore } from "./firebase";
import { Booking, BookingRequest, BookingStatus } from "../types/booking";
import { AvailabilityRecord, AvailabilityStatus } from "../types/availability";

const BOOKINGS_COLLECTION = "bookings";
const AVAILABILITY_COLLECTION = "availability";

export class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingConflictError";
  }
}

function isIsoDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function isPastDate(date: string) {
  const eventDate = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate < today;
}

function toIsoString(value: Booking["createdAt"] | { toDate?: () => Date } | undefined) {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "object" && value.toDate) return value.toDate().toISOString();
  return new Date().toISOString();
}

function availabilityFromBookingStatus(status: BookingStatus): AvailabilityStatus {
  if (status === "confirmed" || status === "completed") return "booked";
  if (status === "cancelled") return "available";
  return "pending";
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
  const availabilityDocRef = db.collection(AVAILABILITY_COLLECTION).doc(payload.eventDate);

  const result = await db.runTransaction(async (transaction) => {
    const availabilitySnap = await transaction.get(availabilityDocRef);
    if (availabilitySnap.exists) {
      const current = availabilitySnap.data() as Partial<AvailabilityRecord>;
      const status = current.status;

      if (status === "pending") {
        throw new BookingConflictError("Selected date is awaiting confirmation.");
      }
      if (status === "booked" || status === "blocked") {
        throw new BookingConflictError("Selected date is unavailable.");
      }
    }

    const nowIso = new Date().toISOString();
    const booking: Booking = {
      id: bookingDocRef.id,
      createdAt: nowIso,
      status: "awaiting_response",
      packageId: payload.packageId || undefined,
      addOns: payload.selectedAddOns ?? [],
      selectedAddOns: payload.selectedAddOns ?? [],
      specialNotes: payload.specialNotes?.trim() ?? "",
      ...payload
    };

    transaction.set(bookingDocRef, {
      ...booking,
      createdAt: FieldValue.serverTimestamp()
    });

    transaction.set(
      availabilityDocRef,
      {
        date: payload.eventDate,
        status: "pending" as AvailabilityStatus,
        note: payload.eventType,
        bookingId: bookingDocRef.id,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    return booking;
  });

  return result;
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

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
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

    const availabilityRef = db.collection(AVAILABILITY_COLLECTION).doc(current.eventDate);
    const availabilityStatus = availabilityFromBookingStatus(status);

    transaction.set(
      availabilityRef,
      {
        date: current.eventDate,
        status: availabilityStatus,
        bookingId: availabilityStatus === "available" ? null : current.id,
        note: availabilityStatus === "available" ? "Date reopened" : current.eventType,
        updatedAt: FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    return {
      ...current,
      status
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
  const snapshot = await db
    .collection(AVAILABILITY_COLLECTION)
    .where("date", ">=", start)
    .where("date", "<=", end)
    .orderBy("date", "asc")
    .get();

  return snapshot.docs.map((doc) => toAvailabilityRecord(doc.id, doc.data() as Partial<AvailabilityRecord>));
}

export async function setDateBlocked(date: string, note?: string): Promise<AvailabilityRecord> {
  const db = getServerFirestore();
  const ref = db.collection(AVAILABILITY_COLLECTION).doc(date);
  await ref.set(
    {
      date,
      status: "blocked" as AvailabilityStatus,
      note: note?.trim() || "Blocked by admin",
      bookingId: null,
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  const snap = await ref.get();
  return toAvailabilityRecord(snap.id, snap.data() as Partial<AvailabilityRecord>);
}
