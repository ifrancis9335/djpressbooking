const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const ADMIN_PASSWORD = process.env.ADMIN_API_KEY || process.env.ADMIN_PASSWORD || "";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCookieValue(setCookieHeaders, cookieName) {
  for (const header of setCookieHeaders) {
    const [cookiePair] = header.split(";");
    const [name, value] = cookiePair.split("=");
    if (name?.trim() === cookieName) {
      return value || "";
    }
  }
  return "";
}

async function parseJson(response, context) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${context}: expected JSON response, got: ${text.slice(0, 300)}`);
  }
}

function buildTestBookingPayload() {
  const date = new Date();
  date.setDate(date.getDate() + 28);
  const eventDate = date.toISOString().slice(0, 10);

  const nonce = Date.now();
  return {
    fullName: "Thank You Chat E2E",
    email: `thankyou-chat-${nonce}@example.com`,
    phone: "3055551010",
    eventType: "Private Event",
    eventDate,
    packageId: "premium",
    preferredContactMethod: "email",
    specialNotes: "Automated validation for thank-you chat handoff."
  };
}

async function run() {
  console.log("[e2e] base_url", BASE_URL);

  const bookingPayload = buildTestBookingPayload();
  const bookingResponse = await fetch(`${BASE_URL}/api/bookings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(bookingPayload)
  });

  const bookingJson = await parseJson(bookingResponse, "create booking");
  assert(bookingResponse.ok, `[create booking] failed: ${bookingResponse.status} ${JSON.stringify(bookingJson)}`);

  const bookingId = bookingJson?.booking?.id;
  const replyToken = bookingJson?.replyToken;
  assert(typeof bookingId === "string" && bookingId.length > 0, "Missing booking id in booking response");
  assert(typeof replyToken === "string" && replyToken.length > 0, "Missing replyToken in booking response");
  console.log("[e2e] booking_created", bookingId);

  const thankYouQuery = new URLSearchParams({
    bookingId,
    date: bookingPayload.eventDate,
    package: bookingPayload.packageId,
    token: replyToken
  });
  const thankYouResponse = await fetch(`${BASE_URL}/thank-you?${thankYouQuery.toString()}`);
  const thankYouHtml = await thankYouResponse.text();
  assert(thankYouResponse.ok, `thank-you page failed: ${thankYouResponse.status}`);
  assert(thankYouHtml.includes("Open Booking Chat"), "Thank-you page is missing Open Booking Chat button");
  assert(thankYouHtml.includes("Booking Status"), "Thank-you page is missing booking status section");
  assert(
    thankYouHtml.includes("Messages from the booking team will appear in your private booking chat."),
    "Thank-you page is missing private booking chat guidance text"
  );
  console.log("[e2e] thank_you_page_verified");

  const chatPageResponse = await fetch(`${BASE_URL}/booking-reply?token=${encodeURIComponent(replyToken)}`);
  const chatPageHtml = await chatPageResponse.text();
  assert(chatPageResponse.ok, `booking-reply page failed: ${chatPageResponse.status}`);
  assert(chatPageHtml.includes("Reply About Your Booking"), "Booking reply page did not render secure chat header");
  console.log("[e2e] booking_reply_page_verified");

  assert(ADMIN_PASSWORD, "ADMIN_API_KEY or ADMIN_PASSWORD is required for admin message validation");
  const adminLoginResponse = await fetch(`${BASE_URL}/api/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ password: ADMIN_PASSWORD })
  });

  const adminLoginJson = await parseJson(adminLoginResponse, "admin login");
  assert(adminLoginResponse.ok, `[admin login] failed: ${adminLoginResponse.status} ${JSON.stringify(adminLoginJson)}`);

  const setCookieHeaders = adminLoginResponse.headers.getSetCookie ? adminLoginResponse.headers.getSetCookie() : [];
  const sessionCookie = parseCookieValue(setCookieHeaders, "dj_admin_session");
  const csrfCookie = parseCookieValue(setCookieHeaders, "dj_admin_csrf");
  assert(sessionCookie, "Admin session cookie missing after login");
  assert(csrfCookie, "Admin csrf cookie missing after login");

  const cookieHeader = `dj_admin_session=${sessionCookie}; dj_admin_csrf=${csrfCookie}`;
  const adminMessageBody = `Admin message for thank-you chat validation ${Date.now()}`;
  const adminMessageResponse = await fetch(`${BASE_URL}/api/admin/bookings/${bookingId}/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrfCookie,
      cookie: cookieHeader
    },
    body: JSON.stringify({ body: adminMessageBody })
  });
  const adminMessageJson = await parseJson(adminMessageResponse, "admin message post");
  assert(adminMessageResponse.ok, `[admin message] failed: ${adminMessageResponse.status} ${JSON.stringify(adminMessageJson)}`);
  console.log("[e2e] admin_message_posted");

  const customerThreadResponse = await fetch(`${BASE_URL}/api/bookings/reply?token=${encodeURIComponent(replyToken)}`);
  const customerThreadJson = await parseJson(customerThreadResponse, "customer thread get");
  assert(customerThreadResponse.ok, `[customer thread get] failed: ${customerThreadResponse.status} ${JSON.stringify(customerThreadJson)}`);

  const customerMessages = Array.isArray(customerThreadJson?.messages) ? customerThreadJson.messages : [];
  assert(
    customerMessages.some((message) => message?.senderType === "admin" && message?.body === adminMessageBody),
    "Customer thread does not include admin message"
  );
  console.log("[e2e] customer_can_see_admin_message");

  const customerReplyBody = `Customer reply for thank-you chat validation ${Date.now()}`;
  const customerReplyResponse = await fetch(`${BASE_URL}/api/bookings/reply`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: replyToken, body: customerReplyBody })
  });
  const customerReplyJson = await parseJson(customerReplyResponse, "customer reply post");
  assert(customerReplyResponse.ok, `[customer reply] failed: ${customerReplyResponse.status} ${JSON.stringify(customerReplyJson)}`);

  const adminThreadResponse = await fetch(`${BASE_URL}/api/admin/bookings/${bookingId}/messages`, {
    headers: { "x-admin-key": ADMIN_PASSWORD }
  });
  const adminThreadJson = await parseJson(adminThreadResponse, "admin thread get");
  assert(adminThreadResponse.ok, `[admin thread get] failed: ${adminThreadResponse.status} ${JSON.stringify(adminThreadJson)}`);

  const adminMessages = Array.isArray(adminThreadJson?.messages) ? adminThreadJson.messages : [];
  assert(
    adminMessages.some((message) => message?.senderType === "customer" && message?.body === customerReplyBody),
    "Admin thread does not include customer reply"
  );
  console.log("[e2e] admin_can_see_customer_reply");

  console.log("[e2e] SUCCESS", JSON.stringify({ bookingId }, null, 2));
}

run().catch((error) => {
  console.error("[e2e] FAILURE", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
