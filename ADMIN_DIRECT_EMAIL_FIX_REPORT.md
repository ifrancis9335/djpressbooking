# Admin Direct Email Fix Report

**Date:** 2026-04-13  
**Status:** ✅ Fixed and verified (email sent, terminal confirmed)

---

## Files Changed

| File | Change |
|------|--------|
| `src/app/api/admin/bookings/[bookingId]/direct-email/route.ts` | Full rewrite — consistent response shape, body parsing fix, env-based sender, full validation, structured logging |
| `src/components/admin/dashboard/AdminDirectEmailComposer.tsx` | Full rewrite — removed `parseResponse` helper that read wrong key, replaced with `callDirectEmail` reading `message` key, added network-error protection |

---

## Root Causes Found

### 1. Response shape mismatch (primary cause of "Request failed")
- **Backend** was returning `{ error: string }` on failure, `{ success: true, id }` on success.
- **Frontend `parseResponse`** was reading the `message` key on error objects — found nothing, threw generic `"Request failed"`.
- **Fix:** Backend now returns `{ ok: true, message, id? }` on success and `{ ok: false, message, details? }` on failure. Frontend reads `message` uniformly.

### 2. `context.params` dropped from route signature
- Previous session's rewrite changed `POST(request, context)` to `POST(request)`, losing the `bookingId` path param.
- This meant no bookingId was available for logging.
- **Fix:** Route signature restored to `POST(request: Request, context: { params: Promise<{ bookingId: string }> })`.

### 3. Hardcoded `from` with no env var fallback
- `from` was hardcoded to `"DJ Press <onboarding@resend.dev>"` ignoring `BOOKING_NOTIFICATION_EMAIL_FROM`.
- **Fix:** `from = process.env.BOOKING_NOTIFICATION_EMAIL_FROM?.trim() || "DJ Press <onboarding@resend.dev>"`.

### 4. `request.json()` not reliably parsing body
- Using `request.json().catch(() => null)` silently swallowed parse errors with no diagnostic info.
- **Fix:** `request.text()` then `JSON.parse()` with explicit warning on failure. This also fixed a Next.js edge case where `request.json()` can throw and silently return null on first compile.

### 5. No email format validation in route
- Route accepted any string as `to`, passing invalid addresses to Resend.
- **Fix:** Regex validation `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` before calling Resend.

### 6. Frontend did not protect against non-JSON network errors
- `parseResponse` called `.json()` on responses that could be non-JSON (e.g., network gateway errors).
- **Fix:** `callDirectEmail` wraps `fetch` in try/catch and handles JSON parse failure gracefully.

---

## Required Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | ✅ Yes | Resend API secret key |
| `BOOKING_NOTIFICATION_EMAIL_FROM` | Optional | Sender address. Falls back to `DJ Press <onboarding@resend.dev>` |
| `ADMIN_API_KEY` | ✅ Yes | Admin API auth header value |

Auth uses **session cookie** (`dj_admin_session`) OR `x-admin-key` header. The frontend (logged-in admin) relies on the session cookie. CSRF token from `dj_admin_csrf` cookie must match `X-CSRF-Token` header.

---

## Exact Route

```
POST /api/admin/bookings/[bookingId]/direct-email
```

### Request Headers
```
Content-Type: application/json
X-CSRF-Token: <value of dj_admin_csrf cookie>
Cookie: dj_admin_session=<session>; dj_admin_csrf=<token>
```

### Request Body
```json
{
  "to": "customer@example.com",
  "subject": "Update for your DJ Press booking",
  "message": "Plain text message body"
}
```

Constraints:
- `to`: valid email format, required
- `subject`: 1–200 characters, required
- `message`: 1–10,000 characters, required

### Success Response (HTTP 200)
```json
{ "ok": true, "message": "Email sent successfully.", "id": "<resend-email-id>" }
```

### Failure Response (HTTP 400 / 401 / 403 / 502 / 500)
```json
{ "ok": false, "message": "<human-readable reason>", "details": {} }
```

---

## Server-Side Diagnostic Logs

Every request logs:
```
[direct-email] route hit { bookingId: '...' }
[direct-email] RESEND_API_KEY: Loaded | Missing
[direct-email] sender: DJ Press <onboarding@resend.dev>
[direct-email] EMAIL SENT: { id: '...' }         ← on success
[direct-email] Resend error: ...                  ← on Resend failure
[direct-email] unexpected error: ...              ← on unhandled throw
```

---

## Success Test Result

**Live test (2026-04-13):**
```
POST /api/admin/bookings/TEST123/direct-email
→ HTTP 200
← { "ok": true, "message": "Email sent successfully.", "id": "08f21f29-0710-4db6-8519-a2a7ac9c5920" }
```

Terminal confirmed: `[direct-email] EMAIL SENT: { id: '08f21f29-0710-4db6-8519-a2a7ac9c5920' }`

---

## Resend Sandbox Limitations

| Limitation | Detail |
|-----------|--------|
| Sandbox `from` | `onboarding@resend.dev` only sends to the **Resend account owner's email** (the address used to sign up at resend.com) |
| Other recipients | Returns `403 validation_error` — "You can only send testing emails to your own email address" |
| Fix for production | Verify a domain at [resend.com/domains](https://resend.com/domains), then set `BOOKING_NOTIFICATION_EMAIL_FROM=booking@djpressbooking.com` in `.env.local` (or production env) |

The route is **production-ready** — once a custom domain is verified in Resend and `BOOKING_NOTIFICATION_EMAIL_FROM` is updated, emails will reach any recipient without code changes.

---

## Validation Results

| Check | Result |
|-------|--------|
| `npm run lint` | ✅ Pass |
| `npx tsc --noEmit` | ✅ Pass |
| `npm run build` | ✅ Pass |
| Route compiles in dev | ✅ `ƒ /api/admin/bookings/[bookingId]/direct-email` |
| Missing fields (400) | ✅ `{ ok: false, message: "Fields 'to', 'subject', and 'message' are all required." }` |
| Invalid email (400) | ✅ `{ ok: false, message: "Invalid recipient email address." }` |
| Sandbox restriction (502) | ✅ `{ ok: false, message: "Resend send failed: You can only send testing emails to your own email address..." }` |
| Successful send (200) | ✅ `{ ok: true, message: "Email sent successfully.", id: "08f21f29-..." }` |
