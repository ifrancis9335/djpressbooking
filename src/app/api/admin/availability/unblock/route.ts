import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getBlockedDateByEventDate, unblockDate } from "../../../../../lib/availability-db";
import { requireAdminCsrf, requireAdminRequest } from "../../../../../lib/admin-auth";
import { isoDateSchema } from "../../../../../lib/validators/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const unblockDateBodySchema = z.object({
  date: isoDateSchema
});

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
    const body = (await request.json().catch(() => null)) as unknown;
    const parsedBody = unblockDateBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { ok: false, message: "Invalid request.", errors: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const parsed = parsedBody.data;

    const current = await getBlockedDateByEventDate(parsed.date);
    if (!current || current.status !== "blocked") {
      console.info("[admin-availability] unblock_noop", { requestId, date: parsed.date });
      return NextResponse.json({ message: "Date is already available" });
    }

    const updated = await unblockDate(parsed.date);
    revalidatePath("/availability");
    revalidatePath("/booking");
    console.info("[admin-availability] unblock_success", {
      requestId,
      date: parsed.date,
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
