"use client";

import type { Booking, BookingStatus } from "../../types/booking";
import { readCookieValue } from "../../utils/csrf";
import { parseAdminResponse } from "./http";

function adminJsonHeaders() {
  return {
    "Content-Type": "application/json",
    "X-CSRF-Token": readCookieValue("dj_admin_csrf")
  };
}

export async function fetchAdminBookings(options: { includeDeleted?: boolean } = {}) {
  const includeDeleted = options.includeDeleted ?? true;
  const response = await fetch(`/api/bookings?includeDeleted=${includeDeleted ? "true" : "false"}`, {
    cache: "no-store"
  });
  return parseAdminResponse<{ bookings: Booking[] }>(response);
}

export async function updateAdminBookingStatus(bookingId: string, status: BookingStatus) {
  const response = await fetch("/api/bookings", {
    method: "PATCH",
    headers: adminJsonHeaders(),
    body: JSON.stringify({ action: "status", bookingId, status })
  });
  return parseAdminResponse<{ booking: Booking; message?: string }>(response);
}

export async function softDeleteAdminBooking(bookingId: string, deletionReason?: string | null) {
  const response = await fetch("/api/bookings", {
    method: "PATCH",
    headers: adminJsonHeaders(),
    body: JSON.stringify({ action: "delete", bookingId, deletionReason: deletionReason ?? null })
  });
  return parseAdminResponse<{ booking: Booking; message: string }>(response);
}

export async function restoreAdminBooking(bookingId: string) {
  const response = await fetch("/api/bookings", {
    method: "PATCH",
    headers: adminJsonHeaders(),
    body: JSON.stringify({ action: "restore", bookingId })
  });
  return parseAdminResponse<{ booking: Booking; message: string }>(response);
}

export async function deleteAdminBookingForever(bookingId: string) {
  const response = await fetch("/api/bookings", {
    method: "PATCH",
    headers: adminJsonHeaders(),
    body: JSON.stringify({ action: "deleteForever", bookingId })
  });
  return parseAdminResponse<{ bookingId: string; message: string }>(response);
}

export async function purgeExpiredAdminTrash() {
  const response = await fetch("/api/bookings", {
    method: "PATCH",
    headers: adminJsonHeaders(),
    body: JSON.stringify({ action: "purge_expired" })
  });
  return parseAdminResponse<{ purgedCount: number; message: string }>(response);
}

export async function purgeAdminTestTrash() {
  const response = await fetch("/api/bookings", {
    method: "PATCH",
    headers: adminJsonHeaders(),
    body: JSON.stringify({ action: "purge_test" })
  });
  return parseAdminResponse<{ purgedCount: number; message: string }>(response);
}
