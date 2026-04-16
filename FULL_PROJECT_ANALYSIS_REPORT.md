# FULL_PROJECT_ANALYSIS_REPORT

## Executive Summary
DJ Press Booking is a Next.js App Router project with a hybrid data model:
- file-based CMS/config for public content and site settings,
- Firestore for bookings and contact submissions,
- Postgres for availability blocking.

The project is functionally strong and has recently improved resilience in admin dashboard loading and Firestore booking writes. The largest remaining risks are architectural consistency and production hardening: mixed source-of-truth boundaries, minimal auth/session hardening for admin, local-disk upload persistence assumptions, and very large client components that centralize too much business logic.

Overall readiness:
- Good for controlled production use with known constraints.
- Needs targeted hardening and modularization for long-term scale and team handoff confidence.

## Current Strengths
- Clear domain separation in major flows:
  - Booking flow in client + API + Firestore transaction path.
  - Availability flow via Postgres with dedicated query helpers.
  - Admin CMS flow via content/settings APIs and section-based validators.
- Strong validation usage with Zod in critical input paths (booking/content/settings/contact).
- Graceful fallback strategy in several places:
  - Public site data defaults via `getPublicSiteData` and `loadSiteContent`.
  - Admin dashboard partial-load resilience (`Promise.allSettled`).
- Booking reliability improvements already in place:
  - Undefined-field scrubbing before Firestore writes.
  - Package query normalization in booking form.
  - Defensive sanitization on booking API and Firestore write payloads.
- Build/lint/type checks currently pass cleanly.

## Current Weaknesses
- Source-of-truth is distributed across static files, file-based CMS JSON, Firestore, and Postgres, with overlap in content/copy/package data.
- Admin auth strategy is minimal and uses a static secret model without stronger session guarantees.
- Local file upload storage (`public/uploads`) is operationally fragile on ephemeral/serverless infrastructure.
- High-complexity client components (notably admin dashboard and booking form) combine UI, state machine behavior, and API orchestration in single files.
- Repeated public-settings loading from multiple server components can create unnecessary repeated reads and dynamic rendering costs.

## Source of Truth Map
### Static files (default/fallback data)
- `src/data/*` provides catalog/services/reviews/site baseline content.
- `src/data/packages.ts` package tier defaults.
- `src/data/site.ts` contact and hero trust defaults.

### CMS / site settings content
- Primary mutable CMS state stored in `data/site-settings.json`.
- Normalized and merged through `src/lib/site-settings.ts` + `src/lib/site-content.ts`.
- Public data composed by `getPublicSiteData()`.

### Firestore
- Bookings collection written/read via `src/lib/bookings.ts`.
- Contact submissions via `src/lib/services/contact-service.ts`.
- Firebase Admin config in `src/lib/firebase.ts` (plus an additional helper file in `src/lib/firebase/admin.ts`).

### Postgres
- Blocked date records and availability state in `blocked_dates` via `src/lib/availability-db.ts`.
- Connection pooling in `src/lib/db.ts`.

### Source-of-truth conflicts still present
- Package data can originate from static catalog and be overridden by file-based settings/content; some pages use transformed CMS package content while other catalog fields remain static.
- Contact/brand messaging exists in both static `src/data/site.ts` and CMS-normalized content/settings.
- Availability state is solely Postgres-driven, but booking state (Firestore) is not a direct source for calendar availability in current public month view.

## Risk Hotspots
- `src/components/admin/admin-dashboard.tsx`:
  - Very large client component with many state domains; high regression surface.
- `src/components/forms/booking-form.tsx`:
  - Multi-step state machine + network orchestration in one file.
- `src/lib/site-settings.ts` + `data/site-settings.json`:
  - File-based persistence and runtime file reads can be brittle in some deployment topologies.
- `src/app/api/admin/uploads/route.ts`:
  - Local disk persistence assumptions may break on stateless hosts.
- `src/lib/admin-auth.ts`:
  - Lightweight auth/session model; acceptable for low-risk admin but not robust for high-security environments.

