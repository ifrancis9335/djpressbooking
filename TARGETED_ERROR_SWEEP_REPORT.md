# TARGETED_ERROR_SWEEP_REPORT

## Scope Reviewed
- Booking flow (client + API + Firestore write path)
- Availability flow (public + admin)
- Admin login/dashboard
- Admin CMS content/settings saves
- Image upload/delete API
- Public settings loading
- Firestore and Postgres write paths
- Route handlers and JSON parsing safety
- Environment variable usage patterns
- Fallback and query-parameter handling

## Issues Found
1. Malformed JSON bodies in several write routes could bubble into generic 500 responses instead of client-safe 400 responses.
2. Firestore undefined-field crash risk had already been addressed for booking submit path; no new undefined-to-Firestore path was found in the reviewed scope.
3. Promise-all hard-failure pattern in admin dashboard was already corrected to resilient loading behavior.
4. Package query handling in booking flow was already normalized and guarded.

## Issues Fixed
1. Added malformed JSON guards (`request.json().catch(() => null)` + explicit 400 response) for these routes:
- src/app/api/contact/route.ts
- src/app/api/bookings/route.ts (PATCH and POST)
- src/app/api/admin/auth/login/route.ts
- src/app/api/admin/content/route.ts
- src/app/api/admin/settings/route.ts
- src/app/api/admin/availability/block/route.ts
- src/app/api/admin/availability/unblock/route.ts

Behavioral impact:
- Invalid/empty JSON payloads now return `400 { message: "Invalid JSON payload" }` instead of generic 500 errors.
- Existing validation logic and success paths are unchanged.

## High-Risk Areas Still Remaining
1. Partial-degradation patterns are not uniformly applied across all route handlers; some non-critical endpoints still intentionally fail hard on backend outages.
2. Firebase admin initialization helpers exist in two places (`src/lib/firebase.ts` and `src/lib/firebase/admin.ts`), with one appearing unused. This is not currently breaking, but duplication can drift.
3. Runtime database/firestore integration behavior still depends on external service availability; static checks cannot validate live infrastructure reliability.

## Deferred Improvements (Intentionally Not Changed)
1. No route contract redesigns (response shape/status conventions) to avoid breaking existing clients.
2. No UI/layout changes to booking/admin/public pages.
3. No broad refactor to centralize JSON parsing/error utilities across all routes.
4. No unification/removal of duplicate Firebase admin helper modules in this sweep.

## Validation Results
- `npm run lint`: PASS
- `npx tsc --noEmit`: PASS
- `npm run build`: PASS
