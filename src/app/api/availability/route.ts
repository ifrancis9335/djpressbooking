import { NextResponse } from "next/server";
import { isoDateSchema, monthSchema } from "../../../lib/validators/api";
import { listBlockedDates } from "../../../lib/availability-db";
import { getAvailabilityByDate, getAvailabilityForMonth } from "../../../lib/availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function monthFromNow() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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

      const availability = await getAvailabilityByDate(date);
      if (availability.status !== "blocked") {
        logAvailability("date_check_available", { requestId, date, source: "firestore_live_data" });
        return NextResponse.json({ available: true, status: "available", source: "firestore_live_data" });
      }

      logAvailability("date_check_blocked", { requestId, date, source: "blocked_dates" });
      return NextResponse.json({
        available: false,
        status: "blocked",
        source: "blocked_dates",
        blockedDate: { date, note: availability.note }
      });
    }

    const parsedMonth = monthSchema.safeParse(month ?? undefined);
    if (!parsedMonth.success) {
      return NextResponse.json({ message: "Invalid month query. Use YYYY-MM." }, { status: 400 });
    }

    const selectedMonth = parsedMonth.data ?? monthFromNow();
    const mergedAvailability = await getAvailabilityForMonth(selectedMonth);
    const blockedByMonth = mergedAvailability.filter((entry) => entry.status === "blocked");

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
