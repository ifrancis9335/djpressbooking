# Project Admin Audit

Date: 2026-04-21
Project: djpressbooking.com
Scope: admin panel wiring, UX stability, chat monitor responsiveness, booking lifecycle controls

## Summary
- Admin dashboard is functional and authenticated.
- Scroll-jump root causes were present in notification-to-booking focus and booking thread auto-scroll behavior.
- Chat monitor had unnecessary re-render/polling churn and dead-end actions.
- Booking lifecycle had no delete/restore model before this pass; soft delete and restore are now wired through admin-protected PATCH actions.

## Section-by-Section Audit

| Admin Section | Route/Component | Status | Data Source | Actions Available | Missing Actions | Backend Support Needed |
|---|---|---|---|---|---|---|
| Dashboard summary cards | src/components/admin/dashboard/DashboardSummaryCards.tsx | working | GET /api/admin/dashboard | navigate to bookings inbox anchor | card-level deep filters | optional: query-driven deep link filters |
| Chat Monitor | src/components/admin/dashboard/AdminChatMonitor.tsx | partial | GET /api/admin/chat-sessions | auto-refresh toggle, refresh now, ready-session jump to inbox | session detail drilldown, priority persistence | add chat-session priority field + API if needed |
| Notifications | src/components/admin/dashboard/AdminNotificationsPanel.tsx, src/components/admin/dashboard/useAdminNotifications.ts | working | GET/PATCH /api/admin/notifications, SSE /api/admin/notifications/stream | mark read, quick confirm, open booking focus | advanced filters, per-type controls | optional only |
| Bookings Inbox | src/components/admin/dashboard/AdminBookingsManager.tsx | working | GET/PATCH /api/bookings | pending/confirmed/deleted filters, status changes, refresh | bulk actions/export | optional only |
| Blocked Dates | src/components/admin/dashboard/BlockedDatesManager.tsx | working | GET /api/availability?list=blocked, POST /api/admin/availability/block, POST /api/admin/availability/unblock | add/remove/toggle blocked dates, calendar controls | bulk block ranges | optional only |
| Booking Settings | src/components/admin/dashboard/BookingSettingsManager.tsx | working | PATCH /api/admin/settings | enable/disable booking, update notice | version history | optional only |
| Site Settings | src/components/admin/dashboard/SiteSettingsManager.tsx | working | PATCH /api/admin/settings | update CTA/support/service-area copy | version history | optional only |
| Content Controls | src/components/admin/dashboard/*Content*/Branding managers | working | GET/PATCH /api/admin/content, PATCH /api/admin/shared-content | section visibility, hero/content edits, dynamic CRUD/reorder, image updates | drafts/versioning | optional only |
| Shared Content | src/components/admin/dashboard/SharedContentManager.tsx | working | PATCH /api/admin/shared-content | synchronized homepage/contact/site shared copy update | staged preview | optional only |
| Contact Info | src/components/admin/dashboard/ContactSettingsManager.tsx | working | PATCH /api/admin/settings | phone/tel/email/service area updates | validation preview | optional only |
| Package Pricing | src/components/admin/dashboard/PackagePricingManager.tsx | working | PATCH /api/admin/settings | basic/premium/vip labels/prices/cta updates | change history | optional only |
| Booking detail/status actions | src/components/admin/dashboard/AdminBookingsManager.tsx, src/components/admin/dashboard/AdminBookingThread.tsx | working | PATCH /api/bookings, admin booking messages API | mark reviewed/confirmed/declined, thread messages, direct email | message-level moderation | optional only |
| Soft delete/archive/restore | src/components/admin/dashboard/AdminBookingsManager.tsx, src/lib/data/handlers.ts, src/lib/bookings.ts | working | PATCH /api/bookings with action delete/restore | soft delete, deleted filter, restore, deleted metadata badge | deletedBy actor identity granularity | optional: authenticated actor id wiring |
| Live refresh/polling behavior | activity/chat/thread components | partial | periodic fetch + SSE | periodic updates and manual refreshes | smarter adaptive polling | optional only |
| Scroll side effects | admin dashboard/bookings/thread | working (fixed) | UI effects only | highlight without forced viewport movement | none identified after fix | none |

## Root Causes Identified
1. Forced scroll in notification focus callback moved viewport to bookings section.
2. Booking thread used scrollIntoView on frequent updates, which can bubble scroll to viewport.
3. Chat monitor polling effect depended on sessions state, causing avoidable interval resets and extra churn.
4. Chat monitor contained dead-end action controls not connected to backend.

## Applied Fix Set
- Removed temporary red debug border from chat panel.
- Removed forced admin scrollIntoView on notification focus.
- Replaced booking thread scrollIntoView behavior with internal container scroll management.
- Refined chat monitor polling and fetch behavior for smoother updates.
- Removed dead-end chat monitor priority action and routed ready-session view to existing admin inbox anchor.
- Added soft delete lifecycle fields and behavior:
  - isDeleted
  - deletedAt
  - deletedBy
- Added admin-protected booking soft delete/restore actions through existing PATCH /api/bookings route.
- Added deleted-aware booking retrieval option (includeDeleted=true) for admin inbox.
- Added deleted filter and restore controls in admin booking UI.

## Notes On Safety
- Public booking submission, contact, availability APIs, direct email flow, and admin auth contract remain intact.
- Existing status update contract on PATCH /api/bookings remains supported.
- Default booking listings continue to exclude deleted entries unless includeDeleted=true is explicitly requested.

## Remaining Gaps
- No dedicated booking detail route outside dashboard card context.
- Chat session priority is still not persisted (button removed instead of fake wiring).
- No bulk booking lifecycle operations.
- No automated UI test currently verifying no-scroll-jump behavior during polling.

## Recommended Next Phase
1. Add admin booking detail route with query-driven deep links from notifications and summary cards.
2. Add focused tests for delete/restore/filter behavior and polling stability.
3. Add optional chat session priority model and API if operations team needs triage labels.
4. Add audit metadata for actor identity beyond generic admin in delete/restore actions.
