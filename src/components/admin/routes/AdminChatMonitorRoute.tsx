import { AdminWorkspacePage } from "../admin-workspace-page";
import { AdminChatMonitor } from "../dashboard/AdminChatMonitor";

export function AdminChatMonitorRoute() {
  return (
    <AdminWorkspacePage
      kicker="Chat"
      title="Chat Monitor"
      description="Monitor recent chat activity, booking-ready sessions, and timestamped conversation flow on a dedicated route."
    >
      <AdminChatMonitor />
    </AdminWorkspacePage>
  );
}
