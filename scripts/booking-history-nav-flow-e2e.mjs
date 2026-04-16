const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";
const ADMIN_PASSWORD = process.env.ADMIN_API_KEY || process.env.ADMIN_PASSWORD || "";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
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

async function run() {
  const nonce = Date.now();
  const email = `history-nav-${nonce}@example.com`;
  const phone = "3055552266";
  const eventDate = new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const homeResponse = await fetch(`${BASE_URL}/`);
  const homeHtml = await homeResponse.text();
  assert(homeResponse.ok, `Homepage load failed: ${homeResponse.status}`);
  const historyLinkHits = (homeHtml.match(/href="\/find-booking"/g) || []).length;
  assert(historyLinkHits >= 2, "Booking History link not found in both header and footer on homepage");

  const bookingResponse = await fetch(`${BASE_URL}/api/bookings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fullName: "Booking History Nav Flow",
      email,
      phone,
      eventType: "Corporate Event",
      eventDate,
      packageId: "premium",
      preferredContactMethod: "email",
      specialNotes: "E2E booking history nav flow validation"
    })
  });
  const bookingJson = await parseJson(bookingResponse, "create booking");
  assert(bookingResponse.ok, `Create booking failed: ${bookingResponse.status} ${JSON.stringify(bookingJson)}`);

  const bookingId = bookingJson?.booking?.id;
  assert(typeof bookingId === "string" && bookingId.length > 0, "Booking ID missing");

  const lookupResponse = await fetch(`${BASE_URL}/api/bookings/find`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, bookingIdOrPhone: bookingId, action: "open" })
  });
  const lookupJson = await parseJson(lookupResponse, "booking lookup");
  assert(lookupResponse.ok, `Booking lookup failed: ${lookupResponse.status} ${JSON.stringify(lookupJson)}`);
  assert(typeof lookupJson.redirectUrl === "string" && lookupJson.redirectUrl.includes("/booking-reply?token="), "Lookup did not return chat redirect URL");
  assert(typeof lookupJson.historyUrl === "string" && lookupJson.historyUrl.includes("/booking-history?token="), "Lookup did not return history URL");

  const historyUrl = new URL(lookupJson.historyUrl);
  const historyResponse = await fetch(`${BASE_URL}${historyUrl.pathname}${historyUrl.search}`);
  const historyHtml = await historyResponse.text();
  assert(historyResponse.ok, `Booking history page failed: ${historyResponse.status}`);
  assert(historyHtml.includes("Your Booking History"), "Booking history heading missing");
  assert(historyHtml.includes(bookingId), "Booking history page missing booking ID");
  assert(historyHtml.includes("Open Chat"), "Booking history page missing Open Chat button");

  const chatUrl = new URL(lookupJson.redirectUrl);
  const chatResponse = await fetch(`${BASE_URL}${chatUrl.pathname}${chatUrl.search}`);
  const chatHtml = await chatResponse.text();
  assert(chatResponse.ok, `Booking chat page failed: ${chatResponse.status}`);
  assert(chatHtml.includes("Reply About Your Booking"), "Booking chat heading missing");

  assert(ADMIN_PASSWORD, "ADMIN_API_KEY or ADMIN_PASSWORD is required for admin visibility check");

  const adminBookingListResponse = await fetch(`${BASE_URL}/api/bookings`, {
    headers: { "x-admin-key": ADMIN_PASSWORD }
  });
  const adminBookingListJson = await parseJson(adminBookingListResponse, "admin bookings list");
  assert(adminBookingListResponse.ok, `Admin bookings fetch failed: ${adminBookingListResponse.status}`);
  const adminBookings = Array.isArray(adminBookingListJson?.bookings) ? adminBookingListJson.bookings : [];
  const adminBooking = adminBookings.find((item) => item?.id === bookingId);
  assert(Boolean(adminBooking), "Admin view does not contain the same booking");

  const adminThreadResponse = await fetch(`${BASE_URL}/api/admin/bookings/${bookingId}/messages`, {
    headers: { "x-admin-key": ADMIN_PASSWORD }
  });
  const adminThreadJson = await parseJson(adminThreadResponse, "admin booking thread");
  assert(adminThreadResponse.ok, `Admin thread fetch failed: ${adminThreadResponse.status}`);
  assert(Array.isArray(adminThreadJson?.messages), "Admin thread response missing messages array");

  console.log(JSON.stringify({
    bookingId,
    navbarAndFooterHistoryLink: true,
    lookupFlow: true,
    historyView: true,
    historyToChat: true,
    adminSharedVisibility: true
  }, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
