import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminRequest } from "../../../../lib/admin-auth";
import { getRecentChatSessions, getReadyForBookingSessions } from "../../../../lib/chat/sessions";

const chatSessionsQuerySchema = z.object({
  filter: z.enum(["recent", "ready-for-booking"]).default("recent"),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

export async function GET(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  const { searchParams } = new URL(request.url);
  const parsedQuery = chatSessionsQuerySchema.safeParse({
    filter: searchParams.get("filter") ?? "recent",
    limit: searchParams.get("limit") ?? "10"
  });

  if (!parsedQuery.success) {
    return NextResponse.json(
      { ok: false, message: "Invalid request.", errors: parsedQuery.error.flatten() },
      { status: 400 }
    );
  }

  const { filter, limit } = parsedQuery.data;

  try {
    let sessions;

    if (filter === "ready-for-booking") {
      sessions = await getReadyForBookingSessions();
    } else {
      sessions = await getRecentChatSessions(limit);
    }

    return NextResponse.json({
      sessions,
      count: sessions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { message: "Unable to fetch chat sessions" },
      { status: 500 }
    );
  }
}
