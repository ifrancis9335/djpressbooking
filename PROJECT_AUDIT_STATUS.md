# Project Audit Status

## 1. Executive Summary

The project is in a moderately stable production state: core booking, availability, contact, admin authentication, and customer access flows are structurally sound and currently build cleanly. The codebase shows a meaningful amount of deliberate modularization around auth, data, chat, and payments, and the production route structure is materially better than an ad hoc single-route layout.

Release confidence level: moderate for the existing booking/admin platform, lower for the newly added public AI chat widget UX.

Most urgent issues:

- The public AI chat widget is functionally connected to `/api/chat`, but its current panel composition is still not production-safe in real browsing conditions.
- The chat response area is not visually strong enough for reliable readability, especially when the panel also contains a status card, an error card, a CTA card, and the composer in the same bounded viewport.
- Internal panel scrolling is only partially correct. The message list is the intended scroll region, but the available vertical space is still too tight on shorter mobile viewports and can leave the close button and newest response visually crowded.
- The close button can still feel too low or partially obscured because the overall panel height budget is competing with the sticky booking CTA offset, panel header, topic/status block, error block, CTA block, and composer.
- The local dev runtime on port 3000 showed stale `.next` artifact corruption and module-resolution failures, but that appears to be a local-only runtime issue rather than a production code defect.

## 2. What Is Working

- Public homepage, services, packages, FAQ, and policy pages are server-rendered and structurally consistent with the current design system.
- Public booking flow is connected end to end through the booking form, live availability precheck, booking submission route, and thank-you redirect.
- Public availability flow is connected to admin-controlled blocked date data and returns month/date contracts with validation.
- Public contact flow is wired to `/api/contact` with client validation and backend validation.
- Customer booking recovery flow is implemented through `/find-booking`, `/api/bookings/find`, secure history links, and secure reply links.
- Booking history and booking reply pages are backed by signed tokens and server-side verification rather than public IDs alone.
- Admin login/logout/session handling is modularized and uses a signed session cookie plus CSRF token for write actions.
- Admin dashboard routes are guarded by shared auth helpers and most write flows require CSRF.
- Direct admin-to-customer email flow is guarded by admin auth and CSRF and no longer leaks detailed provider failure data to the client.
- `/api/chat` works correctly when the runtime is healthy. Verified on a clean local dev server: `GET /api/chat` returned `200`, and `POST /api/chat` returned the expected `{ reply, requestId }` envelope.
- Shared handler structure for `/api/auth`, `/api/data`, `/api/chat`, and `/api/payments` is coherent and materially improves maintainability.
- Security headers are configured globally in Next config.
- Current `npm run lint` passes.
- Current `npm run build` passes.

## 3. What Is Partially Working

- Public AI chat widget is connected, interactive, route-aware, and conversion-oriented, but the panel composition is not yet robust enough for real-world viewport variability.
- Chat launcher placement is improved and safe-area aware, but still depends on a delicate bottom offset relationship with the mobile sticky booking CTA.
- Chat panel uses a bounded flex column with an intended internal scroll region, but the amount of non-scroll content above and below the message list still compresses the readable response area too aggressively.
- Chat error handling is cleaner than before and now collapses into one current error state, but the panel can still feel vertically crowded when an error block, message CTA block, and composer all compete for space.
- Public forms generally work, but several client utilities surface backend `message` strings directly, so safe behavior still depends on each backend route keeping error text sanitized.
- Payments architecture exists and is guarded, but it is not yet a live end-to-end production payment workflow tied to booking lifecycle transitions.
- Request logging is consistent and useful, but persistence is optional and environment-dependent.

## 4. What Is Broken

- The public AI chat widget is not yet production-safe from a usability/layout standpoint. This is a confirmed UX defect, not just polish debt.
- The AI response area is not consistently prominent enough relative to the panel header, status card, optional error card, CTA card, and composer.
- The close button can still end up visually low in the viewport because it lives inside a panel whose non-scrolling content budget is still too large for the available mobile height.
- The local `localhost:3000` dev runtime is currently broken by stale/corrupted `.next` output, producing module-not-found errors such as `Cannot find module './5873.js'` and `Cannot find module './5611.js'` plus `_app` resolution failures. This is confirmed broken locally, but not confirmed as a production-code defect.

## 5. High-Risk Production Concerns

- Admin secret reuse risk remains present. Admin auth and customer-access token signing can still fall back to `ADMIN_API_KEY` or `ADMIN_PASSWORD` when dedicated customer token secrets are not configured.
- Some public client flows surface server `message` values directly. That is acceptable only while backend routes remain disciplined about sanitizing user-facing errors.
- In-memory rate limiting is process-local and therefore weak in horizontally scaled or serverless multi-instance environments.
- Chat provider fallback is operationally safe, but there is no explicit server-side timeout wrapper around the OpenAI fetch path. The frontend has a client timeout, but backend latency control is still soft.
- The admin dashboard is a very large client component and remains a coupling hotspot.
- `validateAdminPassword` performs direct string equality rather than timing-safe comparison. For this admin-password-only model, the practical risk is limited but not ideal.
- Payment webhook handling verifies the Stripe signature, but the downstream booking mutation workflow is not yet implemented, so production payment readiness is incomplete by design.
- The local runtime corruption demonstrates that the dev workflow can become misleading when `.next` artifacts go stale. That is not a production flaw by itself, but it can hide or fabricate issues during QA.

