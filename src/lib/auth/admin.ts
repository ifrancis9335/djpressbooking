import {
  ADMIN_CSRF_COOKIE,
  ADMIN_SESSION_COOKIE,
  buildAdminCsrfToken,
  buildAdminSessionValue,
  isAdminConfigured,
  isAuthorizedAdminRequest,
  isValidAdminSessionValue,
  requireAdminCsrf,
  requireAdminRequest,
  validateAdminPassword
} from "../admin-auth";
import type { AdminSessionState } from "./types";

function parseCookieHeader(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  const parsed = new Map<string, string>();

  cookieHeader.split(";").forEach((chunk) => {
    const trimmed = chunk.trim();
    if (!trimmed) return;

    const [name, ...rest] = trimmed.split("=");
    if (!name) return;

    parsed.set(name, rest.join("="));
  });

  return parsed;
}

export function getAdminSessionState(request: Request): AdminSessionState {
  const cookies = parseCookieHeader(request);
  const sessionValue = cookies.get(ADMIN_SESSION_COOKIE);

  return {
    configured: isAdminConfigured(),
    authenticated: isValidAdminSessionValue(sessionValue),
    sessionCookieName: ADMIN_SESSION_COOKIE,
    csrfCookieName: ADMIN_CSRF_COOKIE
  };
}

export {
  ADMIN_CSRF_COOKIE,
  ADMIN_SESSION_COOKIE,
  buildAdminCsrfToken,
  buildAdminSessionValue,
  isAdminConfigured,
  isAuthorizedAdminRequest,
  requireAdminCsrf,
  requireAdminRequest,
  validateAdminPassword
};