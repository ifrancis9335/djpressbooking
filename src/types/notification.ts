export type AdminNotificationType = "new_booking";

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  bookingId: string;
  name: string;
  date: string;
  timestamp: string;
  read: boolean;
}