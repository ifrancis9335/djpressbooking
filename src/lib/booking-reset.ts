import "server-only";

import { getServerFirestore } from "./firebase/admin";

const BOOKINGS_COLLECTION = "bookings";
const BLOCKED_DATES_COLLECTION = "blocked_dates";
const NOTIFICATIONS_COLLECTION = "notifications";
const AVAILABILITY_COLLECTION = "availability";
const BOOKING_MESSAGES_SUBCOLLECTION = "messages";
const DELETE_BATCH_LIMIT = 400;

export interface BookingResetOptions {
  resetBlockedDates?: boolean;
}

export interface BookingResetSummary {
  bookingsRemoved: number;
  bookingMessagesRemoved: number;
  notificationsRemoved: number;
  availabilityOverridesRemoved: number;
  blockedDatesRemoved: number;
}

async function deleteDocRefsInChunks(docRefs: Array<{ delete: () => Promise<unknown> }>) {
  for (let index = 0; index < docRefs.length; index += DELETE_BATCH_LIMIT) {
    const chunk = docRefs.slice(index, index + DELETE_BATCH_LIMIT);
    await Promise.all(chunk.map((docRef) => docRef.delete()));
  }
}

export async function resetBookingData(options: BookingResetOptions = {}): Promise<BookingResetSummary> {
  const db = getServerFirestore();

  const [bookingSnapshot, notificationSnapshot, availabilitySnapshot, blockedDatesSnapshot] = await Promise.all([
    db.collection(BOOKINGS_COLLECTION).get(),
    db.collection(NOTIFICATIONS_COLLECTION).get(),
    db.collection(AVAILABILITY_COLLECTION).get(),
    options.resetBlockedDates ? db.collection(BLOCKED_DATES_COLLECTION).get() : Promise.resolve(null)
  ]);

  const messageSnapshots = await Promise.all(
    bookingSnapshot.docs.map((bookingDoc) => bookingDoc.ref.collection(BOOKING_MESSAGES_SUBCOLLECTION).get())
  );

  const messageRefs = messageSnapshots.flatMap((snapshot) => snapshot.docs.map((doc) => doc.ref));
  const bookingRefs = bookingSnapshot.docs.map((doc) => doc.ref);
  const notificationRefs = notificationSnapshot.docs.map((doc) => doc.ref);
  const availabilityRefs = availabilitySnapshot.docs.map((doc) => doc.ref);
  const blockedDateRefs = blockedDatesSnapshot ? blockedDatesSnapshot.docs.map((doc) => doc.ref) : [];

  await deleteDocRefsInChunks(messageRefs);
  await deleteDocRefsInChunks(bookingRefs);
  await deleteDocRefsInChunks(notificationRefs);
  await deleteDocRefsInChunks(availabilityRefs);

  if (options.resetBlockedDates) {
    await deleteDocRefsInChunks(blockedDateRefs);
  }

  return {
    bookingsRemoved: bookingRefs.length,
    bookingMessagesRemoved: messageRefs.length,
    notificationsRemoved: notificationRefs.length,
    availabilityOverridesRemoved: availabilityRefs.length,
    blockedDatesRemoved: blockedDateRefs.length
  };
}