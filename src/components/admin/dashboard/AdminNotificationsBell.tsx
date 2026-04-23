"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 70, left: 16, width: 340 });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const recentNotifications = useMemo(() => notifications.slice(0, 5), [notifications]);

  const updatePanelPosition = useCallback(() => {
    if (!triggerRef.current || typeof window === "undefined") {
      return;
    }

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const viewportPadding = 16;
    const targetWidth = Math.min(340, Math.max(260, viewportWidth - viewportPadding * 2));
    const nextLeft = Math.min(
      Math.max(triggerRect.right - targetWidth, viewportPadding),
      viewportWidth - targetWidth - viewportPadding
    );
    const nextTop = Math.min(triggerRect.bottom + 12, viewportHeight - 120);

    setPanelPosition({ top: nextTop, left: nextLeft, width: targetWidth });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    updatePanelPosition();

    const onScrollOrResize = () => {
      updatePanelPosition();
    };

    window.addEventListener("resize", onScrollOrResize);
    document.addEventListener("scroll", onScrollOrResize, true);

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedPanel = panelRef.current?.contains(target);

      if (!clickedTrigger && !clickedPanel) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      document.removeEventListener("scroll", onScrollOrResize, true);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, updatePanelPosition]);

  const panel = open ? (
    <div
      ref={panelRef}
      id="admin-notifications-panel"
      className="fixed pointer-events-auto rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur"
      style={{
        top: panelPosition.top,
        left: panelPosition.left,
        width: panelPosition.width,
        maxWidth: "calc(100vw - 2rem)"
      }}
      role="dialog"
      aria-label="Notifications panel"
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <p className="text-sm font-semibold text-white">Notifications</p>
          <p className="text-xs text-slate-400">{unreadCount} unread</p>
        </div>
        <button type="button" className="text-xs text-slate-400 hover:text-white" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>

      <div className="mt-3 grid max-h-[70vh] gap-2 overflow-y-auto pr-1">
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
  ) : null;

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Notifications"
        aria-expanded={open}
        aria-controls="admin-notifications-panel"
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

      {mounted && panel
        ? createPortal(
            // Render into a body-level overlay so the panel always layers above route content and settings action panels.
            <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 2147483000 }}>
              {panel}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}