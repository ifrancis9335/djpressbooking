import type { BookingStatus } from "../../types/booking";

export const validBookingStatuses: BookingStatus[] = [
  "new",
  "awaiting_response",
  "pending_deposit",
  "confirmed",
  "completed",
  "cancelled"
];