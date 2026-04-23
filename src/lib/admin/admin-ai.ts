import { Booking, BookingStatus } from "../../types/booking";

export interface AIInsight {
  type: "warning" | "suggestion" | "insight";
  message: string;
  bookingId?: string;
  action?: "confirm" | "delete_test";
}

export interface AIAnalysisResult {
  warnings: AIInsight[];
  suggestions: AIInsight[];
  insights: AIInsight[];
}

const REQUIRED_FIELDS: (keyof Booking)[] = ["fullName", "email", "phone", "eventType", "eventDate"];

const PENDING_STATUSES: BookingStatus[] = ["new", "awaiting_response", "pending_deposit"];

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;

export function analyzeBookings(bookings: Booking[]): AIAnalysisResult {
  const warnings: AIInsight[] = [];
  const suggestions: AIInsight[] = [];
  const insights: AIInsight[] = [];

  const activeBookings = bookings.filter((b) => !b.isDeleted);
  const now = Date.now();

  for (const booking of activeBookings) {
    const displayName = booking.fullName?.trim() || "Unknown";
    const shortId = booking.id.slice(0, 8);

    // Missing required fields → warning
    const missingFields = REQUIRED_FIELDS.filter((field) => {
      const value = booking[field];
      return value === undefined || value === null || String(value).trim() === "";
    });

    if (missingFields.length > 0) {
      warnings.push({
        type: "warning",
        message: `Booking from ${displayName} (${shortId}…) is missing required fields: ${missingFields.join(", ")}`,
        bookingId: booking.id,
      });
    }

    // Event type = wedding → high-value insight
    if (booking.eventType?.toLowerCase().includes("wedding")) {
      insights.push({
        type: "insight",
        message: `High-value wedding booking from ${displayName} on ${booking.eventDate}`,
        bookingId: booking.id,
        action: booking.status !== "confirmed" ? "confirm" : undefined,
      });
    }

    // Guest count < 10 and not already flagged as test → possible test booking suggestion
    if (
      typeof booking.guestCount === "number" &&
      booking.guestCount < 10 &&
      !booking.isTestBooking
    ) {
      suggestions.push({
        type: "suggestion",
        message: `Booking from ${displayName} has only ${booking.guestCount} guest(s) — may be a test booking`,
        bookingId: booking.id,
        action: "delete_test",
      });
    }

    // Older than 48 h and still in a pending status → follow-up suggestion
    const createdAtMs = booking.createdAt ? new Date(booking.createdAt).getTime() : NaN;
    const isPending = PENDING_STATUSES.includes(booking.status);
    if (!Number.isNaN(createdAtMs) && now - createdAtMs > FORTY_EIGHT_HOURS_MS && isPending) {
      suggestions.push({
        type: "suggestion",
        message: `Booking from ${displayName} has been pending for over 48 hours — consider following up`,
        bookingId: booking.id,
        action: "confirm",
      });
    }
  }

  return { warnings, suggestions, insights };
}
