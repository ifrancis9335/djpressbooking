import "server-only";
import { logAdminDebug, logAdminDebugError } from "./admin-debug";
import { getDb } from "./db";

export type BlockedDateStatus = "blocked" | "available";

export interface BlockedDateRow {
  id: number;
  eventDate: string;
  status: BlockedDateStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapBlockedDateRow(row: {
  id: number;
  event_date: string | Date;
  status: BlockedDateStatus;
  note: string | null;
  created_at: string | Date;
  updated_at: string | Date;
}): BlockedDateRow {
  const eventDateValue = row.event_date;
  const eventDate =
    typeof eventDateValue === "string"
      ? eventDateValue.slice(0, 10)
      : `${eventDateValue.getFullYear()}-${String(eventDateValue.getMonth() + 1).padStart(2, "0")}-${String(eventDateValue.getDate()).padStart(2, "0")}`;

  return {
    id: row.id,
    eventDate,
    status: row.status,
    note: row.note,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

export async function getBlockedDateByEventDate(date: string): Promise<BlockedDateRow | null> {
  const db = getDb();
  const result = await db.query<{
    id: number;
    event_date: string;
    status: BlockedDateStatus;
    note: string | null;
    created_at: string | Date;
    updated_at: string | Date;
  }>(
    `
      SELECT id, event_date, status, note, created_at, updated_at
      FROM blocked_dates
      WHERE event_date = $1
      LIMIT 1
    `,
    [date]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapBlockedDateRow(result.rows[0]);
}

export async function listBlockedDates(): Promise<BlockedDateRow[]> {
  try {
    const db = getDb();
    const result = await db.query<{
      id: number;
      event_date: string;
      status: BlockedDateStatus;
      note: string | null;
      created_at: string | Date;
      updated_at: string | Date;
    }>(
      `
        SELECT id, event_date, status, note, created_at, updated_at
        FROM blocked_dates
        WHERE status = 'blocked'
        ORDER BY event_date ASC
      `
    );

    logAdminDebug("blocked_dates_list_success", { count: result.rowCount ?? result.rows.length });
    return result.rows.map(mapBlockedDateRow);
  } catch (error) {
    logAdminDebugError("blocked_dates_list_error", error);
    throw error;
  }
}

export async function listBlockedDatesForMonth(monthIso: string): Promise<BlockedDateRow[]> {
  const db = getDb();
  const [yearRaw, monthRaw] = monthIso.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error("Invalid month format. Use YYYY-MM.");
  }

  const start = `${yearRaw}-${monthRaw.padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const end = `${yearRaw}-${monthRaw.padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const result = await db.query<{
    id: number;
    event_date: string;
    status: BlockedDateStatus;
    note: string | null;
    created_at: string | Date;
    updated_at: string | Date;
  }>(
    `
      SELECT id, event_date, status, note, created_at, updated_at
      FROM blocked_dates
      WHERE status = 'blocked'
      AND event_date >= $1
      AND event_date <= $2
      ORDER BY event_date ASC
    `,
    [start, end]
  );

  return result.rows.map(mapBlockedDateRow);
}

export async function blockDate(date: string, note?: string): Promise<BlockedDateRow> {
  const db = getDb();
  const result = await db.query<{
    id: number;
    event_date: string;
    status: BlockedDateStatus;
    note: string | null;
    created_at: string | Date;
    updated_at: string | Date;
  }>(
    `
      INSERT INTO blocked_dates (event_date, status, note)
      VALUES ($1, 'blocked', NULLIF($2, ''))
      ON CONFLICT (event_date)
      DO UPDATE SET
        status = 'blocked',
        note = NULLIF(EXCLUDED.note, ''),
        updated_at = NOW()
      RETURNING id, event_date, status, note, created_at, updated_at
    `,
    [date, note?.trim() || ""]
  );

  return mapBlockedDateRow(result.rows[0]);
}

export async function unblockDate(date: string): Promise<BlockedDateRow | null> {
  const db = getDb();
  const result = await db.query<{
    id: number;
    event_date: string;
    status: BlockedDateStatus;
    note: string | null;
    created_at: string | Date;
    updated_at: string | Date;
  }>(
    `
      UPDATE blocked_dates
      SET status = 'available', note = NULL, updated_at = NOW()
      WHERE event_date = $1
      RETURNING id, event_date, status, note, created_at, updated_at
    `,
    [date]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return mapBlockedDateRow(result.rows[0]);
}
