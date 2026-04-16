# BOOKING_THREAD_REPORT

## Schema
- Firestore subcollection per booking:
  - `bookings/{bookingId}/messages/{messageId}`
- Message fields:
  - `senderType` (`admin`, `customer`, `system`)
  - `body`
  - `timestamp`
  - `read`

## Routes Added
- `GET /api/admin/bookings/[bookingId]/messages`
- `POST /api/admin/bookings/[bookingId]/messages`
- `POST /api/bookings/reply`
- `GET /booking-reply?token=...`

## Admin UI Added
- Booking card thread history
- Compose textarea
- Send message button
- Read/unread state per thread item

## Reply Flow
- Admin message stores under the booking message subcollection
- Admin message emails the customer using the existing email infrastructure
- Email includes a signed secure reply link
- Customer reply form validates the signed token and stores the reply under the correct booking
- Customer replies can notify the business inbox using the existing email infrastructure

## Test Results
- npm run lint: pass
- npx tsc --noEmit: pass
- npm run build: pass