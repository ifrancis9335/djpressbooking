import { NextResponse } from "next/server";
import { requireAdminCsrf, requireAdminRequest } from "../../../../lib/admin-auth";
import { listNotifications, markNotificationRead } from "../../../../lib/notifications/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  try {
    const notifications = await listNotifications();
    return NextResponse.json({
      notifications,
      unreadCount: notifications.filter((item) => !item.read).length
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to load notifications" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  const csrfError = requireAdminCsrf(request);
  if (csrfError) {
    return NextResponse.json({ message: csrfError }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => null)) as { id?: string } | null;
    if (!body || typeof body !== "object" || !body.id?.trim()) {
      return NextResponse.json({ message: "Notification id is required" }, { status: 400 });
    }

    const notification = await markNotificationRead(body.id.trim());
    return NextResponse.json({ notification, message: "Notification marked as read" });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update notification" },
      { status: 500 }
    );
  }
}