# BOOKING_CHAT_UI_REPORT

## UI Upgrades Added

### Admin booking thread (Messenger-style)
- File: `src/components/admin/dashboard/AdminBookingThread.tsx`
- Added chat bubble layout:
  - Admin messages right-aligned (blue bubble)
  - Customer messages left-aligned (green bubble)
  - System messages neutral bubble
- Added unread indicators at message level (`Read` / `Unread` labels)
- Added latest message preview in thread header
- Added auto-scroll to newest message using bottom anchor ref
- Added fixed composer behavior at bottom of thread panel using sticky footer
- Preserved existing send action and CSRF-protected admin POST behavior

### Customer booking reply page (Messenger-style)
- New file: `src/components/forms/booking-reply-chat.tsx`
- Updated page file: `src/app/booking-reply/page.tsx`
- Replaced static message history + separate form with integrated chat UI:
  - Clear admin vs customer bubble styling
  - Auto-scroll to newest message
  - Sticky input composer at bottom
  - Inline status/error messaging after send
- Preserved secure token-based access and message history preload

### Customer thread read endpoint for live refresh
- Updated file: `src/app/api/bookings/reply/route.ts`
- Added `GET /api/bookings/reply?token=...` to return token-verified booking thread messages
- Kept existing `POST /api/bookings/reply` reply behavior unchanged

## Real-Time Behavior

### Admin thread updates
- Implemented safe polling in admin thread UI every 4 seconds
- Polling uses existing admin-auth-protected route:
  - `GET /api/admin/bookings/[bookingId]/messages`
- Live sync indicator added in header (`Live updates every 4s` / `Live sync...`)

### Customer reply page updates
- Implemented safe polling in customer chat UI every 5 seconds
- Polling uses secure token endpoint:
  - `GET /api/bookings/reply?token=...`
- Refreshes thread without exposing cross-booking data

## Preserved Security Model
- Per-booking message model unchanged:
  - `bookings/{bookingId}/messages/{messageId}`
- No customer-to-customer chat introduced
- Thread scope remains booking-specific only (admin <-> that booking's customer)
- Admin message actions remain behind existing admin auth + CSRF protections
- Customer side remains secure-token based using existing `verifyBookingReplyToken(...)`
- Existing booking inbox, notifications, and thread data structure preserved

## Test Results
- `npm run lint`: pass
- `npx tsc --noEmit`: pass
- `npm run build`: pass

Notes:
- Build cache was cleared (`.next` removed) before final validation to avoid known intermittent Next.js missing-chunk runtime issue in this workspace.
