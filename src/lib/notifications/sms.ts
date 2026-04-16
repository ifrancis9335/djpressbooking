import { BookingNotificationSender, NotificationAttemptResult } from "./types";

export const smsNotificationSender: BookingNotificationSender = {
  channel: "sms",
  async sendBookingCreated(): Promise<NotificationAttemptResult> {
    if (process.env.BOOKING_NOTIFICATION_SMS_ENABLED !== "true") {
      return {
        channel: "sms",
        attempted: false,
        sent: false,
        reason: "sms_disabled"
      };
    }

    return {
      channel: "sms",
      attempted: true,
      sent: false,
      reason: "sms_not_implemented"
    };
  },
  async sendBookingStatusUpdated(): Promise<NotificationAttemptResult> {
    if (process.env.BOOKING_NOTIFICATION_SMS_ENABLED !== "true") {
      return {
        channel: "sms",
        attempted: false,
        sent: false,
        reason: "sms_disabled"
      };
    }

    return {
      channel: "sms",
      attempted: true,
      sent: false,
      reason: "sms_not_implemented"
    };
  },
  async sendAdminThreadMessage(): Promise<NotificationAttemptResult> {
    if (process.env.BOOKING_NOTIFICATION_SMS_ENABLED !== "true") {
      return {
        channel: "sms",
        attempted: false,
        sent: false,
        reason: "sms_disabled"
      };
    }

    return {
      channel: "sms",
      attempted: true,
      sent: false,
      reason: "sms_not_implemented"
    };
  },
  async sendCustomerThreadReply(): Promise<NotificationAttemptResult> {
    if (process.env.BOOKING_NOTIFICATION_SMS_ENABLED !== "true") {
      return {
        channel: "sms",
        attempted: false,
        sent: false,
        reason: "sms_disabled"
      };
    }

    return {
      channel: "sms",
      attempted: true,
      sent: false,
      reason: "sms_not_implemented"
    };
  }
};
