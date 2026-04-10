import { NextResponse } from "next/server";
import { getAvailabilityByDate, getAvailabilityForMonth } from "../../../lib/availability";
import { isoDateSchema, monthSchema } from "../../../lib/validators/api";
import { isFirebaseAdminConfigured } from "../../../lib/firebase";
import { getUnavailableDates } from "../../../lib/unavailable-dates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function monthFromNow() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function toMonthPrefix(monthIso: string) {
  return `${monthIso}-`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const date = searchParams.get("date");
    const unavailableDates = await getUnavailableDates();

    if (date) {
      const parsedDate = isoDateSchema.safeParse(date);
      if (!parsedDate.success) {
        return NextResponse.json({ message: "Invalid date query. Use YYYY-MM-DD." }, { status: 400 });
      }

      if (unavailableDates.includes(date)) {
        return NextResponse.json({
          available: false,
          status: "blocked",
          record: {
            date,
            status: "blocked",
            note: "Blocked by admin",
            updatedAt: new Date().toISOString()
          }
        });
      }

      if (!isFirebaseAdminConfigured()) {
        return NextResponse.json({
          available: true,
          status: "available",
          record: {
            date,
            status: "available",
            updatedAt: new Date().toISOString()
          }
        });
      }

      const record = await getAvailabilityByDate(date);
      const available = record.status === "available";
      return NextResponse.json({ available, status: record.status, record });
    }

    const parsedMonth = monthSchema.safeParse(month ?? undefined);
    if (!parsedMonth.success) {
      return NextResponse.json({ message: "Invalid month query. Use YYYY-MM." }, { status: 400 });
    }

    const selectedMonth = parsedMonth.data ?? monthFromNow();
    const availability = isFirebaseAdminConfigured() ? await getAvailabilityForMonth(selectedMonth) : [];

    const availabilityMap = new Map(availability.map((record) => [record.date, record]));
    const blockedByConfig = unavailableDates.filter((value) => value.startsWith(toMonthPrefix(selectedMonth)));

    blockedByConfig.forEach((blockedDate) => {
      const current = availabilityMap.get(blockedDate);
      if (!current || current.status === "available") {
        availabilityMap.set(blockedDate, {
          date: blockedDate,
          status: "blocked",
          note: "Blocked by admin",
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
