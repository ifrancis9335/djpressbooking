import { ReactNode } from "react";
import { DashboardSummary } from "./types";
import { DashboardSummaryCards } from "./DashboardSummaryCards";

interface AdminDashboardShellProps {
  summary: DashboardSummary | null;
  quickLinks: Array<{ href: string; label: string }>;
  onLogout: () => void;
  children: ReactNode;
  loading: boolean;
  notificationBell?: ReactNode;
}

export function AdminDashboardShell({ summary, quickLinks, onLogout, children, loading, notificationBell }: AdminDashboardShellProps) {
  return (
    <div className="mt-6 grid gap-5">
      <section className="glass-panel p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Dashboard Home</h2>
            <p className="mt-1 text-sm text-slate-300">Manage key settings and live public values.</p>
          </div>
          <div className="flex items-center gap-3">
            {notificationBell}
            <button type="button" className="btn-secondary md:w-auto" onClick={onLogout}>Sign Out</button>
          </div>
        </div>

        <DashboardSummaryCards summary={summary} />

        <div className="mt-4 flex flex-wrap gap-2">
          {quickLinks.map((item) => (
            <a key={item.href} href={item.href} className="btn-ghost">{item.label}</a>
          ))}
        </div>
      </section>

      {children}

      {loading ? <p className="text-sm text-slate-300">Loading admin data...</p> : null}
    </div>
  );
}
