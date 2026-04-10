import { Metadata } from "next";
import { AdminDashboard } from "../../components/admin/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Manage blocked dates, contact info, package pricing, and booking settings."
};

export default function AdminPage() {
  return (
    <main className="section-shell">
      <div className="container-width">
        <p className="section-kicker">Control Center</p>
        <h1 className="text-3xl font-bold text-white md:text-4xl">DJ Press Admin</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Secure dashboard to manage blocked dates, contact details, package pricing, and booking availability.
        </p>
        <AdminDashboard />
      </div>
    </main>
  );
}
