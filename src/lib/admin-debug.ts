interface DebugPayload {
  [key: string]: unknown;
}

function shouldLogAdminDebug() {
  return process.env.ADMIN_DEBUG === "true" || process.env.NODE_ENV !== "production";
}

export function logAdminDebug(event: string, payload?: DebugPayload) {
  if (!shouldLogAdminDebug()) {
    return;
  }

  if (payload) {
    console.info("[admin-debug]", event, payload);
    return;
  }

  console.info("[admin-debug]", event);
}

export function logAdminDebugError(event: string, error: unknown, payload?: DebugPayload) {
  if (!shouldLogAdminDebug()) {
    return;
  }

  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  console.error("[admin-debug]", event, { ...(payload || {}), error: errorMessage });
}