## Security Review
### Admin auth approach
- Current model:
  - Shared secret from `ADMIN_API_KEY` (or `ADMIN_PASSWORD` fallback) validated server-side.
  - Session cookie contains deterministic hash of the shared secret.
- Risks:
  - Cookie value is deterministic and not per-session/rotating.
  - No explicit CSRF protection on admin mutating endpoints.
  - No lockout/rate limiting for admin login attempts.

### API protection
- Admin routes properly enforce `requireAdminRequest`.
- Public write routes (booking/contact) rely on schema validation but no anti-abuse controls (rate limiting/captcha).

### File upload safety
- Good checks:
  - MIME allowlist, scope allowlist, max size, path boundary resolution on delete.
- Remaining risk:
  - Storage on local filesystem under `public/uploads` lacks durability/security controls expected for cloud production at scale.

### Secret handling
- Env variables are used for Firebase admin and admin secret.
- Documentation mismatch risk:
  - Docs focus on `ADMIN_API_KEY`, while code also accepts `ADMIN_PASSWORD`; this can cause operational confusion.

### Missing production hardening
- No rate limiting/throttling for sensitive/public endpoints.
- No structured security logging/alerting hooks for suspicious auth or upload behavior.

## Performance Review
- `getPublicSiteData()` uses `noStore()` and is called in multiple server components/routes; this forces dynamic behavior and repeated file read/normalization work.
- Client hook `usePublicSiteData` refetches `/api/public/settings` even when initial server data is already present, creating duplicate fetch on hydration path.
- Large client components (booking/admin) carry substantial logic and can increase client bundle/rehydration complexity.
- Availability month calculations are straightforward and acceptable, but repeated fetches with timestamp cache-busters can increase request volume.

## Maintainability Review
- Oversized components:
  - `src/components/admin/admin-dashboard.tsx`
  - `src/components/forms/booking-form.tsx`
- Duplicate/parallel helper concerns:
  - Firebase admin helper logic appears in both `src/lib/firebase.ts` and `src/lib/firebase/admin.ts`.
- Type/validation cohesion is generally good, but could be stronger with a shared transport contract layer for API request/response schemas.
- Many route handlers independently parse JSON and handle errors; recently improved but still partly repetitive.

## Recommended Next 10 Improvements (ranked)
1. Harden admin auth/session model:
- Move to signed, expiring session tokens (or NextAuth/custom signed JWT with rotation).
2. Add rate limiting and abuse controls:
- Apply to `/api/admin/auth/login`, `/api/bookings`, `/api/contact`, and upload routes.
3. Migrate image storage from local filesystem to durable object storage:
- Preserve existing `ManagedImageAsset` contract.
4. Introduce CSRF protection for admin mutating routes.
5. Extract booking flow orchestration into dedicated hooks/modules:
- Keep UI unchanged; reduce component complexity.
6. Split admin dashboard into bounded modules by domain:
- Availability manager, settings manager, content manager.
7. Consolidate Firebase admin initialization into a single module.
8. Reduce duplicate public-settings fetches:
- Use initial server payload as canonical until explicit refresh is needed.
9. Add end-to-end integration tests for booking submit + blocked-date rejection + admin content save.
10. Standardize API contract typing and response envelopes across routes.

## Safest Build Order From Here
### Must do now
1. Admin auth/session hardening.
2. Rate limiting for public/admin write endpoints.
3. Durable upload storage migration plan (and implementation if deploying to stateless infra).

### Should do next
4. Component modularization for booking/admin flows.
5. Consolidate Firebase admin helper duplication.
6. Public-data loading optimization (avoid redundant fetches when initial data exists).
7. Add core integration tests for booking, admin availability, and CMS content save paths.

### Nice to have later
8. Broader API contract standardization.
9. Structured observability (request IDs, metrics, alert hooks).
10. Incremental DX improvements (empty README completion, architecture docs, operational runbook).
