"use client";

import { readCookieValue } from "../../utils/csrf";
import type { BlockedDateEntry } from "../../components/admin/dashboard/types";
import { parseAdminResponse } from "./http";

function adminJsonHeaders() {
  return {
    "Content-Type": "application/json",
    "X-CSRF-Token": readCookieValue("dj_admin_csrf")
  };
}

export async function fetchAdminBlockedDates() {
  const response = await fetch(`/api/availability?list=blocked&t=${Date.now()}`, { cache: "no-store" });
  return parseAdminResponse<{ blockedDates: BlockedDateEntry[] }>(response);
}

export async function blockAdminDate(date: string, note: string) {
  const response = await fetch("/api/admin/availability/block", {
    method: "POST",
    headers: adminJsonHeaders(),
    body: JSON.stringify({ date, note })
  });
  return parseAdminResponse<{ blockedDate: BlockedDateEntry; message: string }>(response);
}

export async function unblockAdminDate(date: string) {
  const response = await fetch("/api/admin/availability/unblock", {
    method: "POST",
    headers: adminJsonHeaders(),
    body: JSON.stringify({ date })
  });
  return parseAdminResponse<{ message: string }>(response);
}
