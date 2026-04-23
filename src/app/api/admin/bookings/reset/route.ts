import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminCsrf, requireAdminRequest } from "../../../../../lib/admin-auth";
import { resetBookingData } from "../../../../../lib/booking-reset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUIRED_CONFIRMATION = "RESET_BOOKING_DATA";
const resetBookingBodySchema = z.object({
  confirm: z.string(),
  resetBlockedDates: z.boolean().optional().default(false)
});

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();

  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  const csrfError = requireAdminCsrf(request);
  if (csrfError) {
    return NextResponse.json({ message: csrfError }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as unknown;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const parsedBody = resetBookingBodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid request.", errors: parsedBody.error.flatten() },
      { status: 400 }
    );
  }

  const parsed = parsedBody.data;

  if (parsed.confirm !== REQUIRED_CONFIRMATION) {
    return NextResponse.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  const summary = await resetBookingData({
    resetBlockedDates: parsed.resetBlockedDates === true
  });

  console.info("[admin-bookings-reset] reset_success", {
    requestId,
    resetBlockedDates: parsed.resetBlockedDates === true,
    ...summary
  });

  revalidatePath("/admin");
  revalidatePath("/booking");
  revalidatePath("/availability");
  revalidatePath("/find-booking");
  revalidatePath("/booking-history");

  return NextResponse.json({
    message: parsed.resetBlockedDates === true ? "Booking data and blocked dates reset." : "Booking data reset.",
    summary
  });
}