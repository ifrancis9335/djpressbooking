import { FieldValue } from "firebase-admin/firestore";
import { getServerFirestore } from "./firebase/admin";
import { Booking, BookingRequest, BookingStatus } from "../types/booking";
import { AvailabilityRecord } from "../types/availability";
import { stripUndefinedFields } from "../utils/sanitize";
import { buildBookingNotificationWritePayload } from "./notifications/store";

const BOOKINGS_COLLECTION = "bookings";
const BLOCKED_DATES_COLLECTION = "blocked_dates";
const NOTIFICATIONS_COLLECTION = "notifications";
const BOOKING_MESSAGES_SUBCOLLECTION = "messages";
const TRASH_RETENTION_DAYS = 30;

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

function toIsoString(value: Booking["createdAt"] | { toDate?: () => Date } | undefined | null) {
  if (!value) return new Date().toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "object" && value.toDate) return value.toDate().toISOString();
  return new Date().toISOString();
}

function toRetentionIso(daysFromNow: number) {
  const value = new Date();
  value.setDate(value.getDate() + daysFromNow);
  return value.toISOString();
}

function shouldPurgeDeletedBooking(booking: Booking, nowMs: number) {
  if (!booking.isDeleted) {
    return false;
  }

  if (booking.purgeAt) {
    const purgeAtMs = new Date(booking.purgeAt).getTime();
    if (!Number.isNaN(purgeAtMs)) {
      return purgeAtMs <= nowMs;
    }
  }

  if (!booking.deletedAt) {
    return false;
  }

  const deletedAtMs = new Date(booking.deletedAt).getTime();
  if (Number.isNaN(deletedAtMs)) {
    return false;
  }

  return deletedAtMs + TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000 <= nowMs;
}

function normalizeSource(input: unknown, isTestBooking: boolean): Booking["source"] {
  if (input === "public" || input === "admin" || input === "internal" || input === "test") {
    return input;
  }
  return isTestBooking ? "test" : "public";
}

