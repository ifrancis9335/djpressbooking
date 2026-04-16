# CUSTOMER_STATUS_EMAIL_REPORT

## Files Changed
- src/app/api/bookings/route.ts
- src/lib/notifications/email.ts
- src/lib/notifications/index.ts
- src/lib/notifications/sms.ts
- src/lib/notifications/types.ts
- ENVIRONMENT_VARIABLES.md

## Templates Added
- reviewed: sent when admin marks a booking as reviewed (`pending_deposit`)
- confirmed: sent when admin marks a booking as confirmed (`confirmed`)
- declined: sent when admin marks a booking as declined (`cancelled`)

Each template includes:
- customer name
- event date
- package
- booking id
- status update message
- business contact info

## Env Vars Needed
- RESEND_API_KEY
- BOOKING_NOTIFICATION_EMAIL_FROM
- BOOKING_NOTIFICATION_EMAIL_TO

## Test Results
- npm run lint: pass
- npx tsc --noEmit: pass
- npm run build: pass

## Delivery Behavior
- Customer status emails are sent from the booking status PATCH flow.
- Delivery is fail-open: booking status updates still succeed if email delivery fails.
- Email delivery failures are logged with booking id, target status, and channel-level failure reasons.