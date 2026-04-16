"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminActivity } from "../../../types/admin-activity";

interface AdminActivityFeedProps {
  enabled: boolean;
}

function parseResponse<T>(response: Response): Promise<T> {
  return response.json().then((payload) => {
    if (!response.ok) {
      const message = payload && typeof payload === "object" && "message" in payload ? String(payload.message || "") : "";
      throw new Error(message || "Request failed");
    }

    return payload as T;
  });
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function getBadgeClasses(action: AdminActivity["action"]) {
  switch (action) {
    case "booking_created":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    case "booking_status_updated":
      return "border-luxeGold/40 bg-luxeGold/10 text-luxeGold";
    case "internal_note_added":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
    case "direct_email_sent":
      return "border-sky-500/30 bg-sky-500/10 text-sky-200";
    case "customer_reply_received":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    default:
      return "border-white/10 bg-white/5 text-slate-200";
  }
}

function toActionLabel(action: AdminActivity["action"]) {
  switch (action) {
    case "booking_created":
      return "New Inquiry";
    case "booking_status_updated":
      return "Status Update";
    case "thread_message_sent":
      return "Admin Message";
    case "internal_note_added":
      return "Internal Note";
    case "customer_reply_received":
      return "Customer Reply";
    case "direct_email_sent":
      return "Direct Email";
    default:
      return "Activity";
  }
}

export function AdminActivityFeed({ enabled }: AdminActivityFeedProps) {
  const [activity, setActivity] = useState<AdminActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActivity = useCallback(async (options?: { silent?: boolean }) => {
    if (!enabled) {
      return;
    }

    const silent = options?.silent ?? false;
    if (silent) {
      setPolling(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch("/api/admin/activity?limit=12", { cache: "no-store" });
      const payload = await parseResponse<{ activity: AdminActivity[] }>(response);
      setActivity(payload.activity || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load recent activity");
    } finally {
      setLoading(false);
      setPolling(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    void loadActivity();
  }, [enabled, loadActivity]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadActivity({ silent: true });
    }, 12000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, loadActivity]);

  const emptyState = useMemo(() => (!loading && activity.length === 0 ? "No activity logged yet." : null), [activity.length, loading]);

  return (
    <section id="activity-feed" className="glass-panel p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Recent Booking Activity</h3>
          <p className="mt-1 text-sm text-slate-300">Live command-center view of booking operations across the admin side.</p>
        </div>
        <button type="button" className="btn-secondary md:w-auto" onClick={() => void loadActivity()} disabled={loading || !enabled}>
          {loading ? "Refreshing..." : "Refresh Activity"}
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {loading && activity.length === 0 ? <p className="text-sm text-slate-300">Loading activity...</p> : null}
        {emptyState ? <p className="text-sm text-slate-400">{emptyState}</p> : null}
        {activity.map((item) => (
          <article key={item.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <div className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${getBadgeClasses(item.action)}`}>
                  {toActionLabel(item.action)}
                </div>
                <p className="mt-3 text-sm font-semibold text-white">{item.summary}</p>
                <p className="mt-1 text-xs text-slate-400">
                  Booking {item.bookingId}
                  {item.customerName ? ` • ${item.customerName}` : ""}
                  {item.eventDate ? ` • ${item.eventDate}` : ""}
                </p>
              </div>
              <p className="text-xs text-slate-500">{formatTimestamp(item.createdAt)}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>{polling ? "Checking for new activity..." : "Auto-refreshing every 12s"}</span>
      </div>
      {error ? <p className="status-bad mt-3">{error}</p> : null}
    </section>
  );
}