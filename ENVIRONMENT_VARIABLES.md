# Environment Variables

## Client variables

- NEXT_PUBLIC_SITE_URL: Public base URL used for metadata, sitemap and canonical sharing
- NEXT_PUBLIC_FIREBASE_API_KEY: Firebase web API key
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: Firebase auth domain
- NEXT_PUBLIC_FIREBASE_PROJECT_ID: Firebase project id for browser SDK
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: Firebase storage bucket
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: Firebase messaging sender id
- NEXT_PUBLIC_FIREBASE_APP_ID: Firebase web app id

## Server variables

- FIREBASE_PROJECT_ID: Firebase project id for Admin SDK
- FIREBASE_CLIENT_EMAIL: Service account client email
- FIREBASE_PRIVATE_KEY: Service account private key (keep escaped newlines as \n)
- FIREBASE_STORAGE_BUCKET: Firebase Storage bucket for server-side uploads/deletes (optional; defaults to NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET or <project-id>.appspot.com)
- ADMIN_API_KEY: Shared secret for admin-only booking/availability actions
- RESEND_API_KEY: Resend API key used for all booking email flows (new booking alerts, customer status updates, admin thread messages, customer reply alerts)
- BOOKING_NOTIFICATION_EMAIL_FROM: Verified sender address used for all outbound booking emails (business alerts, customer status updates, and booking thread emails)
- BOOKING_NOTIFICATION_EMAIL_TO: Business inbox recipient for new booking alerts and customer reply notifications
- BOOKING_NOTIFICATION_SMS_ENABLED: Optional flag for future SMS channel (`true` enables SMS sender stub)

## Booking Email Flow Mapping

- `POST /api/bookings` sends business alert emails to `BOOKING_NOTIFICATION_EMAIL_TO`.
- `PATCH /api/bookings` status updates send customer emails to the booking email address.
- `POST /api/admin/bookings/[bookingId]/messages` sends admin thread emails to the booking email address.
- `POST /api/bookings/reply` sends customer reply alerts to `BOOKING_NOTIFICATION_EMAIL_TO`.
- Secure thread reply URLs use `NEXT_PUBLIC_SITE_URL` (fallback: `http://localhost:3000` when unset/invalid).

## Setup

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local development.
3. Fill all remaining values for local development.
4. Add the same values to your deployment platform secrets.
5. Never commit real secrets to git.
