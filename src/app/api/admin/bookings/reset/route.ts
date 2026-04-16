import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdminCsrf, requireAdminRequest } from "../../../../../lib/admin-auth";
import { resetBookingData } from "../../../../../lib/booking-reset";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REQUIRED_CONFIRMATION = "RESET_BOOKING_DATA";

interface ResetBookingDataBody {
  confirm?: string;
  resetBlockedDates?: boolean;
}

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

  const body = (await request.json().catch(() => null)) as ResetBookingDataBody | null;
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
  }

  if (body.confirm !== REQUIRED_CONFIRMATION) {
    return NextResponse.json(
      {
        message: `Confirmation required. Send confirm=${REQUIRED_CONFIRMATION} to reset booking data.`
      },
      { status: 400 }
    );
  }

  const summary = await resetBookingData({
    resetBlockedDates: body.resetBlockedDates === true
  });

  console.info("[admin-bookings-reset] reset_success", {
    requestId,
    resetBlockedDates: body.resetBlockedDates === true,
    ...summary
  });

  revalidatePath("/admin");
  revalidatePath("/booking");
  revalidatePath("/availability");
  revalidatePath("/find-booking");
  revalidatePath("/booking-history");

  return NextResponse.json({
    message: body.resetBlockedDates === true ? "Booking data and blocked dates reset." : "Booking data reset.",
    summary
  });
}