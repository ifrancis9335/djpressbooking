# PressBookings.com Upgrade Plan and Security Audit

## 1. Audit Summary

### Existing features audited

- Public booking flow
- Availability flow
- Contact flow
- Admin dashboard
- Admin auth and protected routes
- CSRF protection
- Email and notification flows
- Booking status update flows
- Current environment variable usage
- Existing API routes and server actions
- Data persistence pattern
- Payment-related code and gaps
- Frontend request patterns touching sensitive operations

### Files and areas reviewed

- `src/app/...`
- `src/components/...`
- `src/lib/...`
- `src/app/api/...`
- Admin auth helpers and protected route patterns
- Booking services and Firestore transaction code
- Admin routes and direct email route
- Email and notification senders
- Availability routes and Firestore-backed availability helpers
- Security-related helpers and config

### Security audit observations

- Existing admin protection was already stronger than a basic single-password setup because it uses signed session cookies plus CSRF validation on state-changing admin actions.
- Existing public booking and contact routes already validate payloads with Zod schemas.
- Sensitive server secrets remain server-side; no client-side exposure was introduced by this refactor.
- Admin UI fetch patterns already send CSRF headers for privileged writes.
- Payment flows were not previously live, so a guarded architecture was safer than wiring incomplete client-driven payment behavior.
- One operational security risk remains outside the code change itself: local environment secrets appear to be real and should be rotated before production use if they have been exposed outside the machine or repository boundary.

## 2. What Was Preserved

- Existing admin access flow preserved
- Existing admin session cookie flow preserved
- Existing CSRF protection model preserved
- Existing booking submission flow preserved
- Existing availability endpoint preserved
- Existing contact submission flow preserved
- Existing booking lookup and private reply flow preserved
- Existing admin booking thread flow preserved
- Existing direct email flow preserved
- Existing booking status update flow preserved
- Existing email notification orchestration preserved
- Existing Firestore transaction behavior for booking creation preserved
- Existing UI layout and page structure preserved

## 3. What Was Upgraded

### Chat module

- Route(s) added or hardened:
  - Added `GET /api/chat`
  - Added `POST /api/chat`
  - Preserved existing private booking thread routes by extracting shared chat-thread handlers instead of replacing live behavior
- Validation added:
  - Added structured request validation for public chat input, prior conversation turns, lead fields, and optional context
- Rate limiting and logging added:
  - Added public chat rate limiting
  - Added request logging hooks for chat requests
  - Added optional Firestore chat lead persistence
- Timeout and error handling added:
  - Added guarded provider fallback from OpenAI to rules-based responses
  - Added safe JSON validation failure responses
- Intent detection added:
  - Added booking, availability, pricing, package, support, greeting, and unknown intent detection
- AI env vars required:
  - `CHAT_ENABLED`
  - `CHAT_PROVIDER`
  - `OPENAI_API_KEY` when live AI is enabled
  - `OPENAI_MODEL` optional

### Auth module

- Existing auth audited:
  - Reviewed `src/lib/admin-auth.ts`, admin login/logout routes, signed session structure, and CSRF verification flow
- Current auth preserved:
  - Existing admin login route and logout route still function at the same paths
- Route guards hardened:
  - Consolidated auth handling through `src/lib/auth/handlers.ts` and `src/lib/auth/admin.ts`
  - Added a clean session-state endpoint at `/api/auth/session`
- Cookie and session handling reviewed:
  - Existing signed cookie model retained
  - Session and CSRF cookie names preserved
- CSRF and admin protections verified or improved:
  - Existing CSRF checks preserved for state-changing admin routes
  - Centralized auth entry points reduce drift across future routes
- Future expansion structure added:
  - Added auth domain structure that can support future customer and DJ auth without fake UI or placeholder login screens

### Data module

- Booking, availability, and history architecture improved:
  - Added `src/lib/data/` domain wrappers and route handlers for bookings, availability, contacts, and request logging
- Validation and sanitization added:
  - Continued using existing booking/contact/date validation
  - Centralized shared request parsing and response patterns
- Repository and service structure added:
  - Added additive service wrappers over existing booking, contact, and availability logic rather than replacing core implementations
- Sensitive actions server-validated:
  - Booking status updates remain server-validated
  - Admin-only reads remain server-protected
  - Availability, contact, and booking handlers stay server-side
- Existing public and admin data flows preserved:
  - Existing `/api/bookings`, `/api/availability`, and `/api/contact` routes were rewired to shared handlers without changing their contracts