## 6. Chat Widget Deep Audit

### Current State

The chat widget is functionally wired and its backend path is healthy when the app runtime is healthy. The remaining problems are primarily in panel composition and viewport allocation, not in route integration.

### Root-cause analysis of current widget problems

#### Why AI response visibility is poor

The AI response is rendered correctly, but the visible reading area is too constrained by surrounding UI chrome.

Contributing causes:

- The panel includes several fixed-height regions: header, topic/status card, optional error card, composer, and sometimes a CTA card appended after the assistant message.
- The assistant message bubble uses the same visual weight class family as other dark panels, so it competes poorly against the surrounding glass/status/composer sections.
- The last assistant message can be followed immediately by a CTA card, which further pushes the actual conversational content upward and out of the most comfortable reading zone.
- On short mobile viewports, the resulting message-list height becomes too small even though it is technically scrollable.

Primary files involved:

- `src/components/chat/public-chat-panel.tsx`
- `src/components/chat/public-chat-message-list.tsx`
- `src/components/chat/public-chat-message-bubble.tsx`
- `src/components/chat/public-chat-cta-card.tsx`
- `src/app/globals.css`

#### Why internal scrolling is failing or incomplete

Internal scrolling is only partially solved.

What is correct now:

- The panel is a flex column.
- The message list is assigned the intended internal scroll area.
- The composer is kept in a non-scrolling region.

What is still wrong:

- The panel height budget is still over-consumed by non-message UI.
- The mobile bottom offset deliberately reserves space above the sticky booking CTA, which is correct, but it reduces usable panel height further.
- The message area therefore becomes technically scrollable but practically cramped.
- Because the panel opens above the launcher in a bottom-anchored stack, shorter screens push the visible top of the panel into a tighter slice of the viewport than desired.

This is not a pure overflow bug anymore. It is a layout-budget problem caused by component structure plus viewport math.

Primary files involved:

- `src/components/chat/public-chat-widget.tsx`
- `src/components/chat/public-chat-panel.tsx`
- `src/components/chat/public-chat-message-list.tsx`
- `src/app/globals.css`
- `src/components/layout/mobile-book-cta.tsx`

#### Why the exit/close button is obscured

The close button is not hidden by a z-index collision inside the chat itself. The more likely cause is that it sits in the panel header, and the overall panel top edge can end up too tight against the viewport because:

- the panel is bottom-positioned,
- the bottom offset is increased to clear the sticky booking CTA,
- the panel max-height still leaves limited room on short screens,
- the header is visually compressed by everything below it.

So the close button problem is primarily viewport math plus panel composition, not a missing z-index on the button itself.

#### Response rendering behavior

- Responses are correctly appended as assistant messages.
- Long responses wrap using `break-words` and `whitespace-pre-wrap`.
- The frontend removes the optimistic user message when send fails, restoring the composer text.
- The route contract is correct and the reply envelope is usable.

#### Error-state behavior

- Error handling is improved versus earlier revisions because the panel now shows one current error state instead of stacking multiple cards.
- However, the error block still consumes part of the scarce non-scrolling height budget, which hurts message readability on smaller screens.

#### Retry behavior

- Retry behavior is logically correct: it retries the last attempted message when a send error exists; otherwise it retries status fetch.
- UX-wise, retry is still coupled to the same cramped panel layout.

#### Route exclusions

The widget is correctly excluded from:

- `/admin`
- `/booking-reply`
- `/booking-history`
- `/booking`
- `/contact`
- `/availability`
- `/find-booking`

This is conservative and appropriate for avoiding interference with transactional flows.

#### Conversion usefulness

- The widget is useful as a lightweight pre-qualification surface.
- The recommended-action CTA mapping to real routes is sound.
- It is not yet strong enough, visually or spatially, to be considered fully conversion-optimized on smaller devices.

### Recommended next fix phase

Chat widget should be the next fix phase before further feature work.

Exact fix category:

- panel composition refactor,
- viewport-budget recalibration,
- stronger message-viewport prioritization,
- compacting or relocating non-message chrome,
- clearer assistant-response visual hierarchy.

This should be a targeted stabilization pass, not a broad rewrite.

## 7. Backend/API Audit

### `/api/chat`

- Current state: structurally healthy.
- GET contract: returns `{ enabled, provider, providerConfigured, bookingEnabled }`.
- POST contract: returns `{ reply, requestId }`.
- Validation: Zod schema present.
- Rate limiting: present.
- Logging: present.
- Error handling: acceptable, though server-side timeout control could be stronger for external provider mode.
- Production concern: frontend still depends on generic safe messages for 500-class failures.

### `/api/bookings`

