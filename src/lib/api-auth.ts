export function requireAdminApiKey(request: Request): string | null {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    return "Admin API key is not configured.";
  }

  const provided = request.headers.get("x-admin-key") ?? "";
  if (!provided || provided !== expected) {
    return "Unauthorized";
  }

  return null;
}
