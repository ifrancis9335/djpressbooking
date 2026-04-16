# djpressbooking.com — Full Production Audit

**Audit date:** 2025-07  
**Stack:** Next.js 15.5.14 · App Router · TypeScript strict  
**Key services:** Firebase Admin/Client (Auth + Firestore + Storage), Neon PostgreSQL, Resend (email)  
**`npm run lint`:** ✅ Clean · **`npx tsc --noEmit`:** ✅ Clean

---

## Executive Summary

The codebase is well-structured with solid separation of concerns, Zod validation on all public-facing inputs, proper timing-safe token verification, and consistent admin auth guards. The direct-email route and admin auth system are production-hardened. However, four critical issues must be resolved before going live:

1. `NEXT_PUBLIC_FIREBASE_APP_ID` has a literal comment URL as its value — Firebase client will accept this and silently malfunction.
2. Admin settings (contact info, package pricing, booking on/off) write to a local JSON file on disk — **changes will not persist on Vercel** and will fail silently.
3. There is no Next.js `middleware.ts` — the `/admin` page bundle is served to unauthenticated visitors with no edge-level protection.
4. The in-memory rate limiter is not shared across serverless function instances — login brute-force protection does not work as intended in production.

---

## What Is Working Well

- All public POST endpoints validate with Zod schemas; error responses are consistent.
- Admin auth uses an HMAC-signed, expiring session cookie with `timingSafeEqual` for signature verification.
- CSRF protection (double-submit cookie+header pattern) is applied to all mutation endpoints.
- The Resend direct-email route is fully hardened: auth before logging, env guards, email format validation, body-length limits, proper HTML escaping, and `replyTo`.
- Rate limiting is in place on login (8/15 min) and booking submit (30/10 min).
- Firebase Admin init is guarded by `isFirebaseAdminConfigured()` before use.
- Booking creation uses a Firestore transaction to prevent double-booking.
- All `console.log` in booking routes is behind `isDev` guards.

---

## Issues by Severity

---

### 🔴 CRITICAL

---

#### C-1 · `NEXT_PUBLIC_FIREBASE_APP_ID` value is a comment URL

| | |
|---|---|
| **File** | `.env.local` → read by `src/lib/firebase/client.ts` |
| **What** | `NEXT_PUBLIC_FIREBASE_APP_ID=// https://firebase.google.com/docs/web/setup#available-libraries` |
| **Why** | `isConfiguredValue()` only rejects empty strings and `replace-with-*` prefixes. This value passes the check, so `isFirebaseClientConfigured` evaluates to `true`. Firebase is initialized with a junk App ID. Any client-side Firestore `onSnapshot` or reads will fail at runtime with a Firebase SDK error that is hard to trace. |
| **Fix** | Open the Firebase console → Project settings → Your apps → copy the real App ID (format: `1:704923951222:web:xxxxxxxx`). Update `.env.local` and in Vercel's environment variable settings: `NEXT_PUBLIC_FIREBASE_APP_ID=1:704923951222:web:YOUR_REAL_APP_ID` |

---

#### C-2 · Admin settings write to local filesystem — will not persist on Vercel

| | |
|---|---|
| **File** | `src/lib/site-settings.ts` → `saveSiteSettings()` / `patchSiteSettings()` |
| **What** | `saveSiteSettings()` writes to `data/site-settings.json` via `fs.writeFile`. In a Vercel serverless deployment the project filesystem is read-only; each function invocation gets a fresh, immutable bundle. |
| **Why** | Any admin action that saves settings (contact info, package pricing, booking enabled/disabled, hero text, gallery images) will either throw an `EROFS` error in production or write to a path that is discarded when the function container is recycled. The read path falls back to defaults, so users may see stale or default data. |
| **Fix** | Migrate settings storage from the filesystem to a durable backend. Options in priority order: <br>1. **Firebase Firestore** — already in use. Add a `site_settings` Firestore document, read with Admin SDK on the server. Consistent with the rest of the data layer. <br>2. **Neon PostgreSQL** — already connected via `DATABASE_URL`. A single `site_settings` table with a JSON column. <br>3. **Vercel KV / Edge Config** — least migration effort but introduces another service dependency. |

