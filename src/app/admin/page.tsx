import { Metadata } from "next";
import { AdminOverviewRoute } from "../../components/admin/routes/AdminOverviewRoute";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Overview, health, and navigation for the admin control center."
};

export default function AdminPage() {
  return <AdminOverviewRoute />;
}
