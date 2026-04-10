import crypto from "crypto";

export const ADMIN_SESSION_COOKIE = "dj_admin_session";

function getAdminSecret() {
  return process.env.ADMIN_API_KEY || process.env.ADMIN_PASSWORD || "";
}

function hashSecret(secret: string) {
  return crypto.createHash("sha256").update(secret).digest("hex");
}

export function isAdminConfigured() {
  return Boolean(getAdminSecret());
}

export function validateAdminPassword(input: string) {
  const expected = getAdminSecret();
  if (!expected) return false;
  return input === expected;
}

export function buildAdminSessionValue() {
  const secret = getAdminSecret();
  if (!secret) return "";
  return hashSecret(secret);
}

export function isValidAdminSessionValue(value: string | undefined) {
  if (!value) return false;
  const expected = buildAdminSessionValue();
  return Boolean(expected) && value === expected;
}

export function isAuthorizedAdminRequest(request: Request) {
  const secret = getAdminSecret();
  if (!secret) {
    return false;
  }

  const providedHeader = request.headers.get("x-admin-key") || "";
  if (providedHeader === secret) {
    return true;
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const expectedSession = buildAdminSessionValue();
  if (!expectedSession) {
    return false;
  }

  return cookieHeader.split(";").some((cookiePart) => {
    const [name, ...valueParts] = cookiePart.trim().split("=");
    if (name !== ADMIN_SESSION_COOKIE) {
      return false;
    }
    const value = valueParts.join("=");
    return value === expectedSession;
  });
}

export function requireAdminRequest(request: Request): string | null {
  if (!isAdminConfigured()) {
    return "Admin credentials are not configured.";
  }

  if (!isAuthorizedAdminRequest(request)) {
    return "Unauthorized";
  }

  return null;
}
