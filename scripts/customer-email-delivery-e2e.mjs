import fs from "fs";
import path from "path";

function loadEnvFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    if (process.env[key]) {
      continue;
    }

    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function maskEmail(email) {
  const [local, domain] = String(email || "").split("@");
  if (!local || !domain) return "";
  return `${local.slice(0, 2)}***@${domain}`;
}

function getAdminHeaders(adminKey) {
  const csrf = "customer-email-delivery-check";
  return {
    "content-type": "application/json",
    "x-admin-key": adminKey,
    "x-csrf-token": csrf,
    cookie: `dj_admin_csrf=${csrf}`
  };
}

async function parseJson(response, label) {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "message" in payload ? payload.message : response.statusText;
    throw new Error(`${label} failed (${response.status}): ${String(message || "Request failed")}`);
  }
  return payload;
}

async function createBooking(baseUrl, email, suffix) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const eventDate = new Date(Date.now() + (45 + attempt) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const payload = {
      fullName: `Email Delivery ${suffix}`,
      email,
      phone: "3055551000",
      eventType: "Private Event",
      eventDate,
      packageId: "premium",
      preferredContactMethod: "email",
      specialNotes: `Email delivery verification ${suffix}`
    };

    const response = await fetch(`${baseUrl}/api/bookings`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.status === 409) {
      continue;
    }

    const json = await parseJson(response, "Create booking");
    return json.booking;
  }

  throw new Error("Create booking failed: could not find an available test date after retries.");
}

async function updateStatus(baseUrl, adminHeaders, bookingId, status) {
  const response = await fetch(`${baseUrl}/api/bookings`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({ id: bookingId, status })
  });

  return parseJson(response, `Update status (${status})`);
}

async function sendAdminThreadMessage(baseUrl, adminHeaders, bookingId, body) {
  const response = await fetch(`${baseUrl}/api/admin/bookings/${encodeURIComponent(bookingId)}/messages`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ body })
  });

  return parseJson(response, "Send admin thread message");
}

async function getCustomerLinks(baseUrl, email, bookingId) {
  const response = await fetch(`${baseUrl}/api/bookings/find`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, bookingIdOrPhone: bookingId, action: "open" })
  });

  const json = await parseJson(response, "Find booking links");
  return { redirectUrl: json.redirectUrl || "", historyUrl: json.historyUrl || "" };
}

async function verifyReplyLink(baseUrl, replyUrl, bookingId) {
  const token = new URL(replyUrl).searchParams.get("token") || "";
  if (!token) {
    return {
      ok: false,
      loadedBookingId: "",
      reason: "missing_token"
    };
  }

  const response = await fetch(`${baseUrl}/api/bookings/reply?token=${encodeURIComponent(token)}`, {
    headers: { accept: "application/json" }
  });
  const json = await parseJson(response, "Open booking reply link");
  const loadedId = json?.booking?.id || "";
  return {
    ok: loadedId === bookingId,
    loadedBookingId: loadedId
  };
}

async function main() {
  const root = process.cwd();
  loadEnvFromFile(path.join(root, ".env.local"));

  const baseUrl = process.env.E2E_BASE_URL || process.env.TEST_BASE_URL || "http://localhost:3000";
  const adminKey = (process.env.ADMIN_API_KEY || process.env.ADMIN_PASSWORD || "").trim();
  const testCustomerEmail = (
    process.env.TEST_CUSTOMER_EMAIL ||
    process.env.REAL_TEST_CUSTOMER_EMAIL ||
    process.env.BOOKING_NOTIFICATION_EMAIL_TO ||
    ""
  ).trim();

  if (!adminKey) {
    throw new Error("Missing ADMIN_API_KEY/ADMIN_PASSWORD for admin-action verification.");
  }
  if (!testCustomerEmail) {
    throw new Error("Missing TEST_CUSTOMER_EMAIL (or REAL_TEST_CUSTOMER_EMAIL / BOOKING_NOTIFICATION_EMAIL_TO).");
  }

  const adminHeaders = getAdminHeaders(adminKey);
  const primaryBooking = await createBooking(baseUrl, testCustomerEmail, "Primary");
  const secondaryBooking = await createBooking(baseUrl, testCustomerEmail, "Secondary");

  await updateStatus(baseUrl, adminHeaders, primaryBooking.id, "pending_deposit");
  await updateStatus(baseUrl, adminHeaders, primaryBooking.id, "confirmed");
  await updateStatus(baseUrl, adminHeaders, secondaryBooking.id, "cancelled");

  await sendAdminThreadMessage(
    baseUrl,
    adminHeaders,
    primaryBooking.id,
    "This is a verification message from admin. Please use your secure link to continue the thread."
  );

  const primaryLinks = await getCustomerLinks(baseUrl, testCustomerEmail, primaryBooking.id);
  const secondaryLinks = await getCustomerLinks(baseUrl, testCustomerEmail, secondaryBooking.id);

  const primaryReply = await verifyReplyLink(baseUrl, primaryLinks.redirectUrl, primaryBooking.id);
  const secondaryReply = await verifyReplyLink(baseUrl, secondaryLinks.redirectUrl, secondaryBooking.id);

  const summary = {
    baseUrl,
    recipient: maskEmail(testCustomerEmail),
    actions: {
      markReviewed: "ok",
      markConfirmed: "ok",
      markDeclined: "ok",
      sendThreadMessage: "ok"
    },
    primaryBooking: {
      id: primaryBooking.id,
      statusTarget: "confirmed",
      replyUrl: primaryLinks.redirectUrl,
      historyUrl: primaryLinks.historyUrl,
      replyLinkVerified: primaryReply
    },
    secondaryBooking: {
      id: secondaryBooking.id,
      statusTarget: "cancelled",
      replyUrl: secondaryLinks.redirectUrl,
      historyUrl: secondaryLinks.historyUrl,
      replyLinkVerified: secondaryReply
    }
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
