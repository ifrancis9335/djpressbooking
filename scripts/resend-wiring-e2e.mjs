import crypto from "crypto";
import fs from "fs";
import path from "path";

const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";
const rootDir = process.cwd();
const envPath = path.join(rootDir, ".env.local");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const text = fs.readFileSync(filePath, "utf8");
  const result = {};

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }

  return result;
}

function toBase64Url(value) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function signPayload(payloadBase64, secret) {
  return crypto.createHmac("sha256", secret).update(payloadBase64).digest("base64url");
}

function buildReplyToken(bookingId, email, secret) {
  const payload = {
    bookingId,
    email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 14
  };
  const payloadBase64 = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadBase64, secret);
  return `${payloadBase64}.${signature}`;
}

async function requestJson(url, options = {}, label = "request") {
  const response = await fetch(url, options);
  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  if (!response.ok) {
    throw new Error(`${label} failed (${response.status}): ${json?.message || response.statusText}`);
  }

  return { response, json };
}

async function listRecentResendEmails(apiKey) {
  const response = await fetch("https://api.resend.com/emails?limit=100", {
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    return { ok: false, data: [], reason: `resend_list_${response.status}` };
  }

  const payload = await response.json();
  return {
    ok: true,
    data: Array.isArray(payload?.data) ? payload.data : [],
    reason: ""
  };
}

function hasRecipient(item, email) {
  const list = Array.isArray(item?.to) ? item.to : [];
  return list.map((v) => String(v).toLowerCase()).includes(email.toLowerCase());
}

function recentEnough(item, startedAt) {
  const createdAt = item?.created_at ? Date.parse(item.created_at) : 0;
  return Number.isFinite(createdAt) && createdAt >= startedAt - 10 * 60 * 1000;
}

function findEmail(data, predicate) {
  return data.find((item) => {
    try {
      return predicate(item);
    } catch {
      return false;
    }
  });
}

async function main() {
  const envFile = parseEnvFile(envPath);

  const adminKey = process.env.ADMIN_API_KEY || envFile.ADMIN_API_KEY || envFile.ADMIN_PASSWORD || "";
  const resendApiKey = process.env.RESEND_API_KEY || envFile.RESEND_API_KEY || "";
  const businessInbox = process.env.BOOKING_NOTIFICATION_EMAIL_TO || envFile.BOOKING_NOTIFICATION_EMAIL_TO || "";
  const sender = process.env.BOOKING_NOTIFICATION_EMAIL_FROM || envFile.BOOKING_NOTIFICATION_EMAIL_FROM || "";
  const customerEmail = process.env.THREAD_E2E_TEST_EMAIL || envFile.THREAD_E2E_TEST_EMAIL || "";

  if (!adminKey) {
    throw new Error("ADMIN_API_KEY (or ADMIN_PASSWORD) is required for admin route verification");
  }
  if (!customerEmail) {
    throw new Error("THREAD_E2E_TEST_EMAIL is required for real reachable customer email verification");
  }

  const startedAt = Date.now();
  const now = new Date();
  const eventDate = new Date(now.getTime() + 50 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const marker = now.toISOString().replace(/[:.]/g, "-");
  const csrfToken = `csrf-${Date.now()}`;

  const bookingPayload = {
    fullName: `Resend E2E ${marker}`,
    email: customerEmail,
    phone: "2485554433",
    eventType: "Wedding Reception",
    eventDate,
    startTime: "17:00",
    endTime: "23:00",
    venueName: "Resend E2E Venue",
    venueAddress: "777 Verification Ave",
    city: "Detroit",
    settingType: "indoor",
    guestCount: 120,
    genres: "R&B, Hip Hop, Pop",
    cleanMusic: "yes",
    mcService: "yes",
    lights: "yes",
    packageId: "premium",
    addOns: [],
    selectedAddOns: [],
    budgetRange: "$2000-$3000",
    preferredContactMethod: "email",
    specialNotes: `RESEND_WIRING_E2E ${marker}`
  };

  const bookingCreate = await requestJson(
    `${baseUrl}/api/bookings`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookingPayload)
    },
    "create booking"
  );

  const booking = bookingCreate.json?.booking;
  if (!booking?.id) {
    throw new Error("Booking creation returned no booking id");
  }

  const adminInboxFetch = await requestJson(
    `${baseUrl}/api/bookings`,
    {
      method: "GET",
      headers: { "x-admin-key": adminKey }
    },
    "load admin bookings inbox"
  );
  const inboxBookings = Array.isArray(adminInboxFetch.json?.bookings) ? adminInboxFetch.json.bookings : [];
  const bookingInAdminInbox = inboxBookings.some((item) => item?.id === booking.id);

  const adminMessageText = `Admin thread message RESEND E2E ${marker}`;
  const adminMessageSend = await requestJson(
    `${baseUrl}/api/admin/bookings/${encodeURIComponent(booking.id)}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
        "x-csrf-token": csrfToken,
        Cookie: `dj_admin_csrf=${csrfToken}`
      },
      body: JSON.stringify({ body: adminMessageText })
    },
    "send admin thread message"
  );

  const replyToken = buildReplyToken(booking.id, booking.email, adminKey);
  const replyLink = `${baseUrl}/booking-reply?token=${encodeURIComponent(replyToken)}`;

  const replyPage = await fetch(replyLink);
  const replyPageHtml = await replyPage.text();
  const replyLinkResult = {
    status: replyPage.status,
    pass: replyPage.ok && /reply/i.test(replyPageHtml)
  };

  const customerReplyText = `Customer reply RESEND E2E ${marker}`;
  await requestJson(
    `${baseUrl}/api/bookings/reply`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: replyToken, body: customerReplyText })
    },
    "submit customer reply"
  );

  const threadFetch = await requestJson(
    `${baseUrl}/api/admin/bookings/${encodeURIComponent(booking.id)}/messages`,
    {
      method: "GET",
      headers: { "x-admin-key": adminKey }
    },
    "fetch admin thread messages"
  );
  const messages = Array.isArray(threadFetch.json?.messages) ? threadFetch.json.messages : [];
  const adminMessageFound = messages.some((msg) => msg?.senderType === "admin" && msg?.body === adminMessageText);
  const customerReplyFound = messages.some((msg) => msg?.senderType === "customer" && msg?.body === customerReplyText);

  let providerChecks = {
    enabled: Boolean(resendApiKey && businessInbox && sender),
    bookingAlertToBusiness: { pass: false, reason: "resend_env_missing" },
    adminThreadToCustomer: { pass: false, reason: "resend_env_missing" },
    customerReplyToBusiness: { pass: false, reason: "resend_env_missing" }
  };

  if (resendApiKey && businessInbox && sender) {
    providerChecks = {
      enabled: true,
      bookingAlertToBusiness: { pass: false, reason: "not_found" },
      adminThreadToCustomer: { pass: false, reason: "not_found" },
      customerReplyToBusiness: { pass: false, reason: "not_found" }
    };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const listResult = await listRecentResendEmails(resendApiKey);
      if (!listResult.ok) {
        providerChecks.bookingAlertToBusiness = { pass: false, reason: listResult.reason };
        providerChecks.adminThreadToCustomer = { pass: false, reason: listResult.reason };
        providerChecks.customerReplyToBusiness = { pass: false, reason: listResult.reason };
        break;
      }

      const emails = listResult.data.filter((item) => recentEnough(item, startedAt));

      const bookingAlert = findEmail(emails, (item) => {
        const subject = String(item?.subject || "");
        return hasRecipient(item, businessInbox) && subject.includes("New booking inquiry") && subject.includes(booking.fullName);
      });

      const adminThreadToCustomer = findEmail(emails, (item) => {
        const subject = String(item?.subject || "");
        return hasRecipient(item, customerEmail) && subject.includes("DJ Press Message About Your Booking") && subject.includes(booking.eventDate);
      });

      const customerReplyToBusiness = findEmail(emails, (item) => {
        const subject = String(item?.subject || "");
        return hasRecipient(item, businessInbox) && subject.includes(`Customer Reply for Booking ${booking.id}`);
      });

      providerChecks.bookingAlertToBusiness = bookingAlert
        ? { pass: true, reason: `resend_email_id:${bookingAlert.id || "unknown"}` }
        : { pass: false, reason: "not_found_yet" };
      providerChecks.adminThreadToCustomer = adminThreadToCustomer
        ? { pass: true, reason: `resend_email_id:${adminThreadToCustomer.id || "unknown"}` }
        : { pass: false, reason: "not_found_yet" };
      providerChecks.customerReplyToBusiness = customerReplyToBusiness
        ? { pass: true, reason: `resend_email_id:${customerReplyToBusiness.id || "unknown"}` }
        : { pass: false, reason: "not_found_yet" };

      if (
        providerChecks.bookingAlertToBusiness.pass &&
        providerChecks.adminThreadToCustomer.pass &&
        providerChecks.customerReplyToBusiness.pass
      ) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  const result = {
    baseUrl,
    env: {
      RESEND_API_KEY: resendApiKey ? "set" : "missing",
      BOOKING_NOTIFICATION_EMAIL_TO: businessInbox ? "set" : "missing",
      BOOKING_NOTIFICATION_EMAIL_FROM: sender ? "set" : "missing",
      NEXT_PUBLIC_SITE_URL: (process.env.NEXT_PUBLIC_SITE_URL || envFile.NEXT_PUBLIC_SITE_URL || "") ? "set" : "missing"
    },
    booking: {
      id: booking.id,
      email: booking.email
    },
    flowChecks: {
      bookingCreated: true,
      bookingVisibleInAdminInbox: bookingInAdminInbox,
      adminMessageSent: Boolean(adminMessageSend.json?.threadMessage?.id),
      replyLinkOpened: replyLinkResult.pass,
      customerReplySubmitted: true,
      replyStoredInSameThread: adminMessageFound && customerReplyFound
    },
    providerChecks,
    replyLink,
    messageSummary: {
      adminMessageText,
      customerReplyText,
      threadMessageCount: messages.length
    }
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(`Resend wiring E2E failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
