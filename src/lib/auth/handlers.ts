import { NextResponse } from "next/server";
import { logAdminDebug, logAdminDebugError } from "../admin-debug";
import { readJsonBody, withRetryAfter } from "../api/http";
import { writeRequestLog } from "../data/request-logs";
import { checkRateLimit } from "../security/rate-limit";
import {
  ADMIN_CSRF_COOKIE,
  ADMIN_SESSION_COOKIE,
  buildAdminCsrfToken,
  buildAdminSessionValue,
  getAdminSessionState,
  requireAdminCsrf,
  requireAdminRequest,
  validateAdminPassword
} from "./admin";

export async function postAdminLogin(request: Request) {
  const requestId = crypto.randomUUID();
  const path = new URL(request.url).pathname;

  try {
    const rateLimit = checkRateLimit(request, "admin-login", { windowMs: 15 * 60 * 1000, maxRequests: 8 });
    if (rateLimit.limited) {
      const response = NextResponse.json(
        { message: "Too many login attempts. Please try again later." },
        { status: 429 }
      );

      withRetryAfter(response, rateLimit.retryAfterSeconds);
      void writeRequestLog(request, {
        requestId,
        domain: "auth",
        action: "admin_login_limited",
        method: "POST",
        path,
        statusCode: 429,
        metadata: { retryAfterSeconds: rateLimit.retryAfterSeconds }
      });
      return response;
    }

    const body = await readJsonBody<{ password?: string }>(request);
    if (!body || typeof body !== "object") {
      void writeRequestLog(request, {
        requestId,
        domain: "auth",
        action: "admin_login_invalid_json",
        method: "POST",
        path,
        statusCode: 400
      });
      return NextResponse.json({ message: "Invalid JSON payload" }, { status: 400 });
    }

    const password = body.password?.trim() || "";
    if (!validateAdminPassword(password)) {
      logAdminDebug("admin_login_failed", { reason: "invalid_password" });
      void writeRequestLog(request, {
        requestId,
        domain: "auth",
        action: "admin_login_failed",
        method: "POST",
        path,
        statusCode: 401
      });
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

    void writeRequestLog(request, {
      requestId,
      domain: "auth",
      action: "admin_login_success",
      method: "POST",
      path,
      statusCode: 200
    });

    return response;
  } catch (error) {
    logAdminDebugError("admin_login_error", error);
    void writeRequestLog(request, {
      requestId,
      domain: "auth",
      action: "admin_login_error",
      method: "POST",
      path,
      statusCode: 500,
      metadata: { message: error instanceof Error ? error.message : String(error) }
    });
    return NextResponse.json({ message: "Unable to sign in" }, { status: 500 });
  }
}

export async function postAdminLogout(request: Request) {
  const requestId = crypto.randomUUID();
  const path = new URL(request.url).pathname;

  const authError = requireAdminRequest(request);
  if (authError) {
    return NextResponse.json({ message: authError }, { status: authError === "Unauthorized" ? 401 : 503 });
  }

  const csrfError = requireAdminCsrf(request);
  if (csrfError) {
    return NextResponse.json({ message: csrfError }, { status: 403 });
  }

  const response = NextResponse.json({ message: "Signed out" });

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });

  response.cookies.set({
    name: ADMIN_CSRF_COOKIE,
    value: "",
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });

  void writeRequestLog(request, {
    requestId,
    domain: "auth",
    action: "admin_logout",
    method: "POST",
    path,
    statusCode: 200
  });

  return response;
}

export async function getAdminSession(request: Request) {
  const requestId = crypto.randomUUID();
  const path = new URL(request.url).pathname;
  const session = getAdminSessionState(request);

  void writeRequestLog(request, {
    requestId,
    domain: "auth",
    action: "admin_session",
    method: "GET",
    path,
    statusCode: 200,
    metadata: { authenticated: session.authenticated, configured: session.configured }
  });

  return NextResponse.json(session);
}