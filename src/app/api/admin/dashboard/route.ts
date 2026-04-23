import { NextResponse } from "next/server";
import { requireAdminRequest } from "../../../../lib/admin-auth";
import { listAdminActivity } from "../../../../lib/admin-activity";
import { logAdminDebug, logAdminDebugError } from "../../../../lib/admin-debug";
import { listBlockedDates } from "../../../../lib/availability-db";
import { getBookings, purgeOldDeletedBookings } from "../../../../lib/bookings";
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
    let totalBookings = 0;
    let bookingsAwaitingResponse = 0;
    let upcomingConfirmedBookings = 0;
    let recentActivityCount = 0;

    try {
      const purgedBookings = await purgeOldDeletedBookings();
      if (purgedBookings.length > 0) {
        logAdminDebug("admin_dashboard_purged_deleted_bookings", { count: purgedBookings.length });
      }
    } catch (error) {
      logAdminDebugError("admin_dashboard_purge_deleted_bookings_error", error);
    }

    try {
      blockedDates = await listBlockedDates();
      logAdminDebug("admin_dashboard_blocked_dates_loaded", { count: blockedDates.length });
    } catch (error) {
      // Keep admin dashboard usable even if the blocked-dates Firestore query fails temporarily.
      logAdminDebugError("admin_dashboard_blocked_dates_error", error);
      blockedDates = [];
    }

    try {
      const bookings = await getBookings();
      const todayIso = new Date().toISOString().slice(0, 10);
      totalBookings = bookings.length;
      bookingsAwaitingResponse = bookings.filter((booking) => booking.status === "new" || booking.status === "awaiting_response").length;
      upcomingConfirmedBookings = bookings.filter(
        (booking) => booking.status === "confirmed" && booking.eventDate >= todayIso
      ).length;
    } catch (error) {
      logAdminDebugError("admin_dashboard_bookings_error", error);
    }

    try {
      recentActivityCount = (await listAdminActivity({ limit: 10 })).length;
    } catch (error) {
      logAdminDebugError("admin_dashboard_activity_error", error);
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
        bookingEnabled: settings.booking.enabled,
        totalBookings,
        bookingsAwaitingResponse,
        upcomingConfirmedBookings,
        recentActivityCount
      }
    });
  } catch (error) {
    logAdminDebugError("admin_dashboard_error", error);
    return NextResponse.json({ message: "Unable to load admin dashboard" }, { status: 500 });
  }
}
