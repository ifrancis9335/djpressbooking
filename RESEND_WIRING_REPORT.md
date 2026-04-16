# RESEND_WIRING_REPORT

## Files Checked
- src/lib/notifications/email.ts
- src/lib/notifications/index.ts
- src/lib/notifications/types.ts
- src/lib/notifications/sms.ts
- src/app/api/bookings/route.ts
- src/app/api/admin/bookings/[bookingId]/messages/route.ts
- src/app/api/bookings/reply/route.ts
- ENVIRONMENT_VARIABLES.md
- .env.example

## Files Changed
- src/lib/notifications/email.ts
- src/lib/notifications/index.ts
- ENVIRONMENT_VARIABLES.md
- .env.example
- scripts/resend-wiring-e2e.mjs

## Env Vars Used
- RESEND_API_KEY
- BOOKING_NOTIFICATION_EMAIL_TO
- BOOKING_NOTIFICATION_EMAIL_FROM
- NEXT_PUBLIC_SITE_URL

## Live Email Flows Wired
1. New booking alert emails to business inbox
- Trigger: POST /api/bookings
- Sender: BOOKING_NOTIFICATION_EMAIL_FROM
- Recipient: BOOKING_NOTIFICATION_EMAIL_TO
- Provider auth: RESEND_API_KEY

2. Booking status update emails to customers
- Trigger: PATCH /api/bookings (reviewed/confirmed/declined mapped statuses)
- Sender: BOOKING_NOTIFICATION_EMAIL_FROM
- Recipient: booking.customer.email
- Provider auth: RESEND_API_KEY
- Fail-open behavior preserved

3. Admin-to-customer booking thread emails
- Trigger: POST /api/admin/bookings/[bookingId]/messages
- Sender: BOOKING_NOTIFICATION_EMAIL_FROM
- Recipient: booking.customer.email
- Reply link base: NEXT_PUBLIC_SITE_URL (normalized, trailing slash-safe, localhost fallback)

4. Customer reply notifications back to business inbox
- Trigger: POST /api/bookings/reply
- Sender: BOOKING_NOTIFICATION_EMAIL_FROM
- Recipient: BOOKING_NOTIFICATION_EMAIL_TO

## Logging Added
- Centralized safe email logs in notification sender:
  - send_succeeded
  - send_failed
  - send_skipped (missing env)
- Logged fields include:
  - flow
  - bookingId
  - recipient
  - status/reason where applicable
- Secrets are never logged.

## Test Sender Check
- Searched for hardcoded test sender domains like onboarding@resend.dev/resend.dev in source and docs.
- Result: none found.

## Local Test Execution
### Dev Server
- Started with npm run dev
- Running at: http://localhost:3000
- Links:
  - Public: http://localhost:3000
  - Admin: http://localhost:3000/admin

### Automated E2E Run
- Script: scripts/resend-wiring-e2e.mjs
- Booking ID tested: 2GLLWT1cDAgR7ObsaGlJ

Flow results:
- Booking submit: pass
- Booking appears in admin inbox: pass
- Admin thread message sent: pass
- Reply link opens: pass
- Customer reply submitted: pass
- Reply stored in same booking thread: pass

Provider verification results:
- booking alert to business: fail (resend_env_missing)
- admin thread email to customer: fail (resend_env_missing)
- customer reply alert to business: fail (resend_env_missing)

Observed server logs confirm env-based behavior:
- send_skipped for booking_created because BOOKING_NOTIFICATION_EMAIL_TO/RESEND_API_KEY not configured
- send_skipped for admin_thread_message because RESEND_API_KEY/BOOKING_NOTIFICATION_EMAIL_FROM not configured
- send_skipped for customer_thread_reply because BOOKING_NOTIFICATION_EMAIL_TO/RESEND_API_KEY not configured

## Validation
- npm run lint: pass
- npx tsc --noEmit: pass
- npm run build: pass

## Remaining Limitations
- Full provider-level email confirmation is blocked locally until real values are present for:
  - RESEND_API_KEY
  - BOOKING_NOTIFICATION_EMAIL_FROM
  - BOOKING_NOTIFICATION_EMAIL_TO
- Current local environment has NEXT_PUBLIC_SITE_URL set, but Resend email vars are missing, so provider checks cannot pass yet.