---

#### C-3 · No Next.js middleware — `/admin` route has no edge-level auth gate

| | |
|---|---|
| **File** | `middleware.ts` — does not exist |
| **What** | The `/admin` page at `src/app/admin/page.tsx` renders the `AdminDashboard` component without any server-side redirect for unauthenticated users. Auth is handled entirely inside the dashboard component (client-side) after the full page HTML and JS bundle have been delivered. |
| **Why** | Any visitor can load the admin page, receive the admin JavaScript bundle, and inspect its code. A `middleware.ts` would redirect unauthenticated requests before any bundle is served. |
| **Fix** | Create `src/middleware.ts` (or `src/app/middleware.ts`): <br>```ts<br>import { NextResponse } from "next/server";<br>import type { NextRequest } from "next/server";<br>import { ADMIN_SESSION_COOKIE } from "./lib/admin-auth";<br><br>export function middleware(request: NextRequest) {<br>  if (request.nextUrl.pathname.startsWith("/admin")) {<br>    const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;<br>    if (!session) {<br>      return NextResponse.redirect(new URL("/admin/login", request.url));<br>    }<br>  }<br>  return NextResponse.next();<br>}<br><br>export const config = {<br>  matcher: ["/admin/:path*"]<br>};<br>``` <br>Note: Full session verification cannot run in Edge middleware because it uses `crypto.HMAC` (Node.js only). A lightweight cookie-presence check is sufficient at the edge; the API routes still do full HMAC verification server-side. |

---

#### C-4 · In-memory rate limiter is per-instance, not distributed

| | |
|---|---|
| **File** | `src/lib/security/rate-limit.ts` |
| **What** | Counters are stored in a module-level `Map`. In a serverless/Vercel deployment, each function invocation may run on a different container with its own memory. |
| **Why** | An attacker making 8 login attempts from the same IP can bypass the `admin-login` rate limit (8/15 min) by simply having requests land on different function instances. The same applies to the booking-submit (30/10 min) and contact-submit (20/10 min) limits. |
| **Fix** | Replace the in-memory store with a distributed store. Ordered by least effort: <br>1. **Upstash Redis** (Vercel integration, free tier) + `@upstash/ratelimit` — drop-in and well-tested. <br>2. **Vercel KV** — serverless Redis, same approach. <br>3. Until a distributed limiter is in place, add note in runbooks that the login limit is best-effort only. |

---

### 🟠 HIGH

---

#### H-1 · `validateAdminPassword()` uses `===`, not timing-safe comparison

| | |
|---|---|
| **File** | `src/lib/admin-auth.ts` line ~55 |
| **What** | `return input === expected` is a standard string equality check, vulnerable to timing attacks. |
| **Why** | JavaScript string `===` short-circuits on the first differing character. An attacker making many login attempts and measuring response time can infer password prefixes. Session creation (`buildAdminSessionValue`) and verification (`isValidAdminSessionValue`) are correctly timing-safe via `timingSafeEqual`, but the password check is not. |
| **Fix** | Replace `===` with the already-imported `timingSafeEqualStrings` helper: <br>```ts<br>export function validateAdminPassword(input: string) {<br>  const expected = getAdminSecret();<br>  if (!expected) return false;<br>  return timingSafeEqualStrings(input, expected);<br>}<br>``` |

---

#### H-2 · `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` has a SHA hash value, not a bucket name

| | |
|---|---|
| **File** | `.env.local` → read by `src/lib/firebase.ts` (`getServerStorageBucket`) |
| **What** | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=d832daf2773efa574900a89144fcbbf6ad157b5e` — this looks like a git commit SHA, not a Firebase storage bucket name. Valid format: `projectid.appspot.com` or `projectid.firebasestorage.app`. |
| **Why** | `getServerStorageBucket()` passes this value directly to `getStorage(app).bucket(bucketName)`. Firebase Storage will return a "bucket not found" or permission error for any image upload. The admin image upload flow (gallery, branding, services) will fail entirely. |
| **Fix** | Open the Firebase console → Storage → copy the bucket name from the gs:// URL (e.g., `gs://djpressbooking.appspot.com` → bucket name is `djpressbooking.appspot.com`). Set: `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=djpressbooking.appspot.com` (no quotes). |

