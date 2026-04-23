import { NextResponse } from "next/server";

export async function readJsonBody<T>(request: Request): Promise<T | null> {
  return (await request.json().catch(() => null)) as T | null;
}

export function jsonError(message: string, status = 500, extras?: Record<string, unknown>) {
  return NextResponse.json({ message, ...extras }, { status });
}

export function withRetryAfter(response: NextResponse, seconds: number) {
  response.headers.set("Retry-After", String(seconds));
  return response;
}

export function safeErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}