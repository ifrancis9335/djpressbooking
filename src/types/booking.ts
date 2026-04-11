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
