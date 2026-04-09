import { NextResponse } from "next/server";
import { getAvailabilityByDate, getAvailabilityForMonth } from "../../../lib/availability";
import { isoDateSchema, monthSchema } from "../../../lib/validators/api";
import { isFirebaseAdminConfigured } from "../../../lib/firebase";

export async function GET(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ message: "Firebase Admin is not configured." }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const date = searchParams.get("date");

    if (date) {
      const parsedDate = isoDateSchema.safeParse(date);
      if (!parsedDate.success) {
        return NextResponse.json({ message: "Invalid date query. Use YYYY-MM-DD." }, { status: 400 });
      }
      const record = await getAvailabilityByDate(date);
      return NextResponse.json({ availability: [record], record });
    }

    const parsedMonth = monthSchema.safeParse(month ?? undefined);
    if (!parsedMonth.success) {
      return NextResponse.json({ message: "Invalid month query. Use YYYY-MM." }, { status: 400 });
    }

    const now = new Date();
    const fallbackMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const availability = await getAvailabilityForMonth(parsedMonth.data ?? fallbackMonth);
    return NextResponse.json({ availability });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load availability" },
      { status: 500 }
    );
  }
}
