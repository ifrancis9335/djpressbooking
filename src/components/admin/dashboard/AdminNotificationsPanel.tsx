import { AdminNotification } from "../../../types/notification";

interface AdminNotificationsPanelProps {
  notifications: AdminNotification[];
  unreadCount: number;
  connectionState: "connecting" | "live" | "disconnected";
  error: string | null;
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

export function AdminNotificationsPanel({
  notifications,
  unreadCount,
  connectionState,
  error,
  onMarkAsRead,
  onOpenBooking,
  onQuickConfirm
}: AdminNotificationsPanelProps) {
  return (
    <section id="notifications" className="glass-panel p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Notifications</h3>
          <p className="mt-1 text-sm text-slate-300">Real booking notifications streamed from Firestore.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Unread: {unreadCount}</span>
          <span className={`rounded-full px-3 py-1 ${connectionState === "live" ? "bg-emerald-500/15 text-emerald-200" : connectionState === "connecting" ? "bg-amber-500/15 text-amber-200" : "bg-slate-500/15 text-slate-300"}`}>
            {connectionState === "live" ? "Live updates" : connectionState === "connecting" ? "Connecting" : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {notifications.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-4 text-sm text-slate-300">No booking notifications yet.</p>
        ) : (
          notifications.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-xl border p-4 ${notification.read ? "border-white/10 bg-white/5" : "border-luxeGold/35 bg-luxeGold/10"}`}
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <button type="button" className="text-left" onClick={() => onOpenBooking(notification)}>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-white">New Booking</p>
                    {!notification.read ? <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-950">New</span> : null}
                  </div>
                  <p className="mt-2 text-base font-semibold text-white">{notification.name}</p>
                  <p className="mt-1 text-sm text-slate-300">Event date: {notification.date}</p>
                  <p className="mt-1 text-xs text-slate-400">Booking ID: {notification.bookingId}</p>
                  <p className="mt-1 text-xs text-slate-400">Received: {formatTimestamp(notification.timestamp)}</p>
                </button>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="btn-primary md:w-auto" onClick={() => void onQuickConfirm(notification)}>
                    Quick Confirm
                  </button>
                  {!notification.read ? (
                    <button type="button" className="btn-secondary md:w-auto" onClick={() => void onMarkAsRead(notification.id)}>
                      Mark as Read
                    </button>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {error ? <p className="status-bad mt-3">{error}</p> : null}
    </section>
  );
}