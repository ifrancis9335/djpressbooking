# Admin Direct Email — Go-Live Checklist

Route: `POST /api/admin/bookings/[bookingId]/direct-email`  
Component: `src/components/admin/dashboard/AdminDirectEmailComposer.tsx`

**Code: complete. Domain: verified. Remaining: env config + live send test.**

---

## 1. Required Env Vars

| Variable | Required | Value |
|---|---|---|
| `RESEND_API_KEY` | Yes | Resend secret key (`re_...`) — never expose publicly |
| `BOOKING_NOTIFICATION_EMAIL_FROM` | Yes | `DJ Press Booking <booking@djpressbooking.com>` |

- [ ] `.env.local` — both variables present and non-empty
- [ ] `BOOKING_NOTIFICATION_EMAIL_FROM=DJ Press Booking <booking@djpressbooking.com>`
- [ ] `RESEND_API_KEY` not in any `NEXT_PUBLIC_*` variable or client component

---

## 2. Resend Domain

- [x] `djpressbooking.com` sending domain verified in Resend

---

## 3. Local Send Test

With `npm run dev` running:

```powershell
$KEY = 'YOUR_ADMIN_API_KEY'
$body = '{"to":"your@email.com","subject":"DJ Press Test","message":"Hello."}'
curl.exe -X POST `
  -H "x-admin-key: $KEY" `
  -H "Content-Type: application/json" `
  -H "X-CSRF-Token: test" `
  -d $body `
  http://localhost:3000/api/admin/bookings/TEST123/direct-email
```

- [ ] Response: `{"ok":true,"message":"Email sent successfully.","id":"re_..."}`
- [ ] Recipient inbox receives the email
- [ ] Resend dashboard → Events shows matching ID

---

## 4. Admin UI Send Test

1. Log in to `/admin` → Bookings → open any booking
2. In the **Send Email** composer: fill To, Subject, Message → click **Send Email**

- [ ] Success banner: `"Email sent successfully. (ID: re_...)"`
- [ ] Body textarea cleared after success
- [ ] Recipient receives the email

---

## 5. Negative Validation (spot-check)

| Test | Input | Expected |
|---|---|---|
| Invalid recipient | `to: "not-an-email"` | 400 — `"Invalid recipient email address."` |
| No auth | no session, no `x-admin-key` | 401 — `"Unauthorized"` |
| Missing `RESEND_API_KEY` | remove from env + restart | 500 — `"...RESEND_API_KEY is not set."` |

---

## 6. Final Go-Live Steps

Complete these in order:

- [ ] Set `BOOKING_NOTIFICATION_EMAIL_FROM=DJ Press Booking <booking@djpressbooking.com>` in Vercel → Settings → Environment Variables → Production
- [ ] Confirm `RESEND_API_KEY` is set in Vercel → Production
- [ ] Redeploy on Vercel (env changes require a redeploy)
- [ ] Run one test send through the production admin UI
- [ ] Confirm delivery in Resend dashboard and recipient inbox

**When all boxes are checked: feature is live.**