function inferIsTestBooking(data: Partial<Booking>) {
  const values = [
    data.fullName,
    data.email,
    data.phone,
    data.specialNotes,
    data.venueName,
    data.packageId,
    data.city
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(" ")
    .toLowerCase();

  if (!values) {
    return false;
  }

  return /(\btest\b|\bdemo\b|\binternal\b|\bqa\b|\be2e\b|\bplaywright\b|example\.com|mailinator|fake|sample)/i.test(values);
}

async function deleteCollectionDocs(path: string) {
  const db = getServerFirestore();
  const snapshot = await db.collection(path).get();
  if (snapshot.empty) {
    return 0;
  }

  let deletedCount = 0;
  for (let index = 0; index < snapshot.docs.length; index += 400) {
    const batch = db.batch();
    const slice = snapshot.docs.slice(index, index + 400);
    slice.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deletedCount += slice.length;
  }

  return deletedCount;
}

async function deleteQueryDocs(query: FirebaseFirestore.Query) {
  const snapshot = await query.get();
  if (snapshot.empty) {
    return 0;
  }

  const db = getServerFirestore();
  let deletedCount = 0;
  for (let index = 0; index < snapshot.docs.length; index += 400) {
    const batch = db.batch();
    const slice = snapshot.docs.slice(index, index + 400);
    slice.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deletedCount += slice.length;
  }

  return deletedCount;
}

function toBooking(id: string, data: Partial<Booking>): Booking {
  const isTestBooking = typeof data.isTestBooking === "boolean" ? data.isTestBooking : inferIsTestBooking(data);
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
    status: data.status ?? "new",
    isDeleted: Boolean(data.isDeleted),
    deletedAt: data.deletedAt ? toIsoString(data.deletedAt as string | { toDate?: () => Date }) : null,
    deletedBy: data.deletedBy ?? null,
    purgeAt: data.purgeAt ? toIsoString(data.purgeAt as string | { toDate?: () => Date }) : null,
    deletionReason: data.deletionReason ?? null,
    isTestBooking,
    source: normalizeSource(data.source, isTestBooking)
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
      const isTestBooking = inferIsTestBooking({
        ...payload,
        email: payload.email,
        specialNotes: payload.specialNotes,
        fullName: payload.fullName,
        phone: payload.phone,
        venueName: payload.venueName,
        packageId: payload.packageId,
        city: payload.city
      });
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
        preferredContactMethod: payload.preferredContactMethod,
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        purgeAt: null,
        deletionReason: null,
        isTestBooking,
        source: isTestBooking ? "test" : "public"
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

export async function getBookings(options?: { includeDeleted?: boolean }): Promise<Booking[]> {
  const includeDeleted = options?.includeDeleted ?? false;
  const db = getServerFirestore();
  const snapshot = await db.collection(BOOKINGS_COLLECTION).orderBy("createdAt", "desc").get();
  const bookings = snapshot.docs.map((doc) => toBooking(doc.id, doc.data() as Partial<Booking>));
  if (includeDeleted) {
    return bookings;
  }
  return bookings.filter((booking) => !booking.isDeleted);
}

export async function getBookingByDate(date: string, options?: { includeDeleted?: boolean }): Promise<Booking | null> {
  const includeDeleted = options?.includeDeleted ?? false;
  const db = getServerFirestore();
  const snapshot = await db
    .collection(BOOKINGS_COLLECTION)
    .where("eventDate", "==", date)
    .limit(10)
    .get();

  if (snapshot.empty) return null;
  const bookings = snapshot.docs.map((doc) => toBooking(doc.id, doc.data() as Partial<Booking>));
  const target = includeDeleted ? bookings[0] : bookings.find((booking) => !booking.isDeleted);
  return target ?? null;
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

export async function softDeleteBooking(id: string, deletedBy: string, options?: { deletionReason?: string | null }): Promise<Booking> {
  const db = getServerFirestore();
  const bookingRef = db.collection(BOOKINGS_COLLECTION).doc(id);
  const deletionReason = options?.deletionReason?.trim() || null;
  const purgeAt = toRetentionIso(TRASH_RETENTION_DAYS);

  return db.runTransaction(async (transaction) => {
    const bookingSnap = await transaction.get(bookingRef);
    if (!bookingSnap.exists) {
      throw new Error("Booking not found.");
    }

    const current = toBooking(bookingSnap.id, bookingSnap.data() as Partial<Booking>);
    if (current.isDeleted) {
      return current;
    }

    transaction.update(bookingRef, {
      isDeleted: true,
      deletedAt: FieldValue.serverTimestamp(),
      deletedBy,
      purgeAt,
      deletionReason,
      updatedAt: FieldValue.serverTimestamp()
    });

    return {
      ...current,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy,
      purgeAt,
      deletionReason
    };
  });
}

export async function restoreBooking(id: string): Promise<Booking> {
  const db = getServerFirestore();
  const bookingRef = db.collection(BOOKINGS_COLLECTION).doc(id);

  return db.runTransaction(async (transaction) => {
    const bookingSnap = await transaction.get(bookingRef);
    if (!bookingSnap.exists) {
      throw new Error("Booking not found.");
    }

    const current = toBooking(bookingSnap.id, bookingSnap.data() as Partial<Booking>);
    if (!current.isDeleted) {
      return current;
    }

    transaction.update(bookingRef, {
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      purgeAt: null,
      deletionReason: null,
      updatedAt: FieldValue.serverTimestamp()
    });

    return {
      ...current,
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      purgeAt: null,
      deletionReason: null
    };
  });
}

export async function permanentlyDeleteBooking(id: string): Promise<Booking | null> {
  const db = getServerFirestore();
  const bookingRef = db.collection(BOOKINGS_COLLECTION).doc(id);
  const snapshot = await bookingRef.get();
  if (!snapshot.exists) {
    return null;
  }

  const booking = toBooking(snapshot.id, snapshot.data() as Partial<Booking>);

  await deleteCollectionDocs(`${BOOKINGS_COLLECTION}/${id}/${BOOKING_MESSAGES_SUBCOLLECTION}`);
  await deleteQueryDocs(db.collection(NOTIFICATIONS_COLLECTION).where("bookingId", "==", id));
  await bookingRef.delete();

  return booking;
}

export async function purgeExpiredBookings(): Promise<Booking[]> {
  const db = getServerFirestore();
  const snapshot = await db.collection(BOOKINGS_COLLECTION).where("isDeleted", "==", true).get();
  const nowMs = Date.now();
  const expired = snapshot.docs
    .map((doc) => toBooking(doc.id, doc.data() as Partial<Booking>))
    .filter((booking) => shouldPurgeDeletedBooking(booking, nowMs));

  const purged: Booking[] = [];
  for (const booking of expired) {
    const deleted = await permanentlyDeleteBooking(booking.id);
    if (deleted) {
      purged.push(deleted);
    }
  }

  return purged;
}

export async function purgeOldDeletedBookings(): Promise<Booking[]> {
  return purgeExpiredBookings();
}

export async function purgeExpiredDeletedBookings(): Promise<Booking[]> {
  return purgeExpiredBookings();
}

export async function purgeDeletedTestBookings(): Promise<Booking[]> {
  const db = getServerFirestore();
  const snapshot = await db.collection(BOOKINGS_COLLECTION).where("isDeleted", "==", true).get();
  const testBookings = snapshot.docs
    .map((doc) => toBooking(doc.id, doc.data() as Partial<Booking>))
    .filter((booking) => booking.isTestBooking);

  const purged: Booking[] = [];
  for (const booking of testBookings) {
    const deleted = await permanentlyDeleteBooking(booking.id);
    if (deleted) {
      purged.push(deleted);
    }
  }

  return purged;
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
    .filter((booking) => !booking.isDeleted)
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
  const booking = toBooking(confirmedDoc.id, confirmedDoc.data() as Partial<Booking>);
  if (booking.isDeleted) {
    return null;
  }
  return booking;
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
      .filter((booking) => !booking.isDeleted)
      .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
  }

  // Backward-compatible fallback for historical rows that may have mixed-case emails.
  const allSnapshot = await db.collection(BOOKINGS_COLLECTION).get();
  return allSnapshot.docs
    .map((doc) => toBooking(doc.id, doc.data() as Partial<Booking>))
    .filter((booking) => !booking.isDeleted)
    .filter((booking) => booking.email.trim().toLowerCase() === normalized)
    .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
}
