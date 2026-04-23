import { Metadata } from "next";
import { AdminSiteSettingsRoute } from "../../../components/admin/routes/AdminSiteSettingsRoute";

export const metadata: Metadata = {
  title: "Admin Site Settings",
  description: "Global site settings and content workspace."
};

export default function AdminSiteSettingsPage() {
  return <AdminSiteSettingsRoute />;
}
