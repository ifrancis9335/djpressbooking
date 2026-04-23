"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Booking, BookingStatus } from "../../../types/booking";
import {
  deleteAdminBookingForever,
  fetchAdminBookings,
  purgeAdminTestTrash,
  purgeExpiredAdminTrash,
  restoreAdminBooking,
  softDeleteAdminBooking,
  updateAdminBookingStatus
} from "../../../lib/admin/bookings-admin";
import { SiteContent } from "../../../types/site-content";
import { SiteSettings } from "../../../types/site-settings";
import { AdminBookingThread } from "./AdminBookingThread";
import { AdminDirectEmailComposer } from "./AdminDirectEmailComposer";

interface Toast {
  id: number;
  message: string;
  kind: "ok" | "bad";
}

interface ConfirmModalProps {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface BookingFocusRequest {
  bookingId: string;
  token: number;
}

interface AdminBookingsWorkspaceProps {
  settings: SiteSettings;
  content: SiteContent;
  focusRequest?: BookingFocusRequest | null;
  refreshToken?: number;
  onBookingMutation?: () => void;
  viewMode?: "all" | "active" | "trash";
}

type TimeFilter = "upcoming" | "all";
type ActiveStatusFilter = "all" | "pending" | "confirmed";
type TrashFilter = "all" | "expiring_soon" | "expired" | "test";
type PendingAction =
  | { type: "delete"; bookingId: string }
  | { type: "deleteForever"; bookingId: string }
  | null;

let toastSequence = 0;

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const add = useCallback(
    (message: string, kind: Toast["kind"] = "ok") => {
      const id = ++toastSequence;
      setToasts((prev) => [...prev.slice(-4), { id, message, kind }]);
      const timer = setTimeout(() => dismiss(id), 3500);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  useEffect(() => {
    const registry = timers.current;
    return () => {
      registry.forEach(clearTimeout);
    };
  }, []);

  return { toasts, add, dismiss };
}

function ConfirmModal({ message, confirmLabel, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="glass-panel w-full max-w-sm p-6 shadow-2xl">
        <p className="text-base font-semibold text-white">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" className="btn-secondary md:w-auto" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded border border-rose-500/60 bg-rose-600/80 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-500 md:w-auto"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function toDisplayStatus(status: BookingStatus) {
  if (status === "awaiting_response") return "Awaiting Response";
  if (status === "pending_deposit") return "Reviewed";
  if (status === "cancelled") return "Declined";
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function localTodayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function isPendingStatus(status: BookingStatus) {
  return status === "new" || status === "awaiting_response" || status === "pending_deposit";
}

function isExpiringSoon(booking: Booking) {
  if (!booking.purgeAt) {
    return false;
  }

  const purgeAtMs = new Date(booking.purgeAt).getTime();
  const now = Date.now();
  if (Number.isNaN(purgeAtMs) || purgeAtMs <= now) {
    return false;
  }

  const sevenDaysMs = 1000 * 60 * 60 * 24 * 7;
  return purgeAtMs - now <= sevenDaysMs;
}

function isExpiredTrash(booking: Booking) {
  if (!booking.purgeAt) {
    return false;
  }

  const purgeAtMs = new Date(booking.purgeAt).getTime();
  return !Number.isNaN(purgeAtMs) && purgeAtMs <= Date.now();
}

function getPurgeDeadline(booking: Booking) {
  if (booking.purgeAt) {
    const purgeAtMs = new Date(booking.purgeAt).getTime();
    if (!Number.isNaN(purgeAtMs)) {
      return purgeAtMs;
    }
  }

  if (!booking.deletedAt) {
    return null;
  }

  const deletedAtMs = new Date(booking.deletedAt).getTime();
  if (Number.isNaN(deletedAtMs)) {
    return null;
  }

  return deletedAtMs + 30 * 24 * 60 * 60 * 1000;
}

function getPurgeCountdownLabel(booking: Booking) {
  const purgeDeadlineMs = getPurgeDeadline(booking);
  if (!purgeDeadlineMs) {
    return "Will be permanently deleted on the retention deadline";
  }

  const remainingMs = purgeDeadlineMs - Date.now();
  if (remainingMs <= 0) {
    return "Will be permanently deleted today";
  }

  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  return `Will be permanently deleted in ${remainingDays} day${remainingDays === 1 ? "" : "s"}`;
}

export function AdminBookingsWorkspace({ settings, content, focusRequest = null, refreshToken = 0, onBookingMutation, viewMode = "all" }: AdminBookingsWorkspaceProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [bulkActionLoading, setBulkActionLoading] = useState<null | "purge_expired" | "purge_test">(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("upcoming");
  const [dateFilter, setDateFilter] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState<ActiveStatusFilter>("all");
  const [trashFilter, setTrashFilter] = useState<TrashFilter>("all");
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const { toasts, add: addToast, dismiss: dismissToast } = useToasts();

  const packageNameMap = useMemo(() => {
    const map = new Map<string, string>();
    map.set("basic", settings.packages.basic.name || "Basic");
    map.set("premium", settings.packages.premium.name || "Premium");
    map.set("vip", settings.packages.vip.name || "Luxury / VIP");

    content.packages.forEach((item) => {
      if (item.id?.trim() && item.name?.trim()) {
        map.set(item.id.trim().toLowerCase(), item.name.trim());
      }
    });

    return map;
  }, [content.packages, settings.packages.basic.name, settings.packages.premium.name, settings.packages.vip.name]);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await fetchAdminBookings({ includeDeleted: true });
      setBookings(payload.bookings || []);
    } catch (loadError) {
      addToast(loadError instanceof Error ? loadError.message : "Unable to load bookings", "bad");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const updateStatus = async (bookingId: string, status: BookingStatus, successLabel: string) => {
    setSavingId(bookingId);
    setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? { ...booking, status } : booking)));

    try {
      const payload = await updateAdminBookingStatus(bookingId, status);
      setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? payload.booking : booking)));
      addToast(successLabel, "ok");
      onBookingMutation?.();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to update booking status", "bad");
      void loadBookings();
    } finally {
      setSavingId(null);
    }
  };

