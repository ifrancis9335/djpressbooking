import { ReactNode } from "react";
import { AdminAppProvider } from "../../components/admin/admin-app-context";
import { AdminShell } from "../../components/admin/admin-shell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAppProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAppProvider>
  );
}
