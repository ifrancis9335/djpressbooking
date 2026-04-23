import { Metadata } from "next";
import { AdminGalleryRoute } from "../../../components/admin/routes/AdminGalleryRoute";

export const metadata: Metadata = {
  title: "Admin Gallery",
  description: "Gallery management workspace."
};

export default function AdminGalleryPage() {
  return <AdminGalleryRoute />;
}
