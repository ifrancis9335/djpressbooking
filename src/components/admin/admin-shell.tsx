"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { AdminNotificationsBell } from "./dashboard/AdminNotificationsBell";
import { AdminWorkspaceNav } from "./dashboard/AdminWorkspaceNav";
import type { AdminNotification } from "../../types/notification";
import { updateAdminBookingStatus } from "../../lib/admin/bookings-admin";
import { useAdminApp } from "./admin-app-context";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const {
    configured,
    authenticated,
    sessionLoading,
    authLoading,
    authError,
    authMessage,
    summary,
    summaryLoading,
    summaryError,
    notifications,
    unreadCount,
    connectionState,
    notificationsError,
    markAsRead,
    refreshSummary,
    login,
    logout
  } = useAdminApp();

  const openNotificationBooking = (notification: AdminNotification) => {
    void markAsRead(notification.id);
    router.push(`/admin/bookings?focus=${encodeURIComponent(notification.bookingId)}`);
  };

  const quickConfirmNotification = async (notification: AdminNotification) => {
    await updateAdminBookingStatus(notification.bookingId, "confirmed");
    await markAsRead(notification.id);
    await refreshSummary();
    router.push(`/admin/bookings?focus=${encodeURIComponent(notification.bookingId)}`);
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await login(password);
      setPassword("");
      await refreshSummary();
    } catch {
      // error state handled by context
    }
  };

  if (sessionLoading) {
    return (
      <main className="admin-shell-root admin-shell-standalone min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,194,80,0.16),_transparent_38%),linear-gradient(180deg,#07101c_0%,#040811_100%)]">
        <div className="container-width py-16">
          <section className="glass-panel p-6">
            <p className="section-kicker">Admin Module</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Loading admin workspace</h1>
            <p className="mt-3 text-sm text-slate-300">Checking session state and preparing route-level modules.</p>
          </section>
        </div>
      </main>
    );
  }

  if (!configured) {
    return (
      <main className="admin-shell-root admin-shell-standalone min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,194,80,0.16),_transparent_38%),linear-gradient(180deg,#07101c_0%,#040811_100%)]">
        <div className="container-width py-16">
          <section className="glass-panel max-w-2xl p-6">
            <p className="section-kicker">Admin Module</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Admin is not configured</h1>
            <p className="mt-3 text-sm text-slate-300">Set the required admin environment variables before using this workspace.</p>
          </section>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="admin-shell-root admin-shell-standalone min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,194,80,0.16),_transparent_38%),linear-gradient(180deg,#07101c_0%,#040811_100%)]">
        <div className="container-width py-16">
          <section className="glass-panel max-w-lg p-6">
            <p className="section-kicker">Admin Module</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Admin Sign In</h1>
            <p className="mt-3 text-sm text-slate-300">Use your admin password to access the route-based control center.</p>
            <form className="mt-5 grid gap-3" onSubmit={handleLogin}>
              <label className="field">
                <span className="field-label">Admin Password</span>
                <input
                  type="password"
                  className="field-input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              <button type="submit" className="btn-primary" disabled={authLoading}>
                {authLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>
            {authMessage ? <p className="status-ok mt-3">{authMessage}</p> : null}
            {authError ? <p className="status-bad mt-3">{authError}</p> : null}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="admin-shell admin-shell-root min-h-screen bg-[radial-gradient(circle_at_top,_rgba(244,194,80,0.12),_transparent_34%),linear-gradient(180deg,#06101b_0%,#040811_100%)]">
      <section className="relative layer-header border-b border-white/10 bg-[#050b15]/95 backdrop-blur">
        <div className="container-width py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="section-kicker">Admin Module</p>
              <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">Admin Control Center</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300">
                Route-isolated workspace for bookings, chat operations, trash retention, blocked dates, and site management.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-200">
                Internal Use Only
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${summary?.bookingEnabled ? "bg-emerald-500/15 text-emerald-200" : "bg-rose-500/15 text-rose-200"}`}>
                Booking {summary?.bookingEnabled ? "Enabled" : "Disabled"}
              </span>
              <AdminNotificationsBell
                notifications={notifications}
                unreadCount={unreadCount}
                connectionState={connectionState}
                onMarkAsRead={markAsRead}
                onOpenBooking={openNotificationBooking}
                onQuickConfirm={quickConfirmNotification}
              />
              <button type="button" className="btn-secondary md:w-auto" onClick={() => void logout()}>
                Sign Out
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className={`rounded-full px-3 py-1 ${connectionState === "live" ? "bg-emerald-500/15 text-emerald-200" : connectionState === "connecting" ? "bg-amber-500/15 text-amber-200" : "bg-slate-700 text-slate-300"}`}>
              Notifications: {connectionState === "live" ? "Live" : connectionState === "connecting" ? "Connecting" : "Disconnected"}
            </span>
            {summaryLoading ? <span className="rounded-full bg-white/5 px-3 py-1">Refreshing summary...</span> : null}
            {summaryError ? <span className="rounded-full bg-rose-500/15 px-3 py-1 text-rose-200">{summaryError}</span> : null}
            {notificationsError ? <span className="rounded-full bg-rose-500/15 px-3 py-1 text-rose-200">{notificationsError}</span> : null}
            <span className="rounded-full bg-white/5 px-3 py-1">Current route: {pathname}</span>
          </div>
        </div>
      </section>

      <div className="admin-shell-body">
        <div className="container-width admin-shell-frame py-6">
          <div className="admin-shell-layout grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="admin-shell-sidebar glass-panel p-4">
            <div className="sidebar-container">
              <div className="sidebar-top">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Modules</p>
              </div>

              <div className="sidebar-menu">
                <AdminWorkspaceNav />
              </div>

              <div className="sidebar-bottom border-t border-white/10">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Public Utilities</p>
                <div className="mt-3 grid gap-2">
                  <Link href="/" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:border-luxeGold/40 hover:bg-luxeGold/10">
                    Open Public Home
                  </Link>
                  <Link href="/booking" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:border-luxeGold/40 hover:bg-luxeGold/10">
                    Open Public Booking Page
                  </Link>
                  <Link href="/gallery" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:border-luxeGold/40 hover:bg-luxeGold/10">
                    Open Gallery Page
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          <div className="admin-shell-viewport min-w-0 min-h-0">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}
