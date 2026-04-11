import { NextResponse } from "next/server";
import { isoDateSchema, monthSchema } from "../../../lib/validators/api";
import { getBlockedDateByEventDate, listBlockedDates, listBlockedDatesForMonth } from "../../../lib/availability-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function monthFromNow() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function buildMonthAvailability(selectedMonth: string, blockedDates: Set<string>) {
  const [yearRaw, monthRaw] = selectedMonth.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const totalDays = new Date(year, month, 0).getDate();
  const records: Array<{ date: string; status: "available" | "blocked"; note?: string }> = [];

  for (let day = 1; day <= totalDays; day += 1) {
    const isoDate = `${yearRaw}-${monthRaw.padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (blockedDates.has(isoDate)) {
      records.push({ date: isoDate, status: "blocked", note: "Not available" });
      continue;
    }

    records.push({ date: isoDate, status: "available" });
  }

  return records;
}

function logAvailability(event: string, details: Record<string, unknown>) {
  console.info("[availability]", event, details);
}

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const date = searchParams.get("date");
    const list = searchParams.get("list");

    if (list === "blocked") {
      const blockedDates = await listBlockedDates();
      logAvailability("list_blocked", { requestId, count: blockedDates.length });
      return NextResponse.json({ blockedDates });
    }

    if (date) {
      const parsedDate = isoDateSchema.safeParse(date);
      if (!parsedDate.success) {
        return NextResponse.json({ message: "Invalid date query. Use YYYY-MM-DD." }, { status: 400 });
      }

      const blockedRecord = await getBlockedDateByEventDate(date);

      if (blockedRecord?.status === "blocked") {
        logAvailability("date_check_blocked", { requestId, date, source: "postgres" });
        return NextResponse.json({
          available: false,
          status: "blocked",
          source: "postgres",
          blockedDate: blockedRecord
        });
      }

      logAvailability("date_check_available", { requestId, date, source: "postgres" });
      return NextResponse.json({ available: true, status: "available", source: "postgres" });
    }

    const parsedMonth = monthSchema.safeParse(month ?? undefined);
    if (!parsedMonth.success) {
      return NextResponse.json({ message: "Invalid month query. Use YYYY-MM." }, { status: 400 });
    }

    const selectedMonth = parsedMonth.data ?? monthFromNow();
    const blockedByMonth = await listBlockedDatesForMonth(selectedMonth);
    const blockedSet = new Set(blockedByMonth.map((entry) => entry.eventDate));
    const mergedAvailability = buildMonthAvailability(selectedMonth, blockedSet);

    logAvailability("month_view", {
      requestId,
      month: selectedMonth,
      blockedDates: blockedByMonth.length,
      mergedRecords: mergedAvailability.length
    });

    return NextResponse.json({ availability: mergedAvailability });
  } catch (error) {
    console.error("[availability] request_failed", {
      requestId,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load availability" },
      { status: 500 }
    );
  }
}
