const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

async function parseJson(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Expected JSON but got: ${text.slice(0, 200)}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function run() {
  const base = new URL(BASE_URL);
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 35);
  const eventDate = futureDate.toISOString().slice(0, 10);
  const nonce = Date.now();
  const email = `customer-access-${nonce}@example.com`;
  const phone = "3055552200";

  const bookingResponse = await fetch(`${BASE_URL}/api/bookings`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      fullName: "Customer Access Smoke",
      email,
      phone,
      eventType: "Private Event",
      eventDate,
      packageId: "basic",
      preferredContactMethod: "email",
      specialNotes: "Smoke test for find-booking and history flow"
    })
  });

  const bookingJson = await parseJson(bookingResponse);
  assert(bookingResponse.ok, `Create booking failed: ${bookingResponse.status} ${JSON.stringify(bookingJson)}`);
  const bookingId = bookingJson?.booking?.id;
  assert(bookingId, "Booking ID missing");

  const directLookupResponse = await fetch(`${BASE_URL}/api/bookings/find`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
      bookingIdOrPhone: bookingId,
      action: "open"
    })
  });
  const directLookupJson = await parseJson(directLookupResponse);
  assert(directLookupResponse.ok, `Direct lookup failed: ${directLookupResponse.status} ${JSON.stringify(directLookupJson)}`);
  assert(
    typeof directLookupJson.redirectUrl === "string" && directLookupJson.redirectUrl.includes("/booking-reply?token="),
    "Direct lookup did not return booking-reply redirectUrl"
  );

  const historyUrl = directLookupJson.historyUrl || "";
  assert(historyUrl.includes("/booking-history?token="), "History URL missing from direct lookup response");

  const historyTarget = new URL(historyUrl);
  const historyLocalUrl = `${base.origin}${historyTarget.pathname}${historyTarget.search}`;

  const historyPageResponse = await fetch(historyLocalUrl);
  const historyPageHtml = await historyPageResponse.text();
  assert(historyPageResponse.ok, `History page failed: ${historyPageResponse.status}`);
  assert(historyPageHtml.includes("Your Booking History"), "History page missing heading");
  assert(historyPageHtml.includes(bookingId), "History page missing booking ID");

  const phoneLookupResponse = await fetch(`${BASE_URL}/api/bookings/find`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email,
      bookingIdOrPhone: phone,
      action: "open"
    })
  });
  const phoneLookupJson = await parseJson(phoneLookupResponse);
  assert(phoneLookupResponse.status === 403, `Phone open lookup should be denied: ${phoneLookupResponse.status} ${JSON.stringify(phoneLookupJson)}`);

  console.log(JSON.stringify({
    bookingId,
    directOpen: true,
    historyPage: true,
    phoneOpenDenied: true
  }, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
