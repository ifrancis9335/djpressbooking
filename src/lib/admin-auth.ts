import crypto from "crypto";
import { logAdminDebug } from "./admin-debug";

export const ADMIN_SESSION_COOKIE = "dj_admin_session";
export const ADMIN_CSRF_COOKIE = "dj_admin_csrf";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12;

interface AdminSessionPayload {
  v: number;
  role: "admin";
  iat: number;
  exp: number;
  nonce: string;
}

function getAdminSecret() {
  return process.env.ADMIN_API_KEY || process.env.ADMIN_PASSWORD || "";
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(payloadBase64: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payloadBase64).digest("base64url");
}

function timingSafeEqualStrings(left: string, right: string) {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  if (leftBytes.length !== rightBytes.length) {
    return false;
  }
  return crypto.timingSafeEqual(leftBytes, rightBytes);
}

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

export function isAdminConfigured() {
  return Boolean(getAdminSecret());
}

export function validateAdminPassword(input: string) {
  const expected = getAdminSecret();
  if (!expected) return false;
  return timingSafeEqualStrings(input, expected);
}

export function buildAdminSessionValue() {
  const secret = getAdminSecret();
  if (!secret) return "";

  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSessionPayload = {
    v: 1,
    role: "admin",
    iat: now,
    exp: now + ADMIN_SESSION_TTL_SECONDS,
    nonce: crypto.randomUUID()
  };
  const payloadBase64 = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(payloadBase64, secret);
  return `${payloadBase64}.${signature}`;
}

export function buildAdminCsrfToken() {
  return crypto.randomBytes(24).toString("base64url");
}

export function isValidAdminSessionValue(value: string | undefined) {
  if (!value) return false;
  const secret = getAdminSecret();
  if (!secret) return false;

  const [payloadBase64, signature] = value.split(".");
  if (!payloadBase64 || !signature) return false;

  const expectedSignature = signPayload(payloadBase64, secret);
  if (!timingSafeEqualStrings(signature, expectedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(fromBase64Url(payloadBase64)) as Partial<AdminSessionPayload>;
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number") return false;
    if (payload.role !== "admin") return false;
    return payload.exp > now;
  } catch {
    return false;
  }
}

export function isAuthorizedAdminRequest(request: Request) {
  const cookies = parseCookieHeader(request);
  return isValidAdminSessionValue(cookies.get(ADMIN_SESSION_COOKIE));
}

export function requireAdminCsrf(request: Request): string | null {
  const cookies = parseCookieHeader(request);
  const cookieToken = cookies.get(ADMIN_CSRF_COOKIE);
  const headerToken = request.headers.get("x-csrf-token") || "";

  if (!cookieToken || !headerToken) {
    logAdminDebug("csrf_check_failed", { reason: "missing_token", url: request.url });
    return "Invalid CSRF token";
  }

  if (!timingSafeEqualStrings(cookieToken, headerToken)) {
    logAdminDebug("csrf_check_failed", { reason: "token_mismatch", url: request.url });
    return "Invalid CSRF token";
  }

  return null;
}

export function requireAdminRequest(request: Request): string | null {
  if (!isAdminConfigured()) {
    logAdminDebug("auth_check_failed", { reason: "admin_not_configured", url: request.url });
    return "Admin credentials are not configured.";
  }

  if (!isAuthorizedAdminRequest(request)) {
    logAdminDebug("auth_check_failed", { reason: "unauthorized", url: request.url });
    return "Unauthorized";
  }

  logAdminDebug("auth_check_passed", { url: request.url });

  return null;
}
