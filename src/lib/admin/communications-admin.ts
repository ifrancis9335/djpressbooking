"use client";

import type { BookingMessage } from "../../types/booking-thread";
import type { ManagedImageAsset } from "../../types/site-content";
import { readCookieValue } from "../../utils/csrf";
import { parseAdminResponse } from "./http";

function adminJsonHeaders() {
  return {
    "Content-Type": "application/json",
    "X-CSRF-Token": readCookieValue("dj_admin_csrf")
  };
}

export async function fetchAdminBookingMessages(bookingId: string) {
  const response = await fetch(`/api/admin/bookings/${bookingId}/messages`, { cache: "no-store" });
  return parseAdminResponse<{ messages: BookingMessage[] }>(response);
}

export async function createAdminBookingMessage(
  bookingId: string,
  payload: { body: string; visibility: "customer" | "internal" }
) {
  const response = await fetch(`/api/admin/bookings/${bookingId}/messages`, {
    method: "POST",
    headers: adminJsonHeaders(),
    body: JSON.stringify(payload)
  });

  return parseAdminResponse<{ threadMessage: BookingMessage; message: string }>(response);
}

export async function sendAdminDirectEmail(
  bookingId: string,
  payload: { to: string; subject: string; message: string }
) {
  let response: Response;
  try {
    response = await fetch(`/api/admin/bookings/${bookingId}/direct-email`, {
      method: "POST",
      headers: adminJsonHeaders(),
      body: JSON.stringify(payload)
    });
  } catch {
    throw new Error("Network error - could not reach the server.");
  }

  return parseAdminResponse<{ ok: true; message: string; id?: string }>(response);
}

export async function uploadAdminImage(file: File, scope: string, title: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("scope", scope);
  formData.append("title", title);

  const response = await fetch("/api/admin/uploads", {
    method: "POST",
    headers: { "X-CSRF-Token": readCookieValue("dj_admin_csrf") },
    body: formData
  });

  return parseAdminResponse<{ asset: ManagedImageAsset; message?: string }>(response);
}

export async function deleteAdminImage(url: string) {
  const response = await fetch("/api/admin/uploads", {
    method: "DELETE",
    headers: adminJsonHeaders(),
    body: JSON.stringify({ url })
  });

  return parseAdminResponse<{ message?: string }>(response);
}