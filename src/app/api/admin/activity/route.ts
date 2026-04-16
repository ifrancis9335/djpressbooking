import { NextResponse } from "next/server";
import { requireAdminRequest } from "../../../../lib/admin-auth";
import { listAdminActivity } from "../../../../lib/admin-activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId")?.trim() || "";
    const rawLimit = Number(searchParams.get("limit") || "12");
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 50) : 12;
    const activity = await listAdminActivity({ bookingId, limit });
    return NextResponse.json({ activity });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load admin activity" },
      { status: 500 }
    );
  }
}