---

#### H-3 · Same secret used as admin auth key AND as HMAC signing key for customer tokens

| | |
|---|---|
| **Files** | `src/lib/admin-auth.ts`, `src/lib/customer-access.ts`, `src/lib/booking-threads.ts` |
| **What** | All three modules call `process.env.ADMIN_API_KEY \|\| process.env.ADMIN_PASSWORD` as the signing secret. This same key is used for: admin session HMAC, customer booking-history link HMAC, and booking reply-token HMAC. |
| **Why** | Key reuse across unrelated contexts is a security anti-pattern. A valid customer history token is HMAC-signed with the same key as admin sessions. If the key format were ever predictable or if token values were observable, this could theoretically allow cross-context abuse. Also: if you rotate the admin password, all outstanding customer reply and history links are immediately invalidated — unexpected UX breakage. |
| **Fix** | Introduce separate secrets per context (add to `.env.local` and Vercel): <br>`CUSTOMER_ACCESS_SECRET=<32-byte random hex>` <br>`BOOKING_REPLY_SECRET=<32-byte random hex>` <br>Update `getAccessSecret()` in `customer-access.ts` to read `CUSTOMER_ACCESS_SECRET`, and `getReplySecret()` in `booking-threads.ts` to read `BOOKING_REPLY_SECRET`. Keep `ADMIN_API_KEY` for admin sessions only. |

---

#### H-4 · No HTTP security headers configured