### Payments module

- Payment architecture added:
  - Added `src/lib/payments/` for configuration, request validation, Stripe adapter, and route handlers
- Webhook structure added:
  - Added `/api/payments/webhook`
- Signature verification design added:
  - Added Stripe-style webhook signature verification with timestamp tolerance and HMAC verification
- Feature flags used:
  - Payments remain guarded behind `PAYMENTS_ENABLED` and provider configuration checks
- Current live flow impact:
  - No live booking flow was changed to require payments
  - Payment routes fail closed when disabled or misconfigured

### Frontend hardening

- Client request patterns reviewed:
  - Public booking, contact, availability, and reply flows still call public routes only
  - Admin UI continues using CSRF headers for privileged writes
- Secret exposure risks checked:
  - No new client-side secret usage was introduced
  - New chat and payment providers are server-side only
- Admin and public boundary reviewed:
  - Existing admin-only boundaries remain on server routes rather than trusting client state
- Unsafe trust assumptions removed:
  - New payment intent creation requires server-side booking existence checks
  - Chat replies are generated server-side only
- Error handling improved:
  - Shared response handling now standardizes more route behavior and limits provider leakage
- Input rendering and XSS safeguards reviewed:
  - No new dangerous HTML rendering was introduced
  - Existing UI continues to render standard strings rather than arbitrary HTML from new modules

### Backend hardening

- Validation helpers added:
  - Added shared request body parsing helper and chat/payment validators
- Auth helpers added:
  - Added modular auth handler layer and session inspection endpoint
- Safe logging and redaction added:
  - Added structured request logging hooks
  - Sensitive provider secrets remain outside logs
- Error mapping standardized:
  - New handlers consistently return explicit validation, auth, and configuration failures
- Rate limiting and body controls added:
  - Added chat rate limiting and preserved existing booking/contact/admin-login rate limiting
- Env access hardened:
  - New provider integrations are feature-flagged and fail closed when env vars are missing
- Privileged routes revalidated server-side:
  - Admin-only actions still require signed-session auth and CSRF validation on writes

## Chat Frontend Integration

### What was added

- Added a production-safe public chat widget frontend connected to the existing `/api/chat` backend
- Added modular chat UI pieces for launcher, panel, message list, message bubble, composer, and booking-aware CTA rendering
- Added a typed client API wrapper with timeout and safe error handling for chat requests

### Where it was added

- `src/components/chat/public-chat-widget.tsx`
- `src/components/chat/public-chat-launcher.tsx`
- `src/components/chat/public-chat-panel.tsx`
- `src/components/chat/public-chat-message-list.tsx`
- `src/components/chat/public-chat-message-bubble.tsx`
- `src/components/chat/public-chat-composer.tsx`
- `src/components/chat/public-chat-cta-card.tsx`
- `src/utils/chat-api.ts`

### Routes and pages touched

- Connected the widget to existing `GET /api/chat` and `POST /api/chat`
- Added the widget to the shared public layout in `src/app/layout.tsx`
- Added minimal global styling support in `src/app/globals.css`

### How the widget behaves

- Displays as a floating public assistant on marketing pages
- Hidden on admin routes and core transactional pages like booking, contact, availability, booking history, and private booking reply flows to avoid interrupting existing journeys
- Supports empty, loading, success, recoverable error, and retry states
- Sends real visitor messages to `/api/chat`
- Renders assistant replies and safely maps backend `recommendedAction` values to real site routes like `/booking`, `/packages`, `/availability`, and `/contact`
- Uses only client-safe data and keeps all provider logic on the backend

### What still remains optional for future phases

- Persisting conversation history across page reloads
- Collecting visitor lead details inside the widget before or after a conversation
- Adding richer intent-specific UI blocks or package recommendation cards
- Displaying agent availability or escalation status tied to live CRM workflows

## 4. Environment Variables

### Existing env vars reused

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`
- `ADMIN_API_KEY` or `ADMIN_PASSWORD`
- `RESEND_API_KEY`
- `BOOKING_NOTIFICATION_EMAIL_FROM`
- `BOOKING_NOTIFICATION_EMAIL_TO`
- `BOOKING_REPLY_TO`
- `DATABASE_URL`

### New env vars required

- `CHAT_ENABLED`
- `CHAT_PROVIDER`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `REQUEST_LOG_PERSISTENCE`
- `PAYMENTS_ENABLED`
- `PAYMENT_PROVIDER`
- `PAYMENT_CURRENCY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Notes

