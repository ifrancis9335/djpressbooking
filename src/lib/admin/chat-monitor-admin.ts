"use client";

import { parseAdminResponse } from "./http";

export interface AdminChatSession {
  id: string;
  requestId: string;
  eventType?: string | null;
  eventDate?: string | null;
  location?: string | null;
  guestCount?: number | null;
  readyForBooking: boolean;
  conversionIntent: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export async function fetchAdminChatSessions(options: { filter?: "recent" | "ready-for-booking"; limit?: number } = {}) {
  const filter = options.filter ?? "recent";
  const limit = options.limit ?? 15;
  const response = await fetch(`/api/admin/chat-sessions?filter=${filter}&limit=${limit}`, { cache: "no-store" });
  return parseAdminResponse<{ sessions: AdminChatSession[]; count: number; timestamp: string }>(response);
}