| | |
|---|---|
| **File** | `next.config.mjs` |
| **What** | No `headers()` configuration — the app ships with no `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, or `Referrer-Policy`. |
| **Why** | Without these headers, the site is vulnerable to clickjacking (`X-Frame-Options`), MIME-sniffing attacks (`X-Content-Type-Options`), and a wide range of XSS vectors (`Content-Security-Policy`). |
| **Fix** | Add security headers to `next.config.mjs`: <br>```js<br>async headers() {<br>  return [{<br>    source: "/(.*)",<br>    headers: [<br>      { key: "X-Frame-Options", value: "DENY" },<br>      { key: "X-Content-Type-Options", value: "nosniff" },<br>      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },<br>      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },<br>    ]<br>  }]<br>}<br>``` <br>CSP is more complex — add incrementally after testing. Start with `Content-Security-Policy-Report-Only`. |

---

#### H-5 · Production `console.log` calls in the direct-email route

| | |
|---|---|
| **File** | `src/app/api/admin/bookings/[bookingId]/direct-email/route.ts` lines 54–59 |
| **What** | Five `console.log` calls fire unconditionally in production: route hit, key loaded/missing, key length, key suffix, sender. A sixth logs the full Resend response object. |
| **Why** | Log verbosity in production increases noise in observability tools, can expose operational detail (key length, suffix) in shared log streams, and the final `EMAIL SENT:` log dumps the raw Resend API response including email IDs. |
| **Fix** | Gate behind an `isDev` check or move to `logAdminDebug`: <br>```ts<br>const isDev = process.env.NODE_ENV !== "production";<br>if (isDev) {<br>  console.log("[direct-email] route hit", { bookingId });<br>  // ... other diagnostics<br>}<br>``` |

---

### 🟡 MEDIUM

---

#### M-1 · `email.ts` notification sender uses raw `fetch` instead of Resend SDK

| | |
|---|---|
| **File** | `src/lib/notifications/email.ts` → `sendResendEmail()` |
| **What** | Booking-created, status-updated, and thread-message notifications use `fetch("https://api.resend.com/emails", ...)` directly with manual header and body construction. The direct-email route correctly uses `new Resend(apiKey).emails.send()` via the SDK. |
| **Why** | Raw fetch bypasses Resend SDK's type-safe request/response, automatic error normalization, and retry logic. If the Resend API changes its response shape, `email.ts` will silently handle it incorrectly. Inconsistency between two email-sending code paths creates maintenance risk. |
| **Fix** | Refactor `sendResendEmail()` in `email.ts` to use the Resend SDK (resend is already installed). Share a factory or singleton `new Resend(apiKey)` across both modules. |

---

#### M-2 · `NEXT_PUBLIC_SITE_URL` is `http://localhost:3000` — customer email links will break

| | |
|---|---|
| **File** | `.env.local` (also applies to Vercel env vars) |
| **What** | `NEXT_PUBLIC_SITE_URL=http://localhost:3000` is the only value set. `public-url.ts::toPublicAbsoluteUrl()` uses this to build booking-history and reply URLs embedded in customer emails. |
| **Why** | Every notification email sent to a customer containing a "view your booking" or "reply" link will point to `http://localhost:3000/...` which is unreachable from the Internet. |
| **Fix** | In Vercel → Project Settings → Environment Variables (Production scope): <br>`NEXT_PUBLIC_SITE_URL=https://djpressbooking.com` <br>Keep `http://localhost:3000` in `.env.local` for local development only. |

---

#### M-3 · `POSTGRES_SSL` not set — SSL config is ambiguous

| | |
|---|---|
| **File** | `src/lib/db.ts` · `.env.local` |
| **What** | `db.ts` enables pool SSL only when `POSTGRES_SSL === "true"`. The env var is not present in `.env.local`. Neon PostgreSQL requires TLS; the connection string has `sslmode=require` which `pg` does honor from the connection string, but the pool's `ssl` option is `undefined`. |
| **Why** | Behavior depends on the `pg` driver version's handling of `sslmode` in the connection string vs. the pool `ssl` option. In some configurations, `sslmode=require` in the string is overridden by an explicit `ssl: undefined`. This could cause intermittent "SSL required" errors. Also, `rejectUnauthorized: false` in the current code (when POSTGRES_SSL=true) disables cert verification — a weaker security posture. |
| **Fix** | Set `POSTGRES_SSL=true` in Vercel production env vars. Then update `db.ts` to use `rejectUnauthorized: true` (the default) unless you have a specific reason to disable it: <br>```ts<br>ssl: process.env.POSTGRES_SSL === "true" ? true : undefined<br>``` |

---

#### M-4 · `BOOKING_NOTIFICATION_EMAIL_FROM` display name has no space — branding issue

| | |
|---|---|
| **File** | `.env.local` |
| **What** | `BOOKING_NOTIFICATION_EMAIL_FROM=DJPressBooking <booking@djpressbooking.com>` — display name is `DJPressBooking` (no space). |
| **Why** | Customer emails will show "From: DJPressBooking" rather than "DJ Press Booking". Cosmetic but breaks brand presentation and may look like spam. |
| **Fix** | `BOOKING_NOTIFICATION_EMAIL_FROM=DJ Press Booking <booking@djpressbooking.com>` |

---

#### M-5 · In-memory rate limit `store` Map has no eviction — unbounded memory growth

| | |
|---|---|
| **File** | `src/lib/security/rate-limit.ts` |
| **What** | The module-level `store` Map accumulates one entry per unique IP. Entries are only compacted within live windows when that IP makes another request. IPs that make exactly one request are never evicted. |
| **Why** | In a long-running container under load from varied IPs, the Map grows without bound, consuming memory until the container is recycled. Minor in practice given serverless lifecycles, but should be cleaned up. |
| **Fix** | Add periodic pruning or cap the store size. Simplest: after each `compactWindow`, evict the key if `compacted` is now empty: <br>```ts<br>if (compacted.length === 0) { store.delete(key); return; }<br>``` |

---

#### M-6 · `resolvePackageLabel` duplicated across two route files

| | |
|---|---|
| **Files** | `src/app/api/bookings/route.ts`, `src/app/api/admin/bookings/[bookingId]/messages/route.ts` |
| **What** | Identical `resolvePackageLabel` function defined in two places. |
| **Why** | Changes to package ID mapping (e.g. new `elite` tier) must be made in two places. Risk of divergence. |
| **Fix** | Extract to `src/lib/bookings.ts` or a new `src/lib/package-labels.ts` utility and import. |

---

### 🔵 LOW

---

#### L-1 · Two separate Firebase Admin SDK init functions

| | |
|---|---|
| **Files** | `src/lib/firebase.ts` (`initFirebaseAdmin`), `src/lib/firebase/admin.ts` (`initAdminApp`) |
| **What** | Two files each call `initializeApp` with their own logic. `firebase.ts` includes `storageBucket` in the config; `firebase/admin.ts` does not. Both guard with `getApps().length > 0`. |
| **Why** | Only one `initializeApp` call can succeed; whichever runs first wins. The second effectively becomes a no-op `getApp()`. If `firebase/admin.ts` initializes first (via `getAdminDb()`), the app is created without a storage bucket, and `getServerStorageBucket()` in `firebase.ts` will get the default (unnamed) bucket — potentially wrong. |
| **Fix** | Consolidate to one init function. Update all imports to use the canonical `firebase.ts` exports. Remove `src/lib/firebase/admin.ts`. |

---

#### L-2 · `logout` route is not CSRF-protected

| | |
|---|---|
| **File** | `src/app/api/admin/auth/logout/route.ts` |
| **What** | `POST /api/admin/auth/logout` clears admin cookies without requiring a CSRF token. |
| **Why** | A CSRF attack from a malicious page could force logout but cannot gain access. This is a low-risk "logout CSRF" — annoying but not dangerous. However, it is inconsistent with all other mutation routes. |
| **Fix** | Add `requireAdminCsrf(request)` before clearing cookies, or accept the low-risk nature and document the exception. |

---

#### L-3 · `admin-debug.ts` logs in all non-production environments (including staging/preview)

| | |
|---|---|
| **File** | `src/lib/admin-debug.ts` |
| **What** | `shouldLogAdminDebug()` returns `true` when `NODE_ENV !== "production"`. Vercel preview builds have `NODE_ENV=production`, so this is fine for Vercel. But any staging environment not using `NODE_ENV=production` will emit verbose debug logs including booking IDs and admin event types. |
| **Why** | Low risk for this project, but debug logs in a shared log stream may expose booking counts, IDs, or auth event patterns. |
| **Fix** | Acceptable as-is. If a formal staging environment is introduced, set `NODE_ENV=production` or use the `ADMIN_DEBUG=true` opt-in override to control logging explicitly. |

---

#### L-4 · `ADMIN_API_KEY` and `ADMIN_PASSWORD` are the same value

| | |
|---|---|
| **File** | `.env.local` |
| **What** | Both variables have the identical value. Code uses `ADMIN_API_KEY \|\| ADMIN_PASSWORD` as a fallback chain. |
| **Why** | Having two env var names for the same value is confusing. If one is rotated and the other is not, the code silently falls back to the old value. |
| **Fix** | Standardize on `ADMIN_API_KEY`. Remove `ADMIN_PASSWORD` from `.env.local` and Vercel env vars. Ensure `getAdminSecret()` still falls back gracefully during transition. |

---

#### L-5 · `NEXT_PUBLIC_FIREBASE_PROJECT_ID` and related vars have unnecessary quotes in `.env.local`

| | |
|---|---|
| **File** | `.env.local` |
| **What** | `NEXT_PUBLIC_FIREBASE_PROJECT_ID="djpressbooking"` — quotes are included inside the value string by some parsers, resulting in `projectId` being `"djpressbooking"` (with literal quote characters) rather than `djpressbooking`. |
| **Why** | Next.js's `.env` parser strips surrounding double-quotes correctly, so this is actually fine for Next.js. However, if the file is ever read by a different parser (Docker, bash `source .env.local`), the quotes will be included. |
| **Fix** | Remove surrounding quotes: `NEXT_PUBLIC_FIREBASE_PROJECT_ID=djpressbooking` |

---

## Environment Variables Audit Table

| Variable | Status | Issue |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | ⚠️ Wrong for prod | Set to `http://localhost:3000` — customer email links will break |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ Looks valid | `AIzaSy...` format is correct |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ Valid | `djpressbooking.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ Valid (quoted) | Remove quotes for clarity |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | 🔴 Broken | SHA-like hash, not a bucket name |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ Valid (quoted) | Remove quotes for clarity |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 🔴 Broken | Value is a comment URL, not an App ID |
| `FIREBASE_PROJECT_ID` | ✅ Valid | |
| `FIREBASE_CLIENT_EMAIL` | ✅ Valid | Service account email format |
| `FIREBASE_PRIVATE_KEY` | ✅ Valid | Has `\\n` escape handling in code |
| `ADMIN_API_KEY` | ⚠️ Duplicate | Same value as `ADMIN_PASSWORD` |
| `ADMIN_PASSWORD` | ⚠️ Redundant | Same as `ADMIN_API_KEY`, remove one |
| `DATABASE_URL` | ✅ Valid | Neon connection string with `sslmode=require` |
| `POSTGRES_SSL` | ❌ Missing | Should be `true` for Neon in production |
| `RESEND_API_KEY` | ✅ Valid | `re_U4wbU5Bv_...` — new key confirmed |
| `BOOKING_NOTIFICATION_EMAIL_FROM` | ⚠️ Cosmetic | Display name `DJPressBooking` has no space |
| `BOOKING_NOTIFICATION_EMAIL_TO` | ✅ Valid | `djpressbooking@gmail.com` |
| `CUSTOMER_ACCESS_SECRET` | ❌ Missing | Add separate secret for customer history tokens |
| `BOOKING_REPLY_SECRET` | ❌ Missing | Add separate secret for reply tokens |

---

## Production Blockers (must fix before launch)

1. **C-1** — Fix `NEXT_PUBLIC_FIREBASE_APP_ID` (copy real App ID from Firebase console)
2. **C-2** — Migrate settings storage to Firestore or PostgreSQL (filesystem writes fail on Vercel)
3. **C-3** — Create `src/middleware.ts` to add edge-level redirect for unauthenticated `/admin` access
4. **H-2** — Fix `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` (use actual bucket name from Firebase console)
5. **M-2** — Set `NEXT_PUBLIC_SITE_URL=https://djpressbooking.com` in Vercel production env vars

---

## Recommended Fix Order

| Priority | Item | Effort |
|---|---|---|
| 1 | **C-1** Fix Firebase App ID in `.env.local` / Vercel | 5 min |
| 2 | **H-2** Fix Firebase Storage Bucket name | 5 min |
| 3 | **M-2** Set correct `NEXT_PUBLIC_SITE_URL` in Vercel | 5 min |
| 4 | **M-4** Fix `BOOKING_NOTIFICATION_EMAIL_FROM` display name | 2 min |
| 5 | **H-1** Make `validateAdminPassword` timing-safe | 10 min |
| 6 | **H-5** Gate direct-email `console.log` behind `isDev` | 10 min |
| 7 | **C-3** Create `src/middleware.ts` for `/admin` route guard | 20 min |
| 8 | **H-4** Add security headers in `next.config.mjs` | 20 min |
| 9 | **L-1** Consolidate Firebase Admin SDK init | 30 min |
| 10 | **C-4** Replace in-memory rate limiter with Upstash Redis | 1–2 h |
| 11 | **C-2** Migrate settings storage from filesystem | 2–4 h |
| 12 | **H-3** Introduce separate secrets per token context | 1 h |
| 13 | **M-1** Move `email.ts` to use Resend SDK | 1 h |
| 14 | **M-6** Deduplicate `resolvePackageLabel` | 15 min |
| 15 | **L-4** Remove redundant `ADMIN_PASSWORD` | 5 min |
| 16 | **L-5** Remove quotes from Firebase env vars | 5 min |
