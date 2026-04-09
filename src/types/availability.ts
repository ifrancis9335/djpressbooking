export type AvailabilityStatus = "available" | "pending" | "booked" | "blocked";

export interface AvailabilityDate {
  date: string;
  status: AvailabilityStatus;
  note?: string;
}

export interface AvailabilityRecord {
  date: string;
  status: AvailabilityStatus;
  note?: string;
  bookingId?: string;
  updatedAt: string | { toDate?: () => Date };
}
