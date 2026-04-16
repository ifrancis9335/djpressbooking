export interface BlockedDateEntry {
  id: string;
  eventDate: string;
  status: "blocked" | "available";
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityEntry {
  date: string;
  status: "available" | "blocked";
  note?: string;
}

export interface CalendarCell {
  day?: number;
  iso?: string;
  status?: AvailabilityEntry["status"];
  note?: string;
  isToday?: boolean;
  isPast?: boolean;
}
