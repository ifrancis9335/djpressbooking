export type AdminActivityAction =
  | "booking_created"
  | "booking_status_updated"
  | "thread_message_sent"
  | "internal_note_added"
  | "customer_reply_received"
  | "direct_email_sent";

export type AdminActivityActorType = "admin" | "customer" | "system";

export type AdminActivityMetadataValue = string | number | boolean | null;

export interface AdminActivity {
  id: string;
  bookingId: string;
  action: AdminActivityAction;
  actorType: AdminActivityActorType;
  summary: string;
  customerName: string;
  eventDate: string;
  createdAt: string;
  metadata: Record<string, AdminActivityMetadataValue>;
}
