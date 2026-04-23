import { Metadata } from "next";
import { AdminChatMonitorRoute } from "../../../components/admin/routes/AdminChatMonitorRoute";

export const metadata: Metadata = {
  title: "Admin Chat Monitor",
  description: "Chat monitoring workspace for recent sessions and booking readiness."
};

export default function AdminChatMonitorPage() {
  return <AdminChatMonitorRoute />;
}
