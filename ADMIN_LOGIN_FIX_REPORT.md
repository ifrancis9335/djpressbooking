# ADMIN_LOGIN_FIX_REPORT

## Failing Route
- Primary failing route in the post-login load sequence: `/api/admin/dashboard`

## Root Cause
- After successful `/api/admin/auth/login`, the admin UI immediately loads protected data in parallel.
- `/api/admin/dashboard` depended directly on `listBlockedDates()` with no route-level error handling.
- If blocked-date DB access failed (transient DB issue/config/connectivity), the route threw unhandled and produced a generic client-side error path (`Request failed`).
- Because the failure happened after login success, UI showed:
  - `Authenticated successfully.`
  - then `Request failed`

## Files Changed
- `src/lib/admin-debug.ts` (new)
- `src/lib/admin-auth.ts`
- `src/app/api/admin/auth/login/route.ts`
- `src/app/api/admin/settings/route.ts`
- `src/app/api/admin/content/route.ts`
- `src/app/api/admin/dashboard/route.ts`
- `src/lib/site-settings.ts`
- `src/lib/availability-db.ts`

## Exact Fix Applied
1. Added dev-gated diagnostic logging (`ADMIN_DEBUG=true` or non-production) for:
- login success/failure and cookie/session creation
- protected-route auth checks
- settings/content route loading and patch flow
- site-settings file read/save/fallback behavior
- blocked-date DB list access

2. Hardened `/api/admin/dashboard`:
- wrapped route in `try/catch`
- loaded settings safely
- wrapped blocked-date DB query in its own `try/catch`
- if blocked-date query fails, returns dashboard summary with safe defaults instead of crashing
- logs the failure in dev-gated debug output

3. Kept auth mechanism consistent:
- no split auth model introduced
- existing `ADMIN_API_KEY || ADMIN_PASSWORD` logic preserved
- session cookie logic unchanged, now better instrumented for tracing

4. Preserved all existing systems:
- booking flow unchanged
- availability APIs unchanged in behavior
- CMS phase data structures unchanged
- image upload system unchanged in behavior
- public rendering unchanged in behavior

## Validation Results
- `npm run lint`: PASS
- `npx tsc --noEmit`: PASS
- `npm run build`: PASS

Note:
- During validation, a transient Next route/module cache issue appeared (`PageNotFoundError` for existing API routes).
- Clearing `.next` and rerunning build resolved it.
- Final build completed successfully with all admin routes present.