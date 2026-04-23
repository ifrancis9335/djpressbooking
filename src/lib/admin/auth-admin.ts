"use client";

import { parseAdminResponse } from "./http";
import { readCookieValue } from "../../utils/csrf";

export interface AdminSessionResponse {
  configured: boolean;
  authenticated: boolean;
  sessionCookieName: string;
  csrfCookieName: string;
}

export async function fetchAdminSession() {
  const response = await fetch("/api/auth/session", { cache: "no-store" });
  return parseAdminResponse<AdminSessionResponse>(response);
}

export async function loginAdmin(password: string) {
  const response = await fetch("/api/auth/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });

  return parseAdminResponse<{ message: string }>(response);
}

export async function logoutAdmin() {
  const response = await fetch("/api/auth/admin/logout", {
    method: "POST",
    headers: { "X-CSRF-Token": readCookieValue("dj_admin_csrf") }
  });
  return parseAdminResponse<{ message: string }>(response);
}