- Required immediately for current working flows:
  - Existing Firebase, admin auth, and email variables remain required
- Optional until AI goes live:
  - `CHAT_PROVIDER`
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL`
- Optional until payments go live:
  - `PAYMENTS_ENABLED`
  - `PAYMENT_PROVIDER`
  - `PAYMENT_CURRENCY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- Optional for extra observability:
  - `REQUEST_LOG_PERSISTENCE`

## 5. Manual Steps Required From Owner

- Add a real AI provider key to `.env.local` only if live AI chat should be enabled
- Add payment provider keys only if deposits or subscriptions are going live now
- Configure the webhook URL in the Stripe dashboard if payments are enabled
- Add a production origin and deployment validation pass in the real environment
- Verify the email sender domain and Resend production configuration
- Deploy and run live verification
- Rotate any previously exposed secrets before production release
- Separate admin secrets so `ADMIN_API_KEY` and `ADMIN_PASSWORD` are not reused as the same value in production
- Rotate Firebase admin credentials, admin auth secret, database credentials, and email provider credentials if they were ever committed, shared externally, or exposed through logs/screenshots
- Decide whether request logs and chat leads should be stored in Firestore long-term

## 6. Test Checklist

### Public-side tests

- Booking form submits successfully
- Availability displays correctly
- Contact flow still works
- AI chat responds correctly when enabled
- AI chat fails safely when disabled or unconfigured
- No broken routes or pages
- User-safe errors display properly
- Private booking reply flow still loads and posts messages correctly

### Admin-side tests

- Admin login still works
- Protected routes still enforce access
- Admin can review and update bookings
- Admin booking thread still loads and sends messages
- Direct email actions still work
- Sensitive actions require true server-side auth and CSRF
- Data changes persist correctly
- Logout still clears session state

### Security tests

- Unauthorized requests are rejected correctly
- Invalid payloads fail safely
- Secrets are not exposed to client bundles or API responses
- Rate limiting triggers correctly for booking, contact, chat, and admin login routes
- Error responses do not leak provider secrets or stack traces
- Payment status cannot be forged from the client
- Webhook signature validation fails closed on invalid signatures
- Admin-only writes fail without CSRF token

### Payment tests

- Payment route is guarded if not configured
- Payment initialization works when enabled and correctly configured
- Webhook route validates correctly
- Payment intent creation fails if booking ID is invalid
- Webhook processing does not mutate booking state unexpectedly

## 7. Risk Notes

- Current rate limiting is still process-local memory and is not distributed across multiple instances.
- Payment webhook verification is in place, but automatic booking-state mutation is intentionally not enabled yet.
- The public chat endpoint exists server-side, but no new frontend UI was added for it in this phase.
- Optional Firestore request-log persistence increases write volume and should be monitored.
- If any existing env secrets were previously committed or exposed outside the local machine, they should be considered compromised and rotated.
- Reusing the same secret value for multiple admin credentials increases blast radius if that secret is leaked.

## 8. Recommended Next Manual Phase

- Connect a live AI provider and define answer-quality and escalation policy
- Turn on live payments only after Stripe credentials, webhook, and business rules are finalized
- Add customer and DJ account UI only after backend auth roles and authorization policy are finalized
- Add CRM-style dashboards and history insights on top of the new data module
- Add production monitoring, alerting, and distributed rate limiting

## 9. Final Audit Output

### Completed

- Audited current public, admin, email, auth, availability, booking, and notification flows
- Added modular `/api/chat`, `/api/auth`, `/api/data`, and `/api/payments` backend architecture
- Preserved existing route behavior by extracting shared handlers instead of rewriting live flows
- Added guarded payment architecture and webhook verification
- Added structured request logging and chat lead capture support
- Verified the refactor with `npm run lint` and `npm run build`

### Preserved

- Existing admin access flow
- Existing booking submission flow
- Existing availability endpoint
- Existing direct email flow
- Existing booking reply flow
- Existing notification flow
- Existing UI layout

### Security hardening completed

- Centralized auth handler structure added
- Existing signed-session and CSRF protections preserved and reused
- Public chat rate limiting added
- Structured validation added for new chat and payment routes
- Payment webhook signature verification added
- Server-side booking existence validation added for payment intent creation
- Feature-flagged env-driven provider access added
- Shared request logging hooks added
- Existing admin and public route boundaries kept server-enforced

### Warnings