- Current state: stable core transactional route.
- POST: validates input, checks live availability, creates booking, dispatches notifications, returns booking plus reply token.
- PATCH: admin-only, CSRF-protected, updates status and attempts customer notifications.
- GET: admin-only booking listing or by-date lookup.
- Production concern: public client surfaces backend `message` values, so backend response hygiene remains important.

### `/api/availability`

- Current state: stable.
- Supports month view, date check, and blocked-date list.
- Uses validated month/date query parameters.
- Production concern: blocked-date list is publicly accessible by query flag, which may be acceptable for this app, but should remain an intentional product decision.

### `/api/contact`

- Current state: stable.
- Public POST is validated and rate-limited.
- Admin GET is protected.

### `/api/bookings/find`

- Current state: stable and security-conscious.
- Supports secure recovery via email delivery or direct open when booking ID is provided.
- Good separation between booking-ID direct access and phone-based email-only recovery.

### `/api/bookings/reply`

- Current state: stable.
- Token-gated message thread load and send.
- Production concern: route safety depends on secure token secret configuration.

### Admin API routes

- Current state: mostly sound.
- Shared auth/session handlers reduce duplication.
- Write routes generally enforce CSRF.
- Direct email route is better hardened than before.

### Email/notification routes and flows

- Current state: operational but environment-dependent.
- Resend integration is real.
- Notification dispatch generally logs failures safely.
- Production concern: owner env setup remains critical for actual delivery outcomes.

### Payment routes

- Current state: additive scaffolding, not fully live business workflow.
- Intent route is guarded by config.
- Webhook route verifies signature.
- Production concern: should not be treated as fully integrated payments without lifecycle mutation and owner verification.

### Validator/service layering

- Current state: good overall.
- Shared handler/service layout is materially cleaner than a route-only design.

### Request logging

- Current state: good.
- Console logging always available.
- Optional Firestore persistence behind env flag.

### Error handling and contracts

- Current state: generally coherent.
- Some routes still return raw `error.message` in 500 responses, which is acceptable for internal/admin paths but not ideal where public clients surface those strings directly.

## 8. Admin/Public Boundary Audit

Current safety is acceptable overall.

Strengths:

- Admin session cookie is separate from public flows.
- CSRF is required for admin writes.
- Public chat widget is hidden from admin and transactional customer thread routes.
- Customer booking history and reply access use signed links rather than public direct IDs.

Risks:

- Admin auth still relies on a single shared secret value from env.
- Customer token signing can still fall back to admin secret material if dedicated customer token secrets are not set.
- The admin dashboard remains a large, highly coupled client surface, which raises maintenance and regression risk.

## 9. Deployment/Env Audit

### Manual owner verification required

- Verify production env values for Firebase Admin credentials.
- Verify `RESEND_API_KEY`, `BOOKING_NOTIFICATION_EMAIL_FROM`, and `BOOKING_REPLY_TO` in production.
- Verify whether chat should run in `rules` mode or OpenAI mode.
- If OpenAI mode is desired, verify `CHAT_PROVIDER`, `OPENAI_API_KEY`, and optional `OPENAI_MODEL`.
- Verify dedicated customer token secret configuration using `CUSTOMER_ACCESS_TOKEN_SECRET` or `BOOKING_REPLY_SECRET`.
- Verify Stripe env only if payment work is being activated.

### Dev/runtime assessment

- Current local `.next` corruption was confirmed as a dev-runtime issue, not a source-code defect.
- Clean dev boot on an alternate port served `/api/chat` correctly.
- Production build is currently healthy.

## 10. Recommended Fix Order

### Phase 1 critical fixes

- Fix chat widget panel composition and viewport allocation.
- Prioritize assistant message visibility over non-essential panel chrome.
- Reduce or reorganize the topic/status/error/CTA stack so the message viewport is larger.
- Ensure close button remains comfortably reachable and visible on short mobile screens.
- Confirm sticky CTA and chat coexistence in real mobile browser testing.

### Phase 2 stabilization

- Configure dedicated customer-access token secret if not already set.
- Review public 500-response messages on routes whose client forms display backend text directly.
- Add stronger server-side timeout/abort behavior for external chat provider fetches.
- Consider production-grade shared/distributed rate limiting if scaling beyond a single process.

### Phase 3 optional improvements

- Break the admin dashboard into smaller feature shells.
- Improve chat message presentation and intent-specific response modules.
- Complete payment workflow integration only when business readiness exists.

## 11. Owner Action List

- Verify production env variables for Firebase Admin, Resend, and any desired OpenAI mode.
- Verify dedicated customer token secret configuration.
- Manually browser-test the chat widget on real mobile devices and mobile browser chrome states.
- Decide whether payments remain disabled scaffolding or move into an actual live phase.

## 12. Final Verdict

Can this safely stay live as-is?

- Yes, with caution. The core booking/admin platform appears safe enough to remain live.
- No, if the expectation is that the public AI chat widget is already fully production-grade UX. It is not there yet.

What should be fixed before the next major upgrade?

- The chat widget should be fixed next before new feature work.
- The highest-value work is a focused widget stabilization pass, not another platform expansion.
- After that, tighten token-secret separation and audit any remaining public-facing raw error exposure.