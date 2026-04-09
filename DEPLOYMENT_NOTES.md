# Deployment Notes

## Stack

- Next.js 15 app-router frontend + API routes
- Firebase Firestore (server writes via Firebase Admin)

## Local run

1. Copy `.env.example` to `.env.local`.
2. Fill all Firebase keys and `ADMIN_API_KEY`.
3. Install dependencies:

```bash
npm install
```

4. Run checks:

```bash
npm run lint
npm run build
```

5. Start dev server:

```bash
npm run dev -- -p 3001
```

## Production environment requirements

Required server-side variables:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `ADMIN_API_KEY`

Required client-side variables:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## Firebase deployment artifacts

- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`

Deploy Firestore rules/indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

## Hosting readiness (Vercel + Firebase Firestore)

1. Set all variables from `.env.example` in Vercel Project Settings -> Environment Variables.
2. Use a long random value for `ADMIN_API_KEY` (do not reuse Firebase client API key).
3. Redeploy after env updates so server runtime picks up secrets.
4. Confirm API behavior after deploy:
	- `GET /api/availability?month=YYYY-MM` -> 200
	- `POST /api/bookings` -> 201 on available date, 409 on duplicate/blocked
	- `POST /api/contact` -> 201
	- `POST /api/availability/block` -> 401 without key, 200 with valid `x-admin-key`
5. Keep Firestore Rules deny-all for direct client access and route all writes/reads through server APIs.

## Pre-launch checklist

- `npm run lint` passes
- `npm run build` passes
- `/api/bookings` returns non-500 with valid Firebase config
- `/api/availability` returns non-500 with valid Firebase config
- Booking submit writes to Firestore
- Contact submit writes to Firestore
- `GET /api/contact` is restricted to admin key access only
