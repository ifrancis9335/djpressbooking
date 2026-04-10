# POSTGRES_SETUP

## Overview
This project now uses Postgres as the single live source of truth for blocked availability dates.

Blocked dates are stored in the `blocked_dates` table and used by:
- Admin controls for block/unblock actions
- Public availability checks in booking and calendar flows

## Required Environment Variables
Add these to your environment configuration (for local and production):

```dotenv
DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DB_NAME
POSTGRES_SSL=false
```

Notes:
- Set `POSTGRES_SSL=true` for managed Postgres providers that require TLS.
- Keep `ADMIN_API_KEY` set for admin auth/session.

## SQL Schema
Run this SQL once against your Postgres database:

```sql
CREATE TABLE IF NOT EXISTS blocked_dates (
  id BIGSERIAL PRIMARY KEY,
  event_date DATE NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'blocked' CHECK (status IN ('blocked', 'available')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_dates_status_event_date
  ON blocked_dates (status, event_date);

CREATE OR REPLACE FUNCTION set_blocked_dates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blocked_dates_updated_at ON blocked_dates;
CREATE TRIGGER trg_blocked_dates_updated_at
BEFORE UPDATE ON blocked_dates
FOR EACH ROW
EXECUTE FUNCTION set_blocked_dates_updated_at();
```

## Local Run Steps
1. Start your Postgres instance.
2. Set `DATABASE_URL` and optional `POSTGRES_SSL` in `.env.local`.
3. Run schema SQL above.
4. Start app:

```bash
npm run dev
```

## Production Setup Steps
1. Provision Postgres (Neon, Supabase, RDS, Railway, etc.).
2. Run schema SQL on production database.
3. Set production environment variables:
   - `DATABASE_URL`
   - `POSTGRES_SSL` as needed
   - `ADMIN_API_KEY`
4. Deploy and verify:
   - `GET /api/availability?list=blocked`
   - admin block/unblock actions on `/admin`
   - booking date checks from public form/calendar

## API Contract Summary
- `GET /api/availability?date=YYYY-MM-DD`
  - returns `{ available, status, source: "postgres" }`
- `GET /api/availability?list=blocked`
  - returns blocked dates sorted ascending
- `POST /api/admin/availability/block`
  - protected admin mutation
  - body: `{ date, note? }`
- `POST /api/admin/availability/unblock`
  - protected admin mutation
  - body: `{ date }`

## Final Summary Notes
- File-based blocked date writes are removed from production logic.
- Postgres-backed availability is now the single live blocked-date source.
- Admin and public availability paths are aligned to the same backend data.
