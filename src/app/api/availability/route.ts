import { NextResponse } from "next/server";
import { getAvailabilityForMonth } from "../../../lib/availability";
import { isoDateSchema, monthSchema } from "../../../lib/validators/api";
import { isFirebaseAdminConfigured } from "../../../lib/firebase";
import { getBlockedDateByEventDate, listBlockedDates, listBlockedDatesForMonth } from "../../../lib/availability-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function monthFromNow() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const date = searchParams.get("date");
    const list = searchParams.get("list");

    if (list === "blocked") {
      const blockedDates = await listBlockedDates();
      return NextResponse.json({ blockedDates });
    }

    if (date) {
      const parsedDate = isoDateSchema.safeParse(date);
      if (!parsedDate.success) {
        return NextResponse.json({ message: "Invalid date query. Use YYYY-MM-DD." }, { status: 400 });
      }

      const blockedRecord = await getBlockedDateByEventDate(date);

      if (blockedRecord?.status === "blocked") {
        return NextResponse.json({
          available: false,
          status: "blocked",
          source: "postgres",
          blockedDate: blockedRecord
        });
      }

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

    return NextResponse.json({ availability: mergedAvailability });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load availability" },
      { status: 500 }
    );
  }
}
