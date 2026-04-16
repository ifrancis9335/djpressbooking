import { Booking } from "../../types/booking";
import { BookingMessage } from "../../types/booking-thread";
import { emailNotificationSender } from "./email";
import { smsNotificationSender } from "./sms";
import { NotificationAttemptResult } from "./types";
import { SiteSettings } from "../../types/site-settings";
import { buildBookingReplyToken } from "../booking-threads";
import { buildBookingHistoryUrl } from "../customer-access";
import { toPublicAbsoluteUrl } from "../public-url";

interface BookingNotificationPayload {
  booking: Booking;
  packageLabel: string;
}

interface BookingStatusNotificationPayload {
  booking: Booking;
  packageLabel: string;
  customerStatus: "reviewed" | "confirmed" | "declined";
  businessContact: SiteSettings["contact"];
}

interface BookingThreadNotificationPayload {
  booking: Booking;
  message: BookingMessage;
  packageLabel: string;
  businessContact: SiteSettings["contact"];
}

function buildReplyUrl(booking: Booking) {
  const token = buildBookingReplyToken(booking);
  return toPublicAbsoluteUrl(`/booking-reply?token=${encodeURIComponent(token)}`);
}

function buildHistoryUrl(booking: Booking) {
  return buildBookingHistoryUrl(booking.email);
}

export async function sendBookingCreatedNotifications(payload: BookingNotificationPayload): Promise<NotificationAttemptResult[]> {
  const senders = [emailNotificationSender, smsNotificationSender];
  const results = await Promise.all(senders.map((sender) => sender.sendBookingCreated(payload)));
  return results;
}

export async function sendBookingStatusUpdatedNotifications(payload: BookingStatusNotificationPayload): Promise<NotificationAttemptResult[]> {
  const senders = [emailNotificationSender, smsNotificationSender];
  const replyUrl = buildReplyUrl(payload.booking);
  const historyUrl = buildHistoryUrl(payload.booking);
  const results = await Promise.all(
    senders.map((sender) =>
      sender.sendBookingStatusUpdated
        ? sender.sendBookingStatusUpdated({
            booking: payload.booking,
            packageLabel: payload.packageLabel,
            customerStatus: payload.customerStatus,
            bookingStatus: payload.booking.status,
            replyUrl,
            historyUrl,
            businessContact: payload.businessContact
          })
        : Promise.resolve({
            channel: sender.channel,
            attempted: false,
            sent: false,
            reason: "status_update_not_supported"
          })
    )
  );

  return results;
}

export async function sendBookingThreadAdminMessageNotifications(payload: BookingThreadNotificationPayload): Promise<NotificationAttemptResult[]> {
  const senders = [emailNotificationSender, smsNotificationSender];
  const replyUrl = buildReplyUrl(payload.booking);
  const historyUrl = buildHistoryUrl(payload.booking);
  return Promise.all(
    senders.map((sender) =>
      sender.sendAdminThreadMessage
        ? sender.sendAdminThreadMessage({
            booking: payload.booking,
            message: payload.message,
            packageLabel: payload.packageLabel,
            businessContact: payload.businessContact,
            replyUrl,
            historyUrl
          })
        : Promise.resolve({
            channel: sender.channel,
            attempted: false,
            sent: false,
            reason: "thread_message_not_supported"
          })
    )
  );
}

export async function sendBookingThreadCustomerReplyNotifications(payload: BookingThreadNotificationPayload): Promise<NotificationAttemptResult[]> {
  const senders = [emailNotificationSender, smsNotificationSender];
  const replyUrl = buildReplyUrl(payload.booking);
  const historyUrl = buildHistoryUrl(payload.booking);
  return Promise.all(
    senders.map((sender) =>
      sender.sendCustomerThreadReply
        ? sender.sendCustomerThreadReply({
            booking: payload.booking,
            message: payload.message,
            packageLabel: payload.packageLabel,
            businessContact: payload.businessContact,
            replyUrl,
            historyUrl
          })
        : Promise.resolve({
            channel: sender.channel,
            attempted: false,
            sent: false,
            reason: "customer_reply_not_supported"
          })
    )
  );
}
