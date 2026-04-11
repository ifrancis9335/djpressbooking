import { NextResponse } from "next/server";
import { getAvailabilityByDate, getAvailabilityForMonth } from "../../../lib/availability";
import { isoDateSchema, monthSchema } from "../../../lib/validators/api";
import { isFirebaseAdminConfigured } from "../../../lib/firebase";
import { getBlockedDateByEventDate, listBlockedDates, listBlockedDatesForMonth } from "../../../lib/availability-db";

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

      if (isFirebaseAdminConfigured()) {
        const firebaseRecord = await getAvailabilityByDate(date);
        if (firebaseRecord.status !== "available") {
          logAvailability("date_check_unavailable", {
            requestId,
            date,
            source: "firebase",
            status: firebaseRecord.status
          });
          return NextResponse.json({
            available: false,
            status: firebaseRecord.status,
            source: "firebase",
            record: firebaseRecord
          });
        }
      }

      logAvailability("date_check_available", { requestId, date, source: "postgres+firebase" });
      return NextResponse.json({ available: true, status: "available", source: "postgres" });
    }

    const parsedMonth = monthSchema.safeParse(month ?? undefined);
    if (!parsedMonth.success) {
      return NextResponse.json({ message: "Invalid month query. Use YYYY-MM." }, { status: 400 });
    }

    const selectedMonth = parsedMonth.data ?? monthFromNow();
    const availability = isFirebaseAdminConfigured() ? await getAvailabilityForMonth(selectedMonth) : [];
    const blockedByMonth = await listBlockedDatesForMonth(selectedMonth);

    const availabilityMap = new Map(availability.map((record) => [record.date, record]));
    blockedByMonth.forEach((blockedDate) => {
      const current = availabilityMap.get(blockedDate.eventDate);
      if (!current || current.status === "available") {
        availabilityMap.set(blockedDate.eventDate, {
          date: blockedDate.eventDate,
          status: "blocked",
          note: blockedDate.note || "Blocked by admin",
          updatedAt: new Date().toISOString()
        });
      }
    });

    const mergedAvailability = Array.from(availabilityMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    logAvailability("month_view", {
      requestId,
      month: selectedMonth,
      firebaseRecords: availability.length,
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
