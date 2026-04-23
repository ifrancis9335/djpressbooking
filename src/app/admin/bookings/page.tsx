import { Metadata } from "next";
import { AdminBookingsRoute } from "../../../components/admin/routes/AdminBookingsRoute";

export const metadata: Metadata = {
  title: "Admin Bookings",
  description: "Active booking operations workspace."
};

export default function AdminBookingsPage() {
  return <AdminBookingsRoute />;
}
