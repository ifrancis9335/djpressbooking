import { NextResponse } from "next/server";
import { requireAdminRequest } from "../../../../lib/admin-auth";
import { logAdminDebug, logAdminDebugError } from "../../../../lib/admin-debug";
import { listBlockedDates } from "../../../../lib/availability-db";
import { getSiteSettings } from "../../../../lib/site-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  try {
    const settings = await getSiteSettings();
    let blockedDates = [] as Awaited<ReturnType<typeof listBlockedDates>>;

    try {
      blockedDates = await listBlockedDates();
      logAdminDebug("admin_dashboard_blocked_dates_loaded", { count: blockedDates.length });
    } catch (error) {
      // Keep admin dashboard usable even if blocked-dates DB query fails temporarily.
      logAdminDebugError("admin_dashboard_blocked_dates_error", error);
      blockedDates = [];
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const nextBlockedDate = blockedDates.find((value) => {
      const date = new Date(`${value.eventDate}T00:00:00`);
      return date >= now;
    })?.eventDate || null;

    logAdminDebug("admin_dashboard_success", {
      totalBlockedDates: blockedDates.length,
      hasNextBlockedDate: Boolean(nextBlockedDate)
    });

    return NextResponse.json({
      summary: {
        totalBlockedDates: blockedDates.length,
        nextBlockedDate,
        publicPhoneNumber: settings.contact.phone,
        publicEmail: settings.contact.email,
        bookingEnabled: settings.booking.enabled
      }
    });
  } catch (error) {
    logAdminDebugError("admin_dashboard_error", error);
    return NextResponse.json({ message: "Unable to load admin dashboard" }, { status: 500 });
  }
}
