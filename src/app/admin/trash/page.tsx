import { Metadata } from "next";
import { AdminTrashRoute } from "../../../components/admin/routes/AdminTrashRoute";

export const metadata: Metadata = {
  title: "Admin Trash",
  description: "Trash retention and permanent deletion workspace."
};

export default function AdminTrashPage() {
  return <AdminTrashRoute />;
}
