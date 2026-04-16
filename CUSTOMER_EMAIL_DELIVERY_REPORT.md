# CUSTOMER_EMAIL_DELIVERY_REPORT

## Scope
Implemented and verified customer-email delivery wiring for admin booking actions:
1. Mark Reviewed
2. Mark Confirmed
3. Mark Declined
4. Send Message from booking thread

## Files Checked
- src/components/admin/dashboard/AdminBookingsManager.tsx
- src/components/admin/dashboard/AdminBookingThread.tsx
- src/app/api/bookings/route.ts
- src/app/api/admin/bookings/[bookingId]/messages/route.ts
- src/lib/notifications/index.ts
- src/lib/notifications/types.ts
- src/lib/notifications/email.ts
- src/lib/customer-access.ts
- src/app/api/bookings/reply/route.ts

## Files Changed
- src/lib/notifications/types.ts
- src/lib/notifications/index.ts
- src/lib/notifications/email.ts
- src/app/api/bookings/route.ts
- src/app/api/admin/bookings/[bookingId]/messages/route.ts
- scripts/customer-email-delivery-e2e.mjs

## Admin Actions That Now Trigger Customer Email Flow
1. Mark Reviewed
- UI trigger: Admin bookings inbox button in `AdminBookingsManager`
- API path: `PATCH /api/bookings` with `status: pending_deposit`
- Flow logged as: `status_reviewed`

2. Mark Confirmed
- UI trigger: Admin bookings inbox button in `AdminBookingsManager`
- API path: `PATCH /api/bookings` with `status: confirmed`
- Flow logged as: `status_confirmed`

3. Mark Declined
- UI trigger: Admin bookings inbox button in `AdminBookingsManager`
- API path: `PATCH /api/bookings` with `status: cancelled`
- Flow logged as: `status_declined`

4. Send Message from booking thread
- UI trigger: Admin thread composer in `AdminBookingThread`
- API path: `POST /api/admin/bookings/[bookingId]/messages`
- Flow logged as: `admin_thread_message`

## Subject Lines Used
- Reviewed: `Booking received / reviewed - <eventDate>`
- Confirmed: `Booking confirmed - <eventDate>`
- Declined: `Booking declined - <eventDate>`
- Admin thread message: `New message from DJ Press Booking - <eventDate>`

## Email Content Coverage (Customer Emails)
Each customer-facing email now includes:
- customer name
- booking id
- event date
- event type
- package
- current status
- secure chat link (`/booking-reply?token=...`)
- secure booking history link (`/booking-history?token=...`)
- business contact info

## Sender and Env Vars Used
- `RESEND_API_KEY`
- `BOOKING_NOTIFICATION_EMAIL_FROM` (real sender address)
- `NEXT_PUBLIC_SITE_URL` (secure absolute links)

Verification helper script uses these inputs:
- `ADMIN_API_KEY` or `ADMIN_PASSWORD` (admin-route auth)
- `TEST_CUSTOMER_EMAIL` or `REAL_TEST_CUSTOMER_EMAIL` or `BOOKING_NOTIFICATION_EMAIL_TO` (reachable recipient for test booking)

## Fail-Open and Safe Logging Behavior
### Status updates (`PATCH /api/bookings`)
- Status updates complete successfully even when email delivery fails.
- Notification errors do not throw to API response.
- Structured safe logs now include:
  - flow
  - bookingId
  - recipient
  - channel
  - deliveryStatus (`sent` | `failed` | `skipped`)
  - reason

### Admin thread message (`POST /api/admin/bookings/[bookingId]/messages`)
- Message persistence succeeds even if email delivery fails.
- Structured safe logs include the same fields as above.

### Provider timeout hardening
- Added outbound provider timeout (`10s`) so delivery calls cannot hang admin actions.
- Timeout logs as `deliveryStatus: failed`, `reason: email_send_timeout`.

## Exact Local Test Results
### Runtime setup
- Local server restarted/verified on: `http://localhost:3000`

### End-to-end script
- Command: `node scripts/customer-email-delivery-e2e.mjs`
- Result: pass (flow execution)

Output summary:
- baseUrl: `http://localhost:3000`
- recipient: `Dj***@gmail.com`
- actions:
  - markReviewed: `ok`
  - markConfirmed: `ok`
  - markDeclined: `ok`
  - sendThreadMessage: `ok`
- primary booking:
  - id: `JTX78bmmY19D2CZqGvnI`
  - status target: `confirmed`
  - reply link verification: `ok: true`
- secondary booking:
  - id: `aKgwXFjWeKEFflwUdMYA`
  - status target: `cancelled`
  - reply link verification: `ok: true`

### Secure link re-open verification
- `redirectUrl` and `historyUrl` returned by `/api/bookings/find` for both test bookings.
- Booking-reply token API verification loaded the same booking IDs (`ok: true`).

### Server delivery log observations for required flows
Observed flow logs for:
- `status_reviewed`
- `status_confirmed`
- `status_declined`
- `admin_thread_message`

Observed structured delivery state entries for each flow with `deliveryStatus` and recipient.

## Validation Commands
- `npm run lint`: pass
- `npx tsc --noEmit`: pass
- `npm run build`: pass

## Remaining Provider Limitations
Local provider account currently rejects outbound sends to the tested customer recipient with Resend `403 validation_error`:
- "You can only send testing emails to your own email address ... verify a domain ... and change the from address ..."

Impact:
- Trigger wiring is fully active and fail-open behavior is confirmed.
- Real inbox delivery to arbitrary customer recipients is blocked until Resend domain/sender verification is completed on the provider side.
