import { NextResponse } from "next/server";
import { requireAdminRequest } from "../../../../lib/admin-auth";
import { listBlockedDates } from "../../../../lib/availability-db";
import { getSiteSettings } from "../../../../lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  const [settings, blockedDates] = await Promise.all([getSiteSettings(), listBlockedDates()]);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const nextBlockedDate = blockedDates.find((value) => {
    const date = new Date(`${value.eventDate}T00:00:00`);
    return date >= now;
  })?.eventDate || null;

  return NextResponse.json({
    summary: {
      totalBlockedDates: blockedDates.length,
      nextBlockedDate,
      publicPhoneNumber: settings.contact.phone,
      publicEmail: settings.contact.email,
      bookingEnabled: settings.booking.enabled
    }
  });
}
