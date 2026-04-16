"use client";

import { useMemo, useState } from "react";
import { AdminNotification } from "../../../types/notification";

interface AdminNotificationsBellProps {
  notifications: AdminNotification[];
  unreadCount: number;
  connectionState: "connecting" | "live" | "disconnected";
  onMarkAsRead: (id: string) => Promise<void> | void;
  onOpenBooking: (notification: AdminNotification) => void;
  onQuickConfirm: (notification: AdminNotification) => Promise<void> | void;
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

export function AdminNotificationsBell({
  notifications,
  unreadCount,
  connectionState,
  onMarkAsRead,
  onOpenBooking,
  onQuickConfirm
}: AdminNotificationsBellProps) {
  const [open, setOpen] = useState(false);
  const recentNotifications = useMemo(() => notifications.slice(0, 5), [notifications]);

  return (
    <div className="relative">
      <button
        type="button"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 min-w-[1.25rem] rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      <span
        className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-slate-950 ${connectionState === "live" ? "bg-emerald-400" : connectionState === "connecting" ? "bg-amber-400" : "bg-slate-500"}`}
      />

      {open ? (
        <div className="absolute right-0 z-20 mt-3 w-[340px] rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <p className="text-sm font-semibold text-white">Notifications</p>
              <p className="text-xs text-slate-400">{unreadCount} unread</p>
            </div>
            <button type="button" className="text-xs text-slate-400 hover:text-white" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>

          <div className="mt-3 grid gap-2">
            {recentNotifications.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-sm text-slate-300">No notifications yet.</p>
            ) : (
              recentNotifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`rounded-xl border p-3 ${notification.read ? "border-white/10 bg-white/5" : "border-amber-400/30 bg-amber-500/10"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button type="button" className="flex-1 text-left" onClick={() => {
                      onOpenBooking(notification);
                      setOpen(false);
                    }}>
                      <p className="text-sm font-semibold text-white">New booking: {notification.name}</p>
                      <p className="mt-1 text-xs text-slate-300">Event date: {notification.date}</p>
                      <p className="mt-1 text-xs text-slate-400">{formatTimestamp(notification.timestamp)}</p>
                    </button>
                    <div className="flex flex-col items-end gap-2">
                      <button type="button" className="text-xs font-semibold text-luxeGold hover:text-white" onClick={() => void onQuickConfirm(notification)}>
                        Quick confirm
                      </button>
                      {!notification.read ? (
                        <button type="button" className="text-xs font-semibold text-amber-200 hover:text-white" onClick={() => void onMarkAsRead(notification.id)}>
                          Mark read
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}