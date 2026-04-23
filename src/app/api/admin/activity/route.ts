import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminRequest } from "../../../../lib/admin-auth";
import { listAdminActivity } from "../../../../lib/admin-activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const activityQuerySchema = z.object({
  bookingId: z.string().trim().max(80).optional().default(""),
  limit: z.coerce.number().int().min(1).max(50).default(12)
});

export async function GET(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const parsed = activityQuerySchema.safeParse({
      bookingId: searchParams.get("bookingId") ?? "",
      limit: searchParams.get("limit") ?? "12"
    });

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, message: "Invalid request.", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { bookingId, limit } = parsed.data;
    const activity = await listAdminActivity({ bookingId, limit });
    return NextResponse.json({ activity });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load admin activity" },
      { status: 500 }
    );
  }
}
