import { DashboardSummary } from "./types";

interface DashboardSummaryCardsProps {
  summary: DashboardSummary | null;
}

export function DashboardSummaryCards({ summary }: DashboardSummaryCardsProps) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <article className="premium-card p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Total Bookings</p><p className="mt-2 text-xl font-bold text-white">{summary?.totalBookings ?? "-"}</p></article>
      <article className="premium-card p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Needs Response</p><p className="mt-2 text-xl font-bold text-white">{summary?.bookingsAwaitingResponse ?? "-"}</p></article>
      <article className="premium-card p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Upcoming Confirmed</p><p className="mt-2 text-xl font-bold text-white">{summary?.upcomingConfirmedBookings ?? "-"}</p></article>
      <article className="premium-card p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Recent Activity</p><p className="mt-2 text-xl font-bold text-white">{summary?.recentActivityCount ?? "-"}</p></article>
      <article className="premium-card p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Total Blocked Dates</p><p className="mt-2 text-xl font-bold text-white">{summary?.totalBlockedDates ?? "-"}</p></article>
      <article className="premium-card p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Next Blocked Date</p><p className="mt-2 text-xl font-bold text-white">{summary?.nextBlockedDate || "None"}</p></article>
      <article className="premium-card p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Public Phone</p><p className="mt-2 text-sm font-bold text-white">{summary?.publicPhoneNumber || "-"}</p></article>
      <article className="premium-card p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Public Email</p><p className="mt-2 text-sm font-bold text-white">{summary?.publicEmail || "-"}</p></article>
      <article className="premium-card p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Booking Status</p><p className="mt-2 text-xl font-bold text-white">{summary?.bookingEnabled ? "Enabled" : "Disabled"}</p></article>
    </div>
  );
}

