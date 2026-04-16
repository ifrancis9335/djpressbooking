import { getNotificationsQuery, toAdminNotification } from "../../../../../lib/notifications/store";
import { requireAdminRequest } from "../../../../../lib/admin-auth";
import { AdminNotification } from "../../../../../types/notification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildSnapshotPayload(notifications: AdminNotification[]) {
  return {
    notifications,
    unreadCount: notifications.filter((item) => !item.read).length
  };
}

export async function GET(request: Request) {
  const authError = requireAdminRequest(request);
  if (authError) {
    return new Response(JSON.stringify({ message: authError }), {
      status: authError === "Unauthorized" ? 401 : 503,
      headers: { "Content-Type": "application/json" }
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let heartbeatId: ReturnType<typeof setInterval> | null = null;
      let unsubscribe: (() => void) | null = null;

      const sendEvent = (event: string, payload: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`));
      };

      sendEvent("ready", { ok: true });

      unsubscribe = getNotificationsQuery().onSnapshot(
        (snapshot) => {
          const notifications = snapshot.docs.map((doc) =>
            toAdminNotification(doc.id, doc.data() as Partial<AdminNotification>)
          );
          sendEvent("snapshot", buildSnapshotPayload(notifications));
        },
        (error) => {
          sendEvent("error", { message: error.message });
        }
      );

      heartbeatId = setInterval(() => {
        sendEvent("ping", { ts: Date.now() });
      }, 20000);

      const cleanup = () => {
        if (heartbeatId) {
          clearInterval(heartbeatId);
          heartbeatId = null;
        }
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
        controller.close();
      };

      request.signal.addEventListener("abort", cleanup, { once: true });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}