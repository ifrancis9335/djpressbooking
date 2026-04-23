"use client";

import type { AdminActivity } from "../../types/admin-activity";
import { parseAdminResponse } from "./http";

export async function fetchAdminActivity(limit = 12) {
  const response = await fetch(`/api/admin/activity?limit=${limit}`, { cache: "no-store" });
  return parseAdminResponse<{ activity: AdminActivity[] }>(response);
}