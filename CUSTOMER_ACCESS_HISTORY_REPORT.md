# CUSTOMER_ACCESS_HISTORY_REPORT

## Routes Added
- Public pages:
  - /find-booking
  - /booking-history?token=...
- Public API:
  - POST /api/bookings/find

## Lookup Flow (Phase 1)
1. Customer opens /find-booking.
2. Customer enters:
   - booking email
   - booking ID or phone
3. Server verifies against real Firestore booking data:
   - booking ID lookup path: strict bookingId + email match
   - phone lookup path: email-scoped bookings + normalized phone match
4. If verified:
   - action=open and matched by booking ID -> returns secure redirect URL to /booking-reply?token=...
   - action=email -> sends a fresh secure email containing:
     - booking chat link
     - booking history link
5. If action=open is attempted with phone lookup, server denies direct redirect and requires email delivery.

## History Flow (Phase 2)
1. Customer receives history link with signed token.
2. /booking-history verifies token signature + expiry and extracts verified customer email.
3. Server loads all bookings tied to that verified email from Firestore.
4. For each booking, page shows:
   - booking id
   - event date
   - event type
   - status
   - package
   - last message preview
   - Open Chat button
5. Open Chat uses per-booking secure reply token (/booking-reply?token=...).

## Email Updates (Phase 3)
Updated customer-facing admin-action emails to include direct booking chat links and clear booking-update subjects:
- Mark Reviewed -> Booking Update: Reviewed - <date>
- Mark Confirmed -> Booking Update: Confirmed - <date>
- Mark Declined -> Booking Update: Declined - <date>
- Admin Send Message -> Booking Update: New Message from DJ Press - <date>

Status-update emails now include:
- direct private booking chat link
- existing booking/status detail context

## Security Model
- No placeholder or mock booking data used.
- Customer access links are signed (HMAC) and expiration-bound.
- Booking history token is signed, scoped to verified customer email, and expiration-bound.
- Booking chat token remains booking-specific and email-bound.
- No cross-booking public access was introduced.
- Phone-based lookup cannot directly open chat; it must use secure email delivery.
- Existing admin inbox/thread model and booking message structure are preserved.

## Files Changed
- src/app/find-booking/page.tsx
- src/components/forms/find-booking-form.tsx
- src/app/api/bookings/find/route.ts
- src/app/booking-history/page.tsx
- src/lib/customer-access.ts
- src/lib/bookings.ts
- src/lib/booking-threads.ts
- src/lib/notifications/types.ts
- src/lib/notifications/index.ts
- src/lib/notifications/email.ts
- scripts/customer-access-smoke.mjs

## Test Results
- Runtime smoke test:
  - command: node scripts/customer-access-smoke.mjs
  - result: pass
  - validated:
    - direct open via booking ID works
    - booking-history renders verified booking data
    - phone-based direct open is safely denied
- npm run lint: pass
- npx tsc --noEmit: pass
- npm run build: pass