  const softDeleteBooking = async (bookingId: string) => {
    setPendingAction(null);
    setSavingId(bookingId);
    const optimisticDeletedAt = new Date().toISOString();
    const optimisticPurgeAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              isDeleted: true,
              deletedAt: optimisticDeletedAt,
              deletedBy: "admin",
              purgeAt: optimisticPurgeAt,
              deletionReason: booking.deletionReason ?? null
            }
          : booking
      )
    );

    try {
      const payload = await softDeleteAdminBooking(bookingId);
      setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? payload.booking : booking)));
      addToast("Booking moved to Trash", "ok");
      onBookingMutation?.();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to delete booking", "bad");
      void loadBookings();
    } finally {
      setSavingId(null);
    }
  };

  const restoreDeletedBooking = async (bookingId: string) => {
    setSavingId(bookingId);
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId
          ? { ...booking, isDeleted: false, deletedAt: null, deletedBy: null, purgeAt: null, deletionReason: null }
          : booking
      )
    );

    try {
      const payload = await restoreAdminBooking(bookingId);
      setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? payload.booking : booking)));
      addToast("Booking restored", "ok");
      onBookingMutation?.();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to restore booking", "bad");
      void loadBookings();
    } finally {
      setSavingId(null);
    }
  };

  const deleteForever = async (bookingId: string) => {
    setPendingAction(null);
    setSavingId(bookingId);
    const previous = bookings;
    setBookings((prev) => prev.filter((booking) => booking.id !== bookingId));

    try {
      await deleteAdminBookingForever(bookingId);
      addToast("Booking permanently deleted", "ok");
      onBookingMutation?.();
    } catch (error) {
      setBookings(previous);
      addToast(error instanceof Error ? error.message : "Unable to permanently delete booking", "bad");
      void loadBookings();
    } finally {
      setSavingId(null);
    }
  };

  const purgeExpiredTrash = async () => {
    setBulkActionLoading("purge_expired");
    try {
      const payload = await purgeExpiredAdminTrash();
      addToast(payload.message, "ok");
      await loadBookings();
      onBookingMutation?.();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to purge expired trash", "bad");
    } finally {
      setBulkActionLoading(null);
    }
  };

  const purgeDeletedTestBookings = async () => {
    setBulkActionLoading("purge_test");
    try {
      const payload = await purgeAdminTestTrash();
      addToast(payload.message, "ok");
      await loadBookings();
      onBookingMutation?.();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to purge deleted test bookings", "bad");
    } finally {
      setBulkActionLoading(null);
    }
  };

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (refreshToken === 0) {
      return;
    }
    void loadBookings();
  }, [loadBookings, refreshToken]);

  const activeBookings = useMemo(() => {
    const todayIso = localTodayIso();
    return bookings.filter((booking) => {
      if (booking.isDeleted) {
        return false;
      }

      if (timeFilter === "upcoming" && booking.eventDate < todayIso) {
        return false;
      }

      if (dateFilter && booking.eventDate !== dateFilter) {
        return false;
      }

      if (activeStatusFilter === "pending") {
        return isPendingStatus(booking.status);
      }

      if (activeStatusFilter === "confirmed") {
        return booking.status === "confirmed";
      }

      return true;
    });
  }, [activeStatusFilter, bookings, dateFilter, timeFilter]);

  const trashedBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (!booking.isDeleted) {
        return false;
      }

      if (trashFilter === "expiring_soon") {
        return isExpiringSoon(booking);
      }

      if (trashFilter === "expired") {
        return isExpiredTrash(booking);
      }

      if (trashFilter === "test") {
        return Boolean(booking.isTestBooking);
      }

      return true;
    });
  }, [bookings, trashFilter]);

  const trashStats = useMemo(() => {
    const deleted = bookings.filter((booking) => booking.isDeleted);
    return {
      total: deleted.length,
      expiringSoon: deleted.filter(isExpiringSoon).length,
      expired: deleted.filter(isExpiredTrash).length,
      test: deleted.filter((booking) => booking.isTestBooking).length
    };
  }, [bookings]);

  useEffect(() => {
    if (!focusRequest) {
      return;
    }

    const targetBooking = bookings.find((booking) => booking.id === focusRequest.bookingId);
    if (!targetBooking) {
      void loadBookings();
      return;
    }

    setTimeFilter("all");
    setDateFilter(targetBooking.eventDate);
    setActiveStatusFilter(targetBooking.isDeleted ? "all" : isPendingStatus(targetBooking.status) ? "pending" : targetBooking.status === "confirmed" ? "confirmed" : "all");
    if (targetBooking.isDeleted) {
      setTrashFilter("all");
    }
    setHighlightedBookingId(targetBooking.id);
  }, [bookings, focusRequest, loadBookings]);

  useEffect(() => {
    if (!highlightedBookingId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHighlightedBookingId((current) => (current === highlightedBookingId ? null : current));
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [highlightedBookingId]);

  const renderBookingCard = (booking: Booking, mode: "active" | "trash") => {
    const packageId = booking.packageId?.trim() || "";
    const packageLabel = packageId ? packageNameMap.get(packageId.toLowerCase()) || packageId : "-";
    const isSaving = savingId === booking.id;
    const isDeleted = Boolean(booking.isDeleted);

    return (
      <article
        key={booking.id}
        id={`booking-${booking.id}`}
        className={`rounded-xl border p-4 transition ${isDeleted ? "border-rose-500/20 bg-rose-950/20" : highlightedBookingId === booking.id ? "border-luxeGold bg-luxeGold/10 shadow-[0_0_0_1px_rgba(244,194,80,0.35)]" : "border-white/10 bg-white/5"}`}
      >
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Booking ID</p>
            <p className="mt-1 break-all text-sm font-semibold text-white">{booking.id}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Name</p>
            <p className="mt-1 text-sm font-semibold text-white">{booking.fullName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Email</p>
            <p className="mt-1 break-all text-sm font-semibold text-white">{booking.email}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Phone</p>
            <p className="mt-1 text-sm font-semibold text-white">{booking.phone}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Event Type</p>
            <p className="mt-1 text-sm font-semibold text-white">{booking.eventType}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Event Date</p>
            <p className="mt-1 text-sm font-semibold text-white">{booking.eventDate}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Package</p>
            <p className="mt-1 text-sm font-semibold text-white">{packageLabel}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Preferred Contact</p>
            <p className="mt-1 text-sm font-semibold text-white">{booking.preferredContactMethod}</p>
          </div>
          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-wider text-slate-400">Notes</p>
            <p className="mt-1 text-sm text-slate-200">{booking.specialNotes?.trim() || "-"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Status</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-white">{toDisplayStatus(booking.status)}</span>
              {isDeleted ? <span className="rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-200">Deleted</span> : null}
              {booking.isTestBooking ? <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">Test</span> : null}
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-400">Created</p>
            <p className="mt-1 text-sm font-semibold text-white">{formatDateTime(booking.createdAt)}</p>
          </div>
        </div>

        {isDeleted ? (
          <div className="mt-4 grid gap-2 rounded-xl border border-rose-500/15 bg-black/15 p-3 text-xs text-slate-300 md:grid-cols-4">
            <div>
              <p className="uppercase tracking-wider text-slate-500">Deleted At</p>
              <p className="mt-1 text-sm text-white">{formatDateTime(booking.deletedAt)}</p>
            </div>
            <div>
              <p className="uppercase tracking-wider text-slate-500">Purge At</p>
              <p className="mt-1 text-sm text-white">{formatDateTime(booking.purgeAt)}</p>
            </div>
            <div>
              <p className="uppercase tracking-wider text-slate-500">Deleted By</p>
              <p className="mt-1 text-sm text-white">{booking.deletedBy || "admin"}</p>
            </div>
            <div>
              <p className="uppercase tracking-wider text-slate-500">Source</p>
              <p className="mt-1 text-sm text-white">{booking.source || "public"}</p>
            </div>
            <div className="md:col-span-4">
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] font-semibold text-amber-200">
                {getPurgeCountdownLabel(booking)}
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          {mode === "active" ? (
            <>
              <button
                type="button"
                className="btn-secondary md:w-auto"
                disabled={isSaving}
                onClick={() => void updateStatus(booking.id, "awaiting_response", "Status updated")}
              >
                Mark Pending
              </button>
              <button
                type="button"
                className="btn-primary md:w-auto"
                disabled={isSaving}
                onClick={() => void updateStatus(booking.id, "confirmed", "Booking confirmed")}
              >
                Confirm
              </button>
              <button
                type="button"
                className="btn-secondary md:w-auto"
                disabled={isSaving}
                onClick={() => void updateStatus(booking.id, "pending_deposit", "Status updated")}
              >
                Mark Reviewed
              </button>
              <button
                type="button"
                className="btn-ghost md:w-auto"
                disabled={isSaving}
                onClick={() => void updateStatus(booking.id, "cancelled", "Booking declined")}
              >
                Decline
              </button>
              <button
                type="button"
                className="rounded border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50 md:w-auto"
                disabled={isSaving}
                onClick={() => setPendingAction({ type: "delete", bookingId: booking.id })}
              >
                {isSaving ? "Deleting..." : "Delete"}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn-primary md:w-auto"
                disabled={isSaving}
                onClick={() => void restoreDeletedBooking(booking.id)}
              >
                {isSaving ? "Restoring..." : "Restore"}
              </button>
              <button
                type="button"
                className="rounded border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50 md:w-auto"
                disabled={isSaving}
                onClick={() => setPendingAction({ type: "deleteForever", bookingId: booking.id })}
              >
                {isSaving ? "Deleting..." : "Delete Forever"}
              </button>
            </>
          )}
        </div>

        {!isDeleted ? <AdminBookingThread booking={booking} refreshToken={refreshToken} /> : null}
        {!isDeleted ? <AdminDirectEmailComposer booking={booking} /> : null}
      </article>
    );
  };

  return (
    <>
      {pendingAction ? (
        <ConfirmModal
          message={pendingAction.type === "delete" ? "Are you sure you want to delete this booking?" : "Delete this trashed booking forever? This cannot be undone."}
          confirmLabel={pendingAction.type === "delete" ? "Delete" : "Delete Forever"}
          onConfirm={() => pendingAction.type === "delete" ? void softDeleteBooking(pendingAction.bookingId) : void deleteForever(pendingAction.bookingId)}
          onCancel={() => setPendingAction(null)}
        />
      ) : null}

      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-2xl ${toast.kind === "ok" ? "border-emerald-500/30 bg-emerald-900/90 text-emerald-100" : "border-rose-500/30 bg-rose-900/90 text-rose-100"}`}
          >
            <span>{toast.message}</span>
            <button type="button" className="ml-1 opacity-60 hover:opacity-100" onClick={() => dismissToast(toast.id)} aria-label="Dismiss">
              ×
            </button>
          </div>
        ))}
      </div>

      {viewMode !== "trash" ? (
      <section id="bookings-inbox" className="glass-panel p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Bookings Workspace</h3>
            <p className="mt-1 text-sm text-slate-300">Active booking operations for status updates, replies, and direct customer communication.</p>
          </div>
          <button type="button" className="btn-secondary md:w-auto" onClick={() => void loadBookings()} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Bookings"}
          </button>
        </div>

        <div className="mt-4 border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {(["all", "pending", "confirmed"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveStatusFilter(tab)}
                className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${activeStatusFilter === tab ? "border-luxeGold/60 bg-luxeGold/15 text-luxeGold" : "border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-slate-200"}`}
              >
                {tab === "all" ? "All" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}

            <div className="ml-auto flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Time:</span>
                <select className="rounded border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:outline-none" value={timeFilter} onChange={(event) => setTimeFilter(event.target.value as TimeFilter)}>
                  <option value="upcoming">Upcoming</option>
                  <option value="all">All</option>
                </select>
              </label>
              <label className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>Date:</span>
                <input type="date" className="rounded border border-white/10 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:outline-none" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
                {dateFilter ? <button type="button" className="text-slate-400 hover:text-slate-200" onClick={() => setDateFilter("")} aria-label="Clear date">×</button> : null}
              </label>
              <span className="text-xs text-slate-500">{activeBookings.length} active result(s)</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {activeBookings.length === 0 ? <p className="text-sm text-slate-400">No active bookings match the current filters.</p> : activeBookings.map((booking) => renderBookingCard(booking, "active"))}
        </div>
      </section>
      ) : null}

      {viewMode !== "active" ? (
      <section id="booking-trash" className="glass-panel p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Booking Trash</h3>
            <p className="mt-1 text-sm text-slate-300">Soft-deleted bookings retain for 30 days before purge. Restore, inspect retention, or permanently remove records here.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary md:w-auto" disabled={bulkActionLoading !== null} onClick={() => void purgeExpiredTrash()}>
              {bulkActionLoading === "purge_expired" ? "Purging..." : "Purge Expired Trash"}
            </button>
            <button type="button" className="btn-ghost md:w-auto" disabled={bulkActionLoading !== null} onClick={() => void purgeDeletedTestBookings()}>
              {bulkActionLoading === "purge_test" ? "Purging Test Trash..." : "Purge Test Trash"}
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-center gap-2">
            {([
              { value: "all", label: `All Trashed (${trashStats.total})` },
              { value: "expiring_soon", label: `Expiring Soon (${trashStats.expiringSoon})` },
              { value: "expired", label: `Expired (${trashStats.expired})` },
              { value: "test", label: `Test Bookings (${trashStats.test})` }
            ] as const).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setTrashFilter(item.value)}
                className={`rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition ${trashFilter === item.value ? "border-rose-500/60 bg-rose-500/20 text-rose-200" : "border-white/10 bg-white/5 text-slate-400 hover:border-white/25 hover:text-slate-200"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-400">Deleted bookings are excluded from active lists, messaging, direct email, and status updates until restored.</p>
        </div>

        <div className="mt-4 grid gap-3">
          {trashedBookings.length === 0 ? <p className="text-sm text-slate-400">Trash is empty for the current filter.</p> : trashedBookings.map((booking) => renderBookingCard(booking, "trash"))}
        </div>
      </section>
      ) : null}
    </>
  );
}
