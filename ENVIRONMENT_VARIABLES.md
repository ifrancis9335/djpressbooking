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
- ADMIN_API_KEY: Shared secret for admin-only booking/availability actions

## Setup

1. Copy `.env.example` to `.env.local`.
2. Fill all values for local development.
3. Add the same values to your deployment platform secrets.
4. Never commit real secrets to git.
