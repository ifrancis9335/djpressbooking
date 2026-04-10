import { NextResponse } from "next/server";
import { blockDate, getBlockedDateByEventDate } from "../../../../../lib/availability-db";
import { requireAdminRequest } from "../../../../../lib/admin-auth";
import { isoDateSchema } from "../../../../../lib/validators/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  try {
    const body = (await request.json()) as { date?: string; note?: string };
    const parsed = isoDateSchema.safeParse(body?.date);

    if (!parsed.success) {
      return NextResponse.json({ message: "Valid date is required (YYYY-MM-DD)." }, { status: 400 });
    }

    const current = await getBlockedDateByEventDate(parsed.data);
    if (current?.status === "blocked") {
      return NextResponse.json({ message: "Date is already blocked", blockedDate: current }, { status: 409 });
    }

    const blockedDate = await blockDate(parsed.data, body?.note);
    return NextResponse.json({ message: "Date blocked", blockedDate });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to block date" },
      { status: 500 }
    );
  }
}