- Distributed rate limiting is still not implemented
- Payments are scaffolded for production use but not fully integrated into booking state transitions
- Public chat backend exists but is not yet wired into a visible frontend chat widget
- Secret rotation may be required depending on prior exposure history

### What you need to do next

1. Rotate and separate production secrets before release if there is any chance the current values were exposed.
2. Decide whether to enable AI chat and, if so, add the provider credentials.
3. Decide whether to enable payments and, if so, add Stripe credentials and configure the webhook.
4. Run the full public, admin, security, and payment verification checklist in a staging or production-like environment.
5. Add monitoring and distributed controls before scaling beyond a single-instance deployment.

## Regression Audit Results

### Passed

- Public booking submission contract remains aligned with the existing client in `useBookingSubmission`: `POST /api/bookings` still returns `booking.id` and optional `replyToken`
- Public availability loading contract remains aligned with the existing calendar and booking hooks: `GET /api/availability` and `GET /api/data/availability` both returned valid data in local smoke checks
- Public contact form submission contract remains aligned with `ContactForm`: `POST /api/contact` still accepts the same JSON body and validation path
- Customer reply-token flow remains intact across `booking-reply`, thank-you, booking history, and customer access helpers
- Package and pricing consumers remain aligned: `GET /api/packages` and `GET /api/public/settings` returned expected package/site payloads in smoke checks
- New route verification passed for non-destructive checks:
  - `GET /api/chat`
  - `POST /api/chat`
  - `GET /api/auth/session`
  - `GET /api/data/availability`
  - `GET /api/payments/intent`
  - guarded `POST /api/payments/intent`
- Unauthorized access checks passed for admin and protected data routes during local smoke verification
- Existing admin fetch paths continue to use CSRF headers for privileged writes in the current client code

### Failed and Fixed

- Fixed a concrete direct-email security issue: the admin direct-email route previously returned upstream provider failure detail to the client on send failure. It now returns generic user-safe error messages while keeping detailed diagnostics server-side.
- Fixed secret-hygiene coupling in code: customer-facing reply and history tokens can now use a dedicated `CUSTOMER_ACCESS_TOKEN_SECRET` or `BOOKING_REPLY_SECRET` instead of relying only on admin auth secrets, while preserving the old fallback behavior.

### Warnings

- Admin dashboard, settings, export, notifications, and similar authenticated flows were verified through route-guard behavior and code-path review, but not through a full authenticated browser session in this pass.
- `x-admin-key` support still exists server-side as a compatibility path. No client code appears to use it, but it remains a privileged bypass mechanism if that secret is distributed carelessly.
- Current rate limiting is still in-memory and single-process only.
- Public chat is verified server-side, but not yet integrated into a visible frontend widget.

### Security Findings

- Admin-sensitive client writes consistently use `X-CSRF-Token` headers in the current admin UI request paths.
- No client code in the audited request paths appears to embed server secrets or provider keys.
- `dangerouslySetInnerHTML` usage found in the layout is limited to JSON-LD serialization from server-computed structured data, not arbitrary user HTML.
- Reply-token and customer-access flows are server-signed and server-verified; the client only transports the token.
- Payment intent creation is not trusted from frontend state alone; the server requires a real booking lookup.
- Payment webhook handling verifies signature and timestamp before accepting the event.
- Secret reuse remains an operational risk if owner configuration keeps admin auth and customer-access token signing on the same value.

### Required Owner Actions Before Production

- Set a dedicated `CUSTOMER_ACCESS_TOKEN_SECRET` or `BOOKING_REPLY_SECRET` so customer-facing token signing is no longer tied to admin auth credentials.
- Rotate any exposed Firebase, admin auth, database, and email-provider credentials before production if there is any chance the current values were shared or committed.
- Stop reusing the same value for `ADMIN_API_KEY` and `ADMIN_PASSWORD` in production.
- Add AI and Stripe provider secrets only if those modules are being enabled for real traffic.
- Confirm whether request logs and chat leads should be persisted in Firestore.

### Manual Browser and E2E Tests Still Required

- Full admin login/logout browser verification with a real authenticated session
- Protected dashboard loading after login
- Admin booking thread read/send flow
- Direct email send success and error UX with a real mail provider response
- Availability block and unblock from the admin dashboard
- Admin export download behavior
- Settings save flow from the admin dashboard
- Notifications polling and server-sent events behavior in the live UI
- End-to-end public booking, thank-you, booking-history, and booking-reply journey in browser