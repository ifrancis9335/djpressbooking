import { NextResponse } from "next/server";
import {
  ADMIN_CSRF_COOKIE,
  ADMIN_SESSION_COOKIE,
  buildAdminCsrfToken,
  buildAdminSessionValue,
  validateAdminPassword
} from "../../../../../lib/admin-auth";
import { logAdminDebug, logAdminDebugError } from "../../../../../lib/admin-debug";
import { checkRateLimit } from "../../../../../lib/security/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const rateLimit = checkRateLimit(request, "admin-login", { windowMs: 15 * 60 * 1000, maxRequests: 8 });
    if (rateLimit.limited) {
      const response = NextResponse.json({ message: "Too many login attempts. Please try again later." }, { status: 429 });
      response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
      return response;
    }

    const body = (await request.json().catch(() => null)) as { password?: string } | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }
    const password = body.password?.trim() || "";

    if (!validateAdminPassword(password)) {
      logAdminDebug("admin_login_failed", { reason: "invalid_password" });
      return NextResponse.json({ message: "Invalid admin password" }, { status: 401 });
    }

    const session = buildAdminSessionValue();
  const csrfToken = buildAdminCsrfToken();
    const response = NextResponse.json({ message: "Authenticated" });

    response.cookies.set({
      name: ADMIN_SESSION_COOKIE,
      value: session,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12
    });

    response.cookies.set({
      name: ADMIN_CSRF_COOKIE,
      value: csrfToken,
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12
    });

    logAdminDebug("admin_login_success", {
      cookieName: ADMIN_SESSION_COOKIE,
      secureCookie: process.env.NODE_ENV === "production",
      sessionValueLength: session.length
    });

    return response;
  } catch (error) {
    logAdminDebugError("admin_login_error", error);
    return NextResponse.json({ message: "Unable to sign in" }, { status: 500 });
  }
}
