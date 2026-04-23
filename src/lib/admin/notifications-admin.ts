"use client";

import type { AdminNotification } from "../../types/notification";
import { readCookieValue } from "../../utils/csrf";
import { parseAdminResponse } from "./http";

function adminJsonHeaders() {
  return {
    "Content-Type": "application/json",
    "X-CSRF-Token": readCookieValue("dj_admin_csrf")
  };
}

export async function fetchAdminNotifications() {
  const response = await fetch("/api/admin/notifications", { cache: "no-store" });
  return parseAdminResponse<{ notifications: AdminNotification[] }>(response);
}

export async function markAdminNotificationRead(id: string) {
  const response = await fetch("/api/admin/notifications", {
    method: "PATCH",
    headers: adminJsonHeaders(),
    body: JSON.stringify({ id })
  });

  return parseAdminResponse<{ notification: AdminNotification }>(response);
}

export function openAdminNotificationsStream() {
  return new EventSource("/api/admin/notifications/stream");
}