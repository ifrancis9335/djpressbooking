import { AvailabilityDate } from "../types/availability";

export const seedAvailability: AvailabilityDate[] = [
  { date: "2026-04-18", status: "booked", note: "Wedding reception" },
  { date: "2026-04-25", status: "booked", note: "Private celebration" },
  { date: "2026-05-09", status: "booked", note: "Corporate gala" },
  { date: "2026-05-16", status: "pending", note: "Inquiry pending confirmation" },
  { date: "2026-05-23", status: "booked", note: "Destination event" },
  { date: "2026-06-06", status: "booked", note: "VIP birthday event" },
  { date: "2026-06-20", status: "pending", note: "Pending deposit" },
  { date: "2026-07-04", status: "blocked", note: "Unavailable" }
];
