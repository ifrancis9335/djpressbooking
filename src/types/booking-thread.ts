export type BookingMessageSenderType = "admin" | "customer" | "system";

export interface BookingMessage {
  id: string;
  bookingId: string;
  senderType: BookingMessageSenderType;
  body: string;
  timestamp: string;
  read: boolean;
}

export interface BookingReplyTokenPayload {
  bookingId: string;
  email: string;
  exp: number;
}