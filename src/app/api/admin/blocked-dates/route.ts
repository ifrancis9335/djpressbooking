import { NextResponse } from "next/server";
import { addUnavailableDate, getUnavailableDates, removeUnavailableDate } from "../../../../lib/unavailable-dates";
import { isoDateSchema } from "../../../../lib/validators/api";
import { requireAdminRequest } from "../../../../lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  const unavailableDates = await getUnavailableDates();
  return NextResponse.json({ unavailableDates });
}

export async function POST(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  try {
    const body = (await request.json()) as { date?: string };
    const parsed = isoDateSchema.safeParse(body?.date);
    if (!parsed.success) {
      return NextResponse.json({ message: "Valid date is required (YYYY-MM-DD)." }, { status: 400 });
    }

    const current = await getUnavailableDates();
    if (current.includes(parsed.data)) {
      return NextResponse.json({ message: "Date is already blocked", unavailableDates: current }, { status: 409 });
    }

    const unavailableDates = await addUnavailableDate(parsed.data);
    return NextResponse.json({ message: "Date blocked", unavailableDates });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to block date" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");
    const parsed = isoDateSchema.safeParse(dateParam);

    if (!parsed.success) {
      return NextResponse.json({ message: "Valid date query is required (YYYY-MM-DD)." }, { status: 400 });
    }

    const unavailableDates = await removeUnavailableDate(parsed.data);
    return NextResponse.json({ message: "Date removed", unavailableDates });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to remove blocked date" },
      { status: 500 }
    );
  }
}
