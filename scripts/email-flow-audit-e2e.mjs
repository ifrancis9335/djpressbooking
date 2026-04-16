import crypto from "crypto";
import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const envPath = path.join(rootDir, ".env.local");
const siteSettingsPath = path.join(rootDir, "data", "site-settings.json");
const baseUrl = process.env.E2E_BASE_URL || "http://localhost:3000";

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

function getSiteContactEmail(filePath) {
  if (!fs.existsSync(filePath)) return "";
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return typeof parsed?.contact?.email === "string" ? parsed.contact.email.trim() : "";
  } catch {
    return "";
  }
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

async function listResendEmails(apiKey) {
  const response = await fetch("https://api.resend.com/emails?limit=100", {
    headers: { Authorization: `Bearer ${apiKey}` }
  });

  if (!response.ok) {
    return { ok: false, data: [], reason: `resend_list_${response.status}` };
  }

  const payload = await response.json();
  return { ok: true, data: Array.isArray(payload?.data) ? payload.data : [], reason: "" };
}

function hasRecipient(item, email) {
  const list = Array.isArray(item?.to) ? item.to : [];
  return list.map((value) => String(value).toLowerCase()).includes(email.toLowerCase());
}

function isRecent(item, startedAt) {
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
  const customerEmail =
    process.env.THREAD_E2E_TEST_EMAIL ||
    envFile.THREAD_E2E_TEST_EMAIL ||
    getSiteContactEmail(siteSettingsPath);

  if (!adminKey) {
    throw new Error("ADMIN_API_KEY (or ADMIN_PASSWORD) is required");
  }

  if (!customerEmail || !customerEmail.includes("@")) {
    throw new Error("No real test customer email was found (THREAD_E2E_TEST_EMAIL or site contact email required)");
  }

  const startedAt = Date.now();
  const marker = new Date().toISOString().replace(/[:.]/g, "-");
  const eventDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const csrfToken = `csrf-${Date.now()}`;

  const bookingPayload = {
    fullName: `Email Flow Audit ${marker}`,
    email: customerEmail,
    phone: "8433129965",
    eventType: "Private Party",
    eventDate,
    startTime: "19:00",
    endTime: "23:00",
    venueName: "DJ Press Audit Venue",
    venueAddress: "10 Audit Lane",
    city: "Charleston",
    settingType: "indoor",
    guestCount: 80,
    genres: "Hip Hop, R&B",
    cleanMusic: "yes",
    mcService: "no",
    lights: "yes",
    packageId: "premium",
    addOns: [],
    selectedAddOns: [],
    budgetRange: "$1000-$2000",
    preferredContactMethod: "email",
    specialNotes: `EMAIL_FLOW_AUDIT ${marker}`
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
    throw new Error("Booking creation did not return booking id");
  }

  const statusResults = [];
  for (const status of ["pending_deposit", "confirmed", "cancelled"]) {
    const statusUpdate = await requestJson(
      `${baseUrl}/api/bookings`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
          "x-csrf-token": csrfToken,
          Cookie: `dj_admin_csrf=${csrfToken}`
        },
        body: JSON.stringify({ id: booking.id, status })
      },
      `update booking status ${status}`
    );

    statusResults.push({ status, ok: Boolean(statusUpdate.json?.booking?.id) });
  }

  const adminThreadMessageText = `Flow 5 admin thread message ${marker}`;
  const adminThreadSend = await requestJson(
    `${baseUrl}/api/admin/bookings/${encodeURIComponent(booking.id)}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
        "x-csrf-token": csrfToken,
        Cookie: `dj_admin_csrf=${csrfToken}`
      },
      body: JSON.stringify({ body: adminThreadMessageText })
    },
    "send admin thread message"
  );

  const replyToken = buildReplyToken(booking.id, booking.email, adminKey);
  const replyLink = `${baseUrl}/booking-reply?token=${encodeURIComponent(replyToken)}`;
  const replyPage = await fetch(replyLink);
  const replyPageHtml = await replyPage.text();

  const customerReplyText = `Flow 6 customer reply ${marker}`;
  const customerReply = await requestJson(
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
    "fetch thread"
  );

  const messages = Array.isArray(threadFetch.json?.messages) ? threadFetch.json.messages : [];
  const adminThreadFound = messages.some((msg) => msg?.senderType === "admin" && msg?.body === adminThreadMessageText);
  const customerReplyFound = messages.some((msg) => msg?.senderType === "customer" && msg?.body === customerReplyText);

  let provider = {
    enabled: Boolean(resendApiKey && businessInbox && sender),
    checks: {
      flow1_new_booking_to_business: { pass: false, reason: "resend_env_missing" },
      flow2_reviewed_to_customer: { pass: false, reason: "resend_env_missing" },
      flow3_confirmed_to_customer: { pass: false, reason: "resend_env_missing" },
      flow4_declined_to_customer: { pass: false, reason: "resend_env_missing" },
      flow5_admin_thread_to_customer: { pass: false, reason: "resend_env_missing" },
      flow6_customer_reply_to_business: { pass: false, reason: "resend_env_missing" }
    }
  };

  if (resendApiKey && businessInbox && sender) {
    provider = {
      enabled: true,
      checks: {
        flow1_new_booking_to_business: { pass: false, reason: "not_found" },
        flow2_reviewed_to_customer: { pass: false, reason: "not_found" },
        flow3_confirmed_to_customer: { pass: false, reason: "not_found" },
        flow4_declined_to_customer: { pass: false, reason: "not_found" },
        flow5_admin_thread_to_customer: { pass: false, reason: "not_found" },
        flow6_customer_reply_to_business: { pass: false, reason: "not_found" }
      }
    };

    for (let attempt = 0; attempt < 6; attempt += 1) {
      const listResult = await listResendEmails(resendApiKey);
      if (!listResult.ok) {
        for (const key of Object.keys(provider.checks)) {
          provider.checks[key] = { pass: false, reason: listResult.reason };
        }
        break;
      }

      const emails = listResult.data.filter((item) => isRecent(item, startedAt));

      const flow1 = findEmail(emails, (item) => hasRecipient(item, businessInbox) && String(item?.subject || "").includes("New booking inquiry:"));
      const flow2 = findEmail(emails, (item) => hasRecipient(item, booking.email) && String(item?.subject || "").includes("Booking Reviewed"));
      const flow3 = findEmail(emails, (item) => hasRecipient(item, booking.email) && String(item?.subject || "").includes("Booking Confirmed"));
      const flow4 = findEmail(emails, (item) => hasRecipient(item, booking.email) && String(item?.subject || "").includes("Booking Update for"));
      const flow5 = findEmail(emails, (item) => hasRecipient(item, booking.email) && String(item?.subject || "").includes("DJ Press Message About Your Booking"));
      const flow6 = findEmail(emails, (item) => hasRecipient(item, businessInbox) && String(item?.subject || "").includes(`Customer Reply for Booking ${booking.id}`));

      provider.checks.flow1_new_booking_to_business = flow1 ? { pass: true, reason: `resend_email_id:${flow1.id || "unknown"}` } : { pass: false, reason: "not_found_yet" };
      provider.checks.flow2_reviewed_to_customer = flow2 ? { pass: true, reason: `resend_email_id:${flow2.id || "unknown"}` } : { pass: false, reason: "not_found_yet" };
      provider.checks.flow3_confirmed_to_customer = flow3 ? { pass: true, reason: `resend_email_id:${flow3.id || "unknown"}` } : { pass: false, reason: "not_found_yet" };
      provider.checks.flow4_declined_to_customer = flow4 ? { pass: true, reason: `resend_email_id:${flow4.id || "unknown"}` } : { pass: false, reason: "not_found_yet" };
      provider.checks.flow5_admin_thread_to_customer = flow5 ? { pass: true, reason: `resend_email_id:${flow5.id || "unknown"}` } : { pass: false, reason: "not_found_yet" };
      provider.checks.flow6_customer_reply_to_business = flow6 ? { pass: true, reason: `resend_email_id:${flow6.id || "unknown"}` } : { pass: false, reason: "not_found_yet" };

      if (Object.values(provider.checks).every((item) => item.pass)) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  const output = {
    baseUrl,
    bookingId: booking.id,
    customerEmail: booking.email,
    env: {
      RESEND_API_KEY: resendApiKey ? "set" : "missing",
      BOOKING_NOTIFICATION_EMAIL_TO: businessInbox ? "set" : "missing",
      BOOKING_NOTIFICATION_EMAIL_FROM: sender ? "set" : "missing",
      NEXT_PUBLIC_SITE_URL: (process.env.NEXT_PUBLIC_SITE_URL || envFile.NEXT_PUBLIC_SITE_URL || "") ? "set" : "missing"
    },
    localFlowExecution: {
      flow1_booking_created: true,
      flow2_mark_reviewed: statusResults.some((item) => item.status === "pending_deposit" && item.ok),
      flow3_mark_confirmed: statusResults.some((item) => item.status === "confirmed" && item.ok),
      flow4_mark_declined: statusResults.some((item) => item.status === "cancelled" && item.ok),
      flow5_admin_thread_message: Boolean(adminThreadSend.json?.threadMessage?.id),
      flow5_reply_link_loaded: replyPage.ok && /reply/i.test(replyPageHtml),
      flow6_customer_reply_submitted: Boolean(customerReply.json?.threadMessage?.id),
      flow6_reply_stored_same_thread: adminThreadFound && customerReplyFound
    },
    provider,
    replyLink,
    threadMessageCount: messages.length
  };

  console.log(JSON.stringify(output, null, 2));
}

main().catch((error) => {
  console.error(`Email flow audit E2E failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
