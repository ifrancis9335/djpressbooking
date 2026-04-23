"use client";

import Link from "next/link";
import { useAdminApp } from "../admin-app-context";
import { AdminWorkspacePage } from "../admin-workspace-page";
import { DashboardSummaryCards } from "../dashboard/DashboardSummaryCards";

const quickActions = [
  { href: "/admin/bookings", label: "Open Bookings" },
  { href: "/admin/trash", label: "Open Trash" },
  { href: "/admin/chat-monitor", label: "Open Chat Monitor" },
  { href: "/admin/blocked-dates", label: "Manage Blocked Dates" },
  { href: "/admin/site-settings", label: "Open Site Settings" }
];

export function AdminOverviewRoute() {
  const { summary, summaryLoading, summaryError, unreadCount, connectionState } = useAdminApp();

  return (
    <AdminWorkspacePage
      kicker="Dashboard"
      title="Overview Only"
      description="This dashboard is intentionally limited to health, summary, and navigation. Operational workspaces live on their own admin routes."
      actions={quickActions.map((action) => (
        <Link key={action.href} href={action.href} className="btn-ghost">
          {action.label}
        </Link>
      ))}
    >
      <section className="glass-panel p-5 md:p-6">
        <div className="grid gap-3 lg:grid-cols-3">
          <article className="premium-card p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Notification Stream</p>
            <p className="mt-2 text-xl font-bold text-white">{connectionState === "live" ? "Live" : connectionState === "connecting" ? "Connecting" : "Disconnected"}</p>
            <p className="mt-1 text-sm text-slate-300">Unread notifications: {unreadCount}</p>
          </article>
          <article className="premium-card p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Booking Intake</p>
            <p className="mt-2 text-xl font-bold text-white">{summary?.bookingEnabled ? "Enabled" : "Disabled"}</p>
            <p className="mt-1 text-sm text-slate-300">Public booking availability status</p>
          </article>
          <article className="premium-card p-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Public Contact</p>
            <p className="mt-2 break-words text-xl font-bold text-white">{summary?.publicPhoneNumber || "-"}</p>
            <p className="mt-1 break-words text-sm text-slate-300">{summary?.publicEmail || "-"}</p>
          </article>
        </div>

        {summaryLoading ? <p className="mt-4 text-sm text-slate-300">Loading dashboard summary...</p> : null}
        {summaryError ? <p className="status-bad mt-4">{summaryError}</p> : null}
        {!summaryLoading && !summaryError ? <DashboardSummaryCards summary={summary} /> : null}
      </section>
    </AdminWorkspacePage>
  );
}
