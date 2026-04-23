import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { blockDate, getBlockedDateByEventDate } from "../../../../../lib/availability-db";
import { requireAdminCsrf, requireAdminRequest } from "../../../../../lib/admin-auth";
import { isoDateSchema } from "../../../../../lib/validators/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const blockDateBodySchema = z.object({
  date: isoDateSchema,
  note: z.string().trim().max(500).optional()
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const authError = requireAdminRequest(request);
  if (authError) {
    console.warn("[admin-availability] block_unauthorized", { requestId });
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  const csrfError = requireAdminCsrf(request);
  if (csrfError) {
    return NextResponse.json({ message: csrfError }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => null)) as unknown;
    const parsedBody = blockDateBodySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { ok: false, message: "Invalid request.", errors: parsedBody.error.flatten() },
        { status: 400 }
      );
    }

    const parsed = parsedBody.data;

    const current = await getBlockedDateByEventDate(parsed.date);
    if (current?.status === "blocked") {
      console.info("[admin-availability] block_exists", { requestId, date: parsed.date });
      return NextResponse.json({ message: "Date is already blocked", blockedDate: current }, { status: 409 });
    }

    const blockedDate = await blockDate(parsed.date, parsed.note);
    revalidatePath("/availability");
    revalidatePath("/booking");
    console.info("[admin-availability] block_success", {
      requestId,
      date: blockedDate.eventDate,
      status: blockedDate.status
    });
    return NextResponse.json({ message: "Date blocked", blockedDate });
  } catch (error) {
    console.error("[admin-availability] block_failed", {
      requestId,
      message: error instanceof Error ? error.message : "Unknown error"
    });
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to block date" },
      { status: 500 }
    );
  }
}
