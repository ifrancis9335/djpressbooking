# PERMANENT_PORT_FIX_REPORT

## Permanent Local Port Chosen
- 3000
- Stable local base URL: http://localhost:3000

## Files Changed
- package.json
- .env.example
- .env.local
- README.md
- ENVIRONMENT_VARIABLES.md
- src/lib/public-url.ts
- src/lib/notifications/index.ts
- src/lib/customer-access.ts
- src/app/layout.tsx
- scripts/thank-you-chat-link-e2e.mjs
- scripts/thread-e2e-verify.mjs
- scripts/customer-access-smoke.mjs
- scripts/booking-history-nav-flow-e2e.mjs

## Base URL Helper Used
Created shared helper:
- src/lib/public-url.ts

Helper behavior:
1. Prefers NEXT_PUBLIC_SITE_URL.
2. Normalizes trailing slashes.
3. Falls back to http://localhost:3000 when missing/invalid.
4. Provides stable absolute URL generation via toPublicAbsoluteUrl(...).

## Standardization Updates
1. Dev script now pins local development to port 3000 by default.
   - package.json: `next dev --port 3000`
2. Local env template now uses:
   - NEXT_PUBLIC_SITE_URL=http://localhost:3000
3. Local docs now instruct:
   - Public: http://localhost:3000
   - Admin: http://localhost:3000/admin
4. Shared absolute URL generation now used for booking customer links in:
   - booking reply URLs
   - booking history URLs
   - admin-triggered customer emails
   - status update emails
   - find-booking returned redirect/history URLs
   - metadata/open graph/local business base URL usage in app layout

## Routes Verified On Port 3000
- /
- /booking
- /availability
- /find-booking
- /booking-history
- /booking-reply?token=...
- /admin

Verification result: customer/public and admin routes resolved on the same server and same port (3000).

## Generated Link Verification
Created a real booking and verified generated links from /api/bookings/find:
- redirectUrl -> http://localhost:3000/booking-reply?token=...
- historyUrl -> http://localhost:3000/booking-history?token=...

Confirmed no generated customer link drift to 3002/3003/3004/3005/3011 in source/config/scripts used for link generation.

## Remaining Automation-Only Port Exceptions
None for defaults.

Automation scripts still intentionally support override variables for testing flexibility:
- TEST_BASE_URL
- E2E_BASE_URL

These are optional overrides and do not affect human-facing defaults or generated customer/admin links.

## Validation Results
- npm run lint: pass
- npx tsc --noEmit: pass
- npm run build: pass

## Runtime State
- Dev server started and confirmed on http://localhost:3000
- Customer and admin flows now share the same stable base URL/port
