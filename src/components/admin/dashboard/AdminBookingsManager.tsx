"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Booking, BookingStatus } from "../../../types/booking";
import { readCookieValue } from "../../../utils/csrf";
import { SiteContent } from "../../../types/site-content";
import { SiteSettings } from "../../../types/site-settings";
import { AdminBookingThread } from "./AdminBookingThread";
import { AdminDirectEmailComposer } from "./AdminDirectEmailComposer";

interface BookingFocusRequest {
  bookingId: string;
  token: number;
}

interface AdminBookingsManagerProps {
  settings: SiteSettings;
  content: SiteContent;
  focusRequest?: BookingFocusRequest | null;
  refreshToken?: number;
  onBookingMutation?: () => void;
}

type TimeFilter = "upcoming" | "all";

const statusOptions: BookingStatus[] = [
  "new",
  "awaiting_response",
  "pending_deposit",
  "confirmed",
  "completed",
  "cancelled"
];

function toDisplayStatus(status: BookingStatus) {
  if (status === "awaiting_response") return "Awaiting Response";
  if (status === "pending_deposit") return "Reviewed";
  if (status === "cancelled") return "Declined";
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
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

function formatDateTime(value: string) {
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

export function AdminBookingsManager({ settings, content, focusRequest = null, refreshToken = 0, onBookingMutation }: AdminBookingsManagerProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("upcoming");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | BookingStatus>("all");
  const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bookingRefs = useRef<Record<string, HTMLElement | null>>({});

  const getAdminCsrfHeader = () => ({ "X-CSRF-Token": readCookieValue("dj_admin_csrf") });

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
    setError(null);

    try {
      const response = await fetch("/api/bookings", { cache: "no-store" });
      const payload = await parseResponse<{ bookings: Booking[] }>(response);
      setBookings(payload.bookings || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = async (id: string, status: BookingStatus, successLabel: string) => {
    setSavingId(id);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAdminCsrfHeader() },
        body: JSON.stringify({ id, status })
      });

      await parseResponse<{ message: string }>(response);
      setBookings((prev) => prev.map((booking) => (booking.id === id ? { ...booking, status } : booking)));
      setMessage(successLabel);
      onBookingMutation?.();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "Unable to update booking status");
    } finally {
      setSavingId(null);
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

  const filteredBookings = useMemo(() => {
    const todayIso = localTodayIso();

    return bookings.filter((booking) => {
      if (timeFilter === "upcoming" && booking.eventDate < todayIso) {
        return false;
      }

      if (dateFilter && booking.eventDate !== dateFilter) {
        return false;
      }

      if (statusFilter !== "all" && booking.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [bookings, dateFilter, statusFilter, timeFilter]);

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
    setStatusFilter("all");
    setDateFilter(targetBooking.eventDate);
    setHighlightedBookingId(targetBooking.id);
  }, [bookings, focusRequest, loadBookings]);

  useEffect(() => {
    if (!highlightedBookingId) {
      return;
    }

    const targetElement = bookingRefs.current[highlightedBookingId];
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    const timeoutId = window.setTimeout(() => {
      setHighlightedBookingId((current) => (current === highlightedBookingId ? null : current));
    }, 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [filteredBookings, highlightedBookingId]);

  return (
    <section id="bookings-inbox" className="glass-panel p-5 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Admin Bookings Inbox</h3>
          <p className="mt-1 text-sm text-slate-300">Review new booking inquiries and update status.</p>
        </div>
        <button type="button" className="btn-secondary md:w-auto" onClick={() => void loadBookings()} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh Bookings"}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <label className="field">
          <span className="field-label">Time Filter</span>
          <select className="field-input" value={timeFilter} onChange={(event) => setTimeFilter(event.target.value as TimeFilter)}>
            <option value="upcoming">Upcoming</option>
            <option value="all">All</option>
          </select>
        </label>

        <label className="field">
          <span className="field-label">By Date</span>
          <input className="field-input" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} />
        </label>

        <label className="field">
          <span className="field-label">By Status</span>
          <select className="field-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | BookingStatus)}>
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>{toDisplayStatus(status)}</option>
            ))}
          </select>
        </label>

        <div className="field">
          <span className="field-label">Results</span>
          <div className="field-input flex items-center">{filteredBookings.length} booking(s)</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {filteredBookings.length === 0 ? (
          <p className="text-sm text-slate-400">{bookings.length === 0 ? "No bookings yet" : "No bookings match the current filters."}</p>
        ) : (
          filteredBookings.map((booking) => {
            const packageId = booking.packageId?.trim() || "";
            const packageLabel = packageId ? packageNameMap.get(packageId.toLowerCase()) || packageId : "-";
            const statusText = toDisplayStatus(booking.status);
            const isSaving = savingId === booking.id;

            return (
              <article
                key={booking.id}
                id={`booking-${booking.id}`}
                ref={(element) => {
                  bookingRefs.current[booking.id] = element;
                }}
                className={`rounded-xl border p-4 transition ${highlightedBookingId === booking.id ? "border-luxeGold bg-luxeGold/10 shadow-[0_0_0_1px_rgba(244,194,80,0.35)]" : "border-white/10 bg-white/5"}`}
              >
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">Booking ID</p>
                    <p className="mt-1 text-sm font-semibold text-white break-all">{booking.id}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">Name</p>
                    <p className="mt-1 text-sm font-semibold text-white">{booking.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">Email</p>
                    <p className="mt-1 text-sm font-semibold text-white break-all">{booking.email}</p>
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
                    <p className="mt-1 text-sm font-semibold text-white">{statusText}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-slate-400">Created</p>
                    <p className="mt-1 text-sm font-semibold text-white">{formatDateTime(booking.createdAt)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-secondary md:w-auto"
                    disabled={isSaving}
                    onClick={() => void updateStatus(booking.id, "pending_deposit", "Booking marked reviewed")}
                  >
                    Mark Reviewed
                  </button>
                  <button
                    type="button"
                    className="btn-primary md:w-auto"
                    disabled={isSaving}
                    onClick={() => void updateStatus(booking.id, "confirmed", "Booking marked confirmed")}
                  >
                    Mark Confirmed
                  </button>
                  <button
                    type="button"
                    className="btn-ghost md:w-auto"
                    disabled={isSaving}
                    onClick={() => void updateStatus(booking.id, "cancelled", "Booking marked declined")}
                  >
                    Mark Declined
                  </button>
                </div>

                <AdminBookingThread booking={booking} refreshToken={refreshToken} />
                <AdminDirectEmailComposer booking={booking} />
              </article>
            );
          })
        )}
      </div>

      {message ? <p className="status-ok mt-3">{message}</p> : null}
      {error ? <p className="status-bad mt-3">{error}</p> : null}
    </section>
  );
}
