export type BookingStatus =
  | "new"
  | "awaiting_response"
  | "pending_deposit"
  | "confirmed"
  | "completed"
  | "cancelled";

export interface Booking {
  id: string;
  createdAt: string;
  fullName: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  venueAddress: string;
  city: string;
  settingType: "indoor" | "outdoor" | "hybrid";
  guestCount: number;
  genres: string;
  cleanMusic: "yes" | "no";
  mcService: "yes" | "no";
  lights: "yes" | "no";
  packageId?: string;
  addOns: string[];
  selectedAddOns: string[];
  budgetRange: string;
  preferredContactMethod: "email" | "phone" | "text";
  specialNotes: string;
  status: BookingStatus;
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  purgeAt?: string | null;
  deletionReason?: string | null;
  isTestBooking?: boolean;
  source?: "public" | "admin" | "internal" | "test";
}

export interface BookingRequest {
  fullName: string;
  email: string;
  phone: string;
  eventType: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  venueName?: string;
  venueAddress?: string;
  city?: string;
  settingType?: "indoor" | "outdoor" | "hybrid";
  guestCount?: number;
  genres?: string;
  cleanMusic?: "yes" | "no";
  mcService?: "yes" | "no";
  lights?: "yes" | "no";
  packageId?: string;
  addOns?: string[];
  selectedAddOns?: string[];
  budgetRange?: string;
  preferredContactMethod: "email" | "phone" | "text";
  specialNotes?: string;
}
