import { NextResponse } from "next/server";
import {
  BookingConflictError,
  createBooking,
  getBookingByDate,
  getBookings,
  updateBookingStatus
} from "../../../lib/bookings";
import { bookingSchema } from "../../../lib/validators/booking";
import { isoDateSchema } from "../../../lib/validators/api";
import { BookingStatus } from "../../../types/booking";
import { requireAdminRequest } from "../../../lib/admin-auth";
import { isFirebaseAdminConfigured } from "../../../lib/firebase";
import { getSiteSettings } from "../../../lib/site-settings";
import { getBlockedDateByEventDate } from "../../../lib/availability-db";

const validStatuses: BookingStatus[] = [
  "new",
  "awaiting_response",
  "pending_deposit",
  "confirmed",
  "completed",
  "cancelled"
];

export async function GET(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ message: "Firebase Admin is not configured." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (date) {
      const parsedDate = isoDateSchema.safeParse(date);
      if (!parsedDate.success) {
        return NextResponse.json({ message: "Invalid date query. Use YYYY-MM-DD." }, { status: 400 });
      }
      const booking = await getBookingByDate(date);
      return NextResponse.json({ booking });
    }

    const bookings = await getBookings();
    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load bookings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ message: "Firebase Admin is not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as { id?: string; status?: BookingStatus };
    if (!body.id || !body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json({ message: "Valid booking id and status are required" }, { status: 400 });
    }

    const booking = await updateBookingStatus(body.id, body.status);
    return NextResponse.json({ message: "Booking status updated", booking });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update booking status" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  if (!isFirebaseAdminConfigured()) {
    console.warn("[bookings] firebase_not_configured", { requestId });
    return NextResponse.json({ message: "Firebase Admin is not configured." }, { status: 503 });
  }

  try {
    const siteSettings = await getSiteSettings();
    if (!siteSettings.booking.enabled) {
      return NextResponse.json(
        { message: siteSettings.booking.notice || "Bookings are temporarily paused." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten()
        },
        { status: 400 }
      );
    }

    const blockedRecord = await getBlockedDateByEventDate(parsed.data.eventDate);
    if (blockedRecord?.status === "blocked") {
      console.info("[bookings] blocked_date_rejected", {
        requestId,
        date: parsed.data.eventDate,
        source: "postgres"
      });
      return NextResponse.json({ message: "Date not available" }, { status: 409 });
    }

    const booking = await createBooking(parsed.data);
    console.info("[bookings] booking_created", { requestId, bookingId: booking.id, date: booking.eventDate });

    return NextResponse.json(
      {
        message: "Booking inquiry submitted successfully",
        booking
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof BookingConflictError) {
      console.warn("[bookings] booking_conflict", { requestId, message: error.message });
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error("[bookings] booking_failed", {
      requestId,
      message: error instanceof Error ? error.message : "Unknown error"
    });

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to process booking request" },
      { status: 500 }
    );
  }
}
