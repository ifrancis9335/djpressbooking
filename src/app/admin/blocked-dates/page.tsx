import { Metadata } from "next";
import { AdminBlockedDatesRoute } from "../../../components/admin/routes/AdminBlockedDatesRoute";

export const metadata: Metadata = {
  title: "Admin Blocked Dates",
  description: "Availability blocking workspace."
};

export default function AdminBlockedDatesPage() {
  return <AdminBlockedDatesRoute />;
}
