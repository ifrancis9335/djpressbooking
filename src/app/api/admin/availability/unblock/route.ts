import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getBlockedDateByEventDate, unblockDate } from "../../../../../lib/availability-db";
import { requireAdminCsrf, requireAdminRequest } from "../../../../../lib/admin-auth";
import { isoDateSchema } from "../../../../../lib/validators/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const authError = requireAdminRequest(request);
  if (authError) {
    console.warn("[admin-availability] unblock_unauthorized", { requestId });
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  const csrfError = requireAdminCsrf(request);
  if (csrfError) {
    return NextResponse.json({ message: csrfError }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => null)) as { date?: string } | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }
    const parsed = isoDateSchema.safeParse(body?.date);

    if (!parsed.success) {
      return NextResponse.json({ message: "Valid date is required (YYYY-MM-DD)." }, { status: 400 });
    }

    const current = await getBlockedDateByEventDate(parsed.data);
    if (!current || current.status !== "blocked") {
      console.info("[admin-availability] unblock_noop", { requestId, date: parsed.data });
      return NextResponse.json({ message: "Date is already available" });
    }

    const updated = await unblockDate(parsed.data);
    revalidatePath("/availability");
    revalidatePath("/booking");
    console.info("[admin-availability] unblock_success", {
      requestId,
      date: parsed.data,
      status: updated?.status ?? "available"
    });
    return NextResponse.json({ message: "Date marked available", availability: updated });
  } catch (error) {
    console.error("[admin-availability] unblock_failed", {
      requestId,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to unblock date" },
      { status: 500 }
    );
  }
}
