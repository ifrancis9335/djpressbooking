import { Booking, BookingStatus } from "../../types/booking";
import { BookingMessage } from "../../types/booking-thread";

export interface BookingNotificationContext {
  booking: Booking;
  packageLabel: string;
}

export interface BookingStatusNotificationContext {
  booking: Booking;
  packageLabel: string;
  customerStatus: "reviewed" | "confirmed" | "declined";
  bookingStatus: BookingStatus;
  replyUrl: string;
  historyUrl: string;
  businessContact: {
    phone: string;
    phoneHref: string;
    email: string;
    serviceArea: string;
  };
}

export interface BookingThreadNotificationContext {
  booking: Booking;
  message: BookingMessage;
  packageLabel: string;
  businessContact: {
    phone: string;
    phoneHref: string;
    email: string;
    serviceArea: string;
  };
  replyUrl: string;
  historyUrl: string;
}

export interface NotificationAttemptResult {
  channel: "email" | "sms";
  attempted: boolean;
  sent: boolean;
  reason?: string;
}

export interface BookingNotificationSender {
  channel: "email" | "sms";
  sendBookingCreated(context: BookingNotificationContext): Promise<NotificationAttemptResult>;
  sendBookingStatusUpdated?(context: BookingStatusNotificationContext): Promise<NotificationAttemptResult>;
  sendAdminThreadMessage?(context: BookingThreadNotificationContext): Promise<NotificationAttemptResult>;
  sendCustomerThreadReply?(context: BookingThreadNotificationContext): Promise<NotificationAttemptResult>;
}
