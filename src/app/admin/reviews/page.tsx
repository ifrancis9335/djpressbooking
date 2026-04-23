import { Metadata } from "next";
import { AdminReviewsRoute } from "../../../components/admin/routes/AdminReviewsRoute";

export const metadata: Metadata = {
  title: "Admin Reviews",
  description: "Reviews management workspace."
};

export default function AdminReviewsPage() {
  return <AdminReviewsRoute />;
}
