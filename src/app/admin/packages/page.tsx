import { Metadata } from "next";
import { AdminPackagesRoute } from "../../../components/admin/routes/AdminPackagesRoute";

export const metadata: Metadata = {
  title: "Admin Packages",
  description: "Packages pricing and content workspace."
};

export default function AdminPackagesPage() {
  return <AdminPackagesRoute />;
}
