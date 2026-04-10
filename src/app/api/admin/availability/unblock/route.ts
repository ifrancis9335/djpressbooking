import { NextResponse } from "next/server";
import { getBlockedDateByEventDate, unblockDate } from "../../../../../lib/availability-db";
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
    const body = (await request.json()) as { date?: string };
    const parsed = isoDateSchema.safeParse(body?.date);

    if (!parsed.success) {
      return NextResponse.json({ message: "Valid date is required (YYYY-MM-DD)." }, { status: 400 });
    }

    const current = await getBlockedDateByEventDate(parsed.data);
    if (!current || current.status !== "blocked") {
      return NextResponse.json({ message: "Date is already available" });
    }

    const updated = await unblockDate(parsed.data);
    return NextResponse.json({ message: "Date marked available", availability: updated });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to unblock date" },
      { status: 500 }
    );
  }
}
