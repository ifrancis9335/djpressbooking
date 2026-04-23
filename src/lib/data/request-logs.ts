import { FieldValue } from "firebase-admin/firestore";
import { getServerFirestore, isFirebaseAdminConfigured } from "../firebase/admin";

export interface ApiRequestLogInput {
  requestId: string;
  domain: string;
  action: string;
  method: string;
  path: string;
  statusCode: number;
  metadata?: Record<string, unknown>;
}

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const first = forwarded.split(",")[0]?.trim();

  if (first) {
    return first;
  }

  return request.headers.get("x-real-ip") || "unknown";
}

function shouldPersistRequestLogs() {
  return process.env.REQUEST_LOG_PERSISTENCE?.trim().toLowerCase() === "firestore";
}

function sanitizeMetadata(metadata?: Record<string, unknown>) {
  if (!metadata) {
    return undefined;
  }

  try {
    return JSON.parse(JSON.stringify(metadata)) as Record<string, unknown>;
  } catch {
    return { note: "metadata_not_serializable" };
  }
}

export async function writeRequestLog(request: Request, input: ApiRequestLogInput) {
  const record = {
    requestId: input.requestId,
    domain: input.domain,
    action: input.action,
    method: input.method,
    path: input.path,
    statusCode: input.statusCode,
    ip: getClientIp(request),
    metadata: sanitizeMetadata(input.metadata)
  };

  console.info("[api] request", record);

  if (!shouldPersistRequestLogs() || !isFirebaseAdminConfigured()) {
    return;
  }

  try {
    await getServerFirestore().collection("request_logs").add({
      ...record,
      createdAt: FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("[api] request_log_failed", {
      requestId: input.requestId,
      domain: input.domain,
      action: input.action,
      message: error instanceof Error ? error.message : String(error)
    });
  }
}