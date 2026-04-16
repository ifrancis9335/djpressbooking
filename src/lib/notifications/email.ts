import {
  BookingNotificationContext,
  BookingNotificationSender,
  BookingStatusNotificationContext,
  BookingThreadNotificationContext,
  NotificationAttemptResult
} from "./types";

type EmailFlow =
  | "booking_created"
  | "status_reviewed"
  | "status_confirmed"
  | "status_declined"
  | "admin_thread_message"
  | "customer_thread_reply"
  | "admin_direct_email";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

function getResendConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim() || "";
  const to = process.env.BOOKING_NOTIFICATION_EMAIL_TO?.trim() || "";
  const from = process.env.BOOKING_NOTIFICATION_EMAIL_FROM?.trim() || "";

  return { apiKey, to, from };
}

function getReplyToAddress() {
  return (process.env.BOOKING_REPLY_TO?.trim() || "djpressbookings@gmail.com").trim();
}

function maskEmailForLogs(email: string) {
  const normalized = email.trim();
  if (!normalized) {
    return "";
  }

  if (!IS_PRODUCTION) {
    return normalized;
  }

  const [localPart, domain] = normalized.split("@");
  if (!localPart || !domain) {
    return "[redacted]";
  }

  const visibleLocal = localPart.length <= 2 ? localPart[0] || "*" : `${localPart.slice(0, 2)}***`;
  return `${visibleLocal}@${domain}`;
}

function debugLog(message: string, details: Record<string, unknown>) {
  if (!IS_PRODUCTION) {
    console.info(message, details);
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildDetailsTable(lines: Array<[string, string]>) {
  const rows = lines
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;font-weight:700;border:1px solid #e2e8f0;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:8px 12px;border:1px solid #e2e8f0;">${escapeHtml(value)}</td></tr>`
    )
    .join("");

  return `<table style="border-collapse:collapse;background:#fff;width:100%;max-width:640px;">${rows}</table>`;
}

function formatBusinessContactLine(context: BookingStatusNotificationContext) {
  const contactParts = [
    context.businessContact.phone,
    context.businessContact.email,
    context.businessContact.serviceArea
  ].filter(Boolean);

  return contactParts.join(" | ");
}

function toDisplayBookingStatus(status: string) {
  if (status === "pending_deposit") return "Reviewed";
  if (status === "cancelled") return "Declined";
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusEmailContent(context: BookingStatusNotificationContext) {
  const baseDetails: Array<[string, string]> = [
    ["Booking ID", context.booking.id],
    ["Customer Name", context.booking.fullName],
    ["Event Date", context.booking.eventDate],
    ["Event Type", context.booking.eventType],
    ["Package", context.packageLabel],
    ["Current Status", toDisplayBookingStatus(context.bookingStatus)],
    ["Contact", formatBusinessContactLine(context)]
  ];

  if (context.customerStatus === "reviewed") {
    return {
      subject: `Booking received / reviewed - ${context.booking.eventDate}`,
      heading: `Your booking has been reviewed, ${context.booking.fullName}.`,
      message:
        "DJ Press has reviewed your inquiry and will follow up with next steps shortly. Your requested date remains under review until final confirmation is sent.",
      details: baseDetails,
      textMessage:
        "DJ Press has reviewed your inquiry and will follow up with next steps shortly. Your requested date remains under review until final confirmation is sent."
    };
  }

  if (context.customerStatus === "confirmed") {
    return {
      subject: `Booking confirmed - ${context.booking.eventDate}`,
      heading: `Your booking is confirmed, ${context.booking.fullName}.`,
      message:
        "Your event date has been confirmed by DJ Press. Keep this email for your records and use the contact details below if you need to coordinate anything before the event.",
      details: baseDetails,
      textMessage:
        "Your event date has been confirmed by DJ Press. Keep this email for your records and use the business contact details below if you need to coordinate anything before the event."
    };
  }

  return {
    subject: `Booking declined - ${context.booking.eventDate}`,
    heading: `Your booking was declined, ${context.booking.fullName}.`,
    message:
      "DJ Press is unable to move forward with this booking request as submitted. Please reply using the contact details below if you would like to discuss alternate dates or event options.",
    details: baseDetails,
    textMessage:
      "DJ Press is unable to move forward with this booking request as submitted. Please reply using the business contact details below if you would like to discuss alternate dates or event options."
  };
}

function getThreadEmailContent(context: BookingThreadNotificationContext, audience: "customer" | "business") {
  const intro =
    audience === "customer"
      ? `DJ Press sent a new message about your booking.`
      : `A customer replied to a DJ Press booking conversation.`;

  return {
    subject:
      audience === "customer"
        ? `New message from DJ Press Booking - ${context.booking.eventDate}`
        : `Customer Reply for Booking ${context.booking.id}`,
    heading:
      audience === "customer"
        ? `New message for ${context.booking.fullName}`
        : `New customer reply from ${context.booking.fullName}`,
    message: intro,
    details: [
      ["Booking ID", context.booking.id],
      ["Customer Name", context.booking.fullName],
      ["Event Date", context.booking.eventDate],
      ["Event Type", context.booking.eventType],
      ["Package", context.packageLabel],
      ["Current Status", toDisplayBookingStatus(context.booking.status)],
      ["Message", context.message.body],
      ["Business Contact", formatBusinessContactLine({ ...context, customerStatus: "reviewed", bookingStatus: context.booking.status })]
    ] as Array<[string, string]>,
    textMessage:
      audience === "customer"
        ? `DJ Press sent a new message about your booking. Use the secure reply link below if you need to respond.`
        : `A customer replied to the booking conversation. Review the thread in the admin dashboard.`
  };
}

async function sendResendEmail(params: {
  to: string;
  from: string;
  apiKey: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  flow: EmailFlow;
  bookingId: string;
}): Promise<NotificationAttemptResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: params.from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
        ...(params.replyTo ? { replyTo: params.replyTo } : {})
      })
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("[notifications][email] send_failed", {
        flow: params.flow,
        bookingId: params.bookingId,
        recipient: maskEmailForLogs(params.to),
        deliveryStatus: "failed",
        status: response.status,
        reason: details || `email_send_failed_${response.status}`
      });
      return {
        channel: "email",
        attempted: true,
        sent: false,
        reason: details || `email_send_failed_${response.status}`
      };
    }

    debugLog("[notifications][email] send_succeeded", {
      flow: params.flow,
      bookingId: params.bookingId,
      recipient: maskEmailForLogs(params.to),
      deliveryStatus: "sent"
    });

    return {
      channel: "email",
      attempted: true,
      sent: true
    };
  } catch (error) {
    const reason =
      error instanceof Error && error.name === "AbortError"
        ? "email_send_timeout"
        : error instanceof Error
          ? error.message
          : "email_send_failed";
    console.error("[notifications][email] send_failed", {
      flow: params.flow,
      bookingId: params.bookingId,
      recipient: maskEmailForLogs(params.to),
      deliveryStatus: "failed",
      reason
    });

    return {
      channel: "email",
      attempted: true,
      sent: false,
      reason
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function sendAdminDirectEmail(input: {
  bookingId: string;
  recipient: string;
  subject: string;
  body: string;
  customerName: string;
  eventDate: string;
}): Promise<NotificationAttemptResult> {
  const { apiKey, from } = getResendConfig();
  const recipient = input.recipient.trim();
  const subject = input.subject.trim();
  const messageBody = input.body.trim();

  if (!apiKey || !from || !recipient) {
    console.warn("[notifications][email] send_skipped", {
      flow: "admin_direct_email",
      bookingId: input.bookingId,
      recipient: maskEmailForLogs(recipient),
      deliveryStatus: "skipped",
      reason: "customer_email_not_configured"
    });
    return {
      channel: "email",
      attempted: false,
      sent: false,
      reason: "customer_email_not_configured"
    };
  }

  const html = `<!doctype html>
<html>
  <body style="font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;padding:20px;">
    <h2 style="margin:0 0 12px;">Message from DJ Press Booking</h2>
    <p style="margin:0 0 12px;line-height:1.5;">Hello ${escapeHtml(input.customerName)},</p>
    <p style="margin:0 0 16px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(messageBody)}</p>
    ${buildDetailsTable([
      ["Booking ID", input.bookingId],
      ["Event Date", input.eventDate]
    ])}
  </body>
</html>`;
  const text = [
    `Hello ${input.customerName},`,
    "",
    messageBody,
    "",
    `Booking ID: ${input.bookingId}`,
    `Event Date: ${input.eventDate}`
  ].join("\n");

  return sendResendEmail({
    apiKey,
    from,
    to: recipient,
    subject,
    html,
    text,
    replyTo: getReplyToAddress(),
    flow: "admin_direct_email",
    bookingId: input.bookingId
  });
}

function bookingEmailHtml(context: BookingNotificationContext) {
  const { booking, packageLabel } = context;
  const lines = [
    ["Booking ID", booking.id],
    ["Name", booking.fullName],
    ["Email", booking.email],
    ["Phone", booking.phone],
    ["Event Type", booking.eventType],
    ["Event Date", booking.eventDate],
    ["Package", packageLabel],
    ["Preferred Contact", booking.preferredContactMethod],
    ["Notes", booking.specialNotes || "-"],
    ["Submitted", booking.createdAt]
  ];

  return `<!doctype html>
<html>
  <body style="font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;padding:20px;">
    <h2 style="margin:0 0 12px;">New Booking Inquiry</h2>
    <p style="margin:0 0 16px;">A new booking has been submitted from djpressbooking.com.</p>
    ${buildDetailsTable(lines.map(([label, value]) => [label, String(value)]))}
  </body>
</html>`;
}

function bookingEmailText(context: BookingNotificationContext) {
  const { booking, packageLabel } = context;
  return [
    "New Booking Inquiry",
    `Booking ID: ${booking.id}`,
    `Name: ${booking.fullName}`,
    `Email: ${booking.email}`,
    `Phone: ${booking.phone}`,
    `Event Type: ${booking.eventType}`,
    `Event Date: ${booking.eventDate}`,
    `Package: ${packageLabel}`,
    `Preferred Contact: ${booking.preferredContactMethod}`,
    `Notes: ${booking.specialNotes || "-"}`,
    `Submitted: ${booking.createdAt}`
  ].join("\n");
}

export const emailNotificationSender: BookingNotificationSender = {
  channel: "email",
  async sendBookingCreated(context: BookingNotificationContext): Promise<NotificationAttemptResult> {
    const { apiKey, from, to } = getResendConfig();
    if (!apiKey || !from || !to) {
      console.warn("[notifications][email] send_skipped", {
        flow: "booking_created",
        bookingId: context.booking.id,
        recipient: maskEmailForLogs(to || ""),
        deliveryStatus: "skipped",
        reason: "email_not_configured"
      });
      return {
        channel: "email",
        attempted: false,
        sent: false,
        reason: "email_not_configured"
      };
    }

    return sendResendEmail({
      apiKey,
      from,
      to,
      subject: `New booking inquiry: ${context.booking.fullName} (${context.booking.eventDate})`,
      html: bookingEmailHtml(context),
      text: bookingEmailText(context),
      flow: "booking_created",
      bookingId: context.booking.id
    });
  },
  async sendBookingStatusUpdated(context: BookingStatusNotificationContext): Promise<NotificationAttemptResult> {
    const { apiKey, from } = getResendConfig();
    const recipient = context.booking.email?.trim() || "";

    if (!apiKey || !from || !recipient) {
      const flow: EmailFlow =
        context.customerStatus === "reviewed"
          ? "status_reviewed"
          : context.customerStatus === "confirmed"
            ? "status_confirmed"
            : "status_declined";
      console.warn("[notifications][email] send_skipped", {
        flow,
        bookingId: context.booking.id,
        recipient: maskEmailForLogs(recipient),
        deliveryStatus: "skipped",
        reason: "customer_email_not_configured"
      });
      return {
        channel: "email",
        attempted: false,
        sent: false,
        reason: "customer_email_not_configured"
      };
    }

    const statusContent = getStatusEmailContent(context);
    const flow: EmailFlow =
      context.customerStatus === "reviewed"
        ? "status_reviewed"
        : context.customerStatus === "confirmed"
          ? "status_confirmed"
          : "status_declined";
    const html = `<!doctype html>
<html>
  <body style="font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;padding:20px;">
    <h2 style="margin:0 0 12px;">${escapeHtml(statusContent.heading)}</h2>
    <p style="margin:0 0 16px;line-height:1.5;">${escapeHtml(statusContent.message)}</p>
    ${buildDetailsTable(statusContent.details)}
    <p style="margin:16px 0 0;line-height:1.5;"><a href="${escapeHtml(context.replyUrl)}" style="color:#0f5fe0;font-weight:700;">Open your private booking chat</a></p>
    <p style="margin:8px 0 0;line-height:1.5;"><a href="${escapeHtml(context.historyUrl)}" style="color:#0f5fe0;font-weight:700;">View your booking history</a></p>
  </body>
</html>`;
    const text = [
      statusContent.heading,
      "",
      statusContent.textMessage,
      "",
      ...statusContent.details.map(([label, value]) => `${label}: ${value}`),
      "",
      `Open your private booking chat: ${context.replyUrl}`,
      `View your booking history: ${context.historyUrl}`
    ].join("\n");

    return sendResendEmail({
      apiKey,
      from,
      to: recipient,
      subject: statusContent.subject,
      html,
      text,
      replyTo: getReplyToAddress(),
      flow,
      bookingId: context.booking.id
    });
  },
  async sendAdminThreadMessage(context: BookingThreadNotificationContext): Promise<NotificationAttemptResult> {
    const { apiKey, from } = getResendConfig();
    const recipient = context.booking.email?.trim() || "";

    if (!apiKey || !from || !recipient) {
      console.warn("[notifications][email] send_skipped", {
        flow: "admin_thread_message",
        bookingId: context.booking.id,
        recipient: maskEmailForLogs(recipient),
        deliveryStatus: "skipped",
        reason: "customer_email_not_configured"
      });
      return {
        channel: "email",
        attempted: false,
        sent: false,
        reason: "customer_email_not_configured"
      };
    }

    const threadContent = getThreadEmailContent(context, "customer");
    const html = `<!doctype html>
<html>
  <body style="font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;padding:20px;">
    <h2 style="margin:0 0 12px;">${escapeHtml(threadContent.heading)}</h2>
    <p style="margin:0 0 16px;line-height:1.5;">${escapeHtml(threadContent.message)}</p>
    ${buildDetailsTable(threadContent.details)}
    <p style="margin:16px 0 0;line-height:1.5;"><a href="${escapeHtml(context.replyUrl)}" style="color:#0f5fe0;font-weight:700;">Reply securely to this booking conversation</a></p>
    <p style="margin:8px 0 0;line-height:1.5;"><a href="${escapeHtml(context.historyUrl)}" style="color:#0f5fe0;font-weight:700;">View your booking history</a></p>
  </body>
</html>`;
    const text = [
      threadContent.heading,
      "",
      threadContent.textMessage,
      "",
      ...threadContent.details.map(([label, value]) => `${label}: ${value}`),
      "",
      `Secure reply link: ${context.replyUrl}`,
      `Booking history link: ${context.historyUrl}`
    ].join("\n");

    return sendResendEmail({
      apiKey,
      from,
      to: recipient,
      subject: threadContent.subject,
      html,
      text,
      replyTo: getReplyToAddress(),
      flow: "admin_thread_message",
      bookingId: context.booking.id
    });
  },
  async sendCustomerThreadReply(context: BookingThreadNotificationContext): Promise<NotificationAttemptResult> {
    const { apiKey, from, to } = getResendConfig();
    if (!apiKey || !from || !to) {
      console.warn("[notifications][email] send_skipped", {
        flow: "customer_thread_reply",
        bookingId: context.booking.id,
        recipient: maskEmailForLogs(to || ""),
        deliveryStatus: "skipped",
        reason: "business_email_not_configured"
      });
      return {
        channel: "email",
        attempted: false,
        sent: false,
        reason: "business_email_not_configured"
      };
    }

    const threadContent = getThreadEmailContent(context, "business");
    const html = `<!doctype html>
<html>
  <body style="font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;padding:20px;">
    <h2 style="margin:0 0 12px;">${escapeHtml(threadContent.heading)}</h2>
    <p style="margin:0 0 16px;line-height:1.5;">${escapeHtml(threadContent.message)}</p>
    ${buildDetailsTable(threadContent.details)}
  </body>
</html>`;
    const text = [threadContent.heading, "", threadContent.textMessage, "", ...threadContent.details.map(([label, value]) => `${label}: ${value}`)].join("\n");

    return sendResendEmail({
      apiKey,
      from,
      to,
      subject: threadContent.subject,
      html,
      text,
      flow: "customer_thread_reply",
      bookingId: context.booking.id
    });
  }
};
