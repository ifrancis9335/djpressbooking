"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminImageField } from "./admin-image-field";
import { SiteSettings } from "../../types/site-settings";
import {
  AboutStatContentItem,
  GalleryContentItem,
  PackageContentItem,
  ReviewContentItem,
  ServiceContentItem,
  SiteContent
} from "../../types/site-content";
import { defaultSiteContent } from "../../lib/site-content";

interface DashboardSummary {
  totalBlockedDates: number;
  nextBlockedDate: string | null;
  publicPhoneNumber: string;
  publicEmail: string;
  bookingEnabled: boolean;
}

interface BlockedDateEntry {
  id: number;
  eventDate: string;
  status: "blocked" | "available";
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

const week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toIsoDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createStableId(prefix: string) {
  const seed = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now()}-${seed}`;
}

function moveItem<T>(items: T[], index: number, direction: "up" | "down") {
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const copy = [...items];
  const [item] = copy.splice(index, 1);
  copy.splice(nextIndex, 0, item);
  return copy;
}

const defaultSettings: SiteSettings = {
  contact: {
    phone: "",
    phoneHref: "",
    email: "",
    serviceArea: ""
  },
  packages: {
    basic: { name: "", startingAt: "", ctaLabel: "" },
    premium: { name: "", startingAt: "", ctaLabel: "" },
    vip: { name: "", startingAt: "", ctaLabel: "" }
  },
  booking: {
    enabled: true,
    notice: ""
  },
  site: {
    primaryCtaLabel: "",
    heroSupportText: "",
    serviceAreaLine: ""
  }
};

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as T | { message?: string } | null;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "message" in payload ? payload.message : undefined;
    throw new Error(message || "Request failed");
  }
  return payload as T;
}

export function AdminDashboard() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [blockedDates, setBlockedDates] = useState<BlockedDateEntry[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newBlockedNote, setNewBlockedNote] = useState("");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const [loading, setLoading] = useState(false);
  const [blockedLoading, setBlockedLoading] = useState(false);

  const [contactMessage, setContactMessage] = useState<string | null>(null);
  const [packageMessage, setPackageMessage] = useState<string | null>(null);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [siteMessage, setSiteMessage] = useState<string | null>(null);
  const [contentMessage, setContentMessage] = useState<string | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const [contactError, setContactError] = useState<string | null>(null);
  const [packageError, setPackageError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [siteError, setSiteError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [blockedError, setBlockedError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsPayload, contentPayload, summaryPayload, blockedPayload] = await Promise.all([
        fetch("/api/admin/settings", { cache: "no-store" }).then((res) => parseResponse<{ settings: SiteSettings }>(res)),
        fetch("/api/admin/content", { cache: "no-store" }).then((res) => parseResponse<{ content: SiteContent }>(res)),
        fetch("/api/admin/dashboard", { cache: "no-store" }).then((res) => parseResponse<{ summary: DashboardSummary }>(res)),
        fetch(`/api/availability?list=blocked&t=${Date.now()}`, { cache: "no-store" }).then((res) =>
          parseResponse<{ blockedDates: BlockedDateEntry[] }>(res)
        )
      ]);

      setSettings(settingsPayload.settings);
      setContent(contentPayload.content);
      setSummary(summaryPayload.summary);
      setBlockedDates(blockedPayload.blockedDates);
      setAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load admin dashboard";
      setAuthenticated(false);
      setAuthError(message === "Unauthorized" ? null : message);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      await parseResponse<{ message: string }>(response);
      setAuthMessage("Authenticated successfully.");
      await loadDashboard();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to authenticate");
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    setAuthenticated(false);
    setSummary(null);
    setPassword("");
    setAuthMessage("Signed out.");
  };

  const saveSettings = async (patch: Partial<SiteSettings>, mode: "contact" | "packages" | "booking" | "site") => {
    const clear = {
      contact: () => {
        setContactMessage(null);
        setContactError(null);
      },
      packages: () => {
        setPackageMessage(null);
        setPackageError(null);
      },
      booking: () => {
        setBookingMessage(null);
        setBookingError(null);
      },
      site: () => {
        setSiteMessage(null);
        setSiteError(null);
      }
    };

    clear[mode]();

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      const payload = await parseResponse<{ settings: SiteSettings; message: string }>(response);
      setSettings(payload.settings);
      await loadDashboard();

      if (mode === "contact") setContactMessage(payload.message);
      if (mode === "packages") setPackageMessage(payload.message);
      if (mode === "booking") setBookingMessage(payload.message);
      if (mode === "site") setSiteMessage(payload.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save";
      if (mode === "contact") setContactError(message);
      if (mode === "packages") setPackageError(message);
      if (mode === "booking") setBookingError(message);
      if (mode === "site") setSiteError(message);
    }
  };

  const saveContentSection = async <K extends keyof SiteContent>(section: K, value: SiteContent[K], successMessage: string) => {
    setContentMessage(null);
    setContentError(null);

    try {
      const response = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, value })
      });
      const payload = await parseResponse<{ content: SiteContent; message: string }>(response);
      setContent(payload.content);
      setContentMessage(successMessage || payload.message);
    } catch (error) {
      setContentError(error instanceof Error ? error.message : "Unable to save content section");
    }
  };

  const setOrderedServices = (next: ServiceContentItem[]) => {
    setContent((prev) => ({
      ...prev,
      services: next.map((item, index) => ({ ...item, order: index }))
    }));
  };

  const setOrderedPackages = (next: PackageContentItem[]) => {
    setContent((prev) => ({
      ...prev,
      packages: next.map((item, index) => ({ ...item, order: index }))
    }));
  };

  const setOrderedGallery = (next: GalleryContentItem[]) => {
    setContent((prev) => ({
      ...prev,
      gallery: next.map((item, index) => ({ ...item, order: index }))
    }));
  };

  const setReviews = (next: ReviewContentItem[]) => {
    setContent((prev) => ({ ...prev, reviews: next }));
  };

  const setAboutStats = (next: AboutStatContentItem[]) => {
    setContent((prev) => ({ ...prev, aboutStats: next }));
  };

  const addBlockedDate = async () => {
    if (!newBlockedDate) {
      setBlockedError("Choose a date first.");
      return;
    }

    setBlockedLoading(true);
    setBlockedError(null);
    setBlockedMessage(null);

    try {
      console.info("[admin-dashboard] block request", { date: newBlockedDate, note: newBlockedNote });
      const response = await fetch("/api/admin/availability/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newBlockedDate, note: newBlockedNote })
      });
      const payload = await parseResponse<{ blockedDate: BlockedDateEntry; message: string }>(response);
      console.info("[admin-dashboard] block response", { date: payload.blockedDate.eventDate, status: payload.blockedDate.status });
      setBlockedDates((prev) => [...prev.filter((item) => item.eventDate !== payload.blockedDate.eventDate), payload.blockedDate].sort((a, b) => a.eventDate.localeCompare(b.eventDate)));
      setBlockedMessage(`${payload.message}. Public availability has been refreshed.`);
      setNewBlockedDate("");
      setNewBlockedNote("");
      router.refresh();
      await loadDashboard();
    } catch (error) {
      setBlockedError(error instanceof Error ? error.message : "Unable to block date");
    } finally {
      setBlockedLoading(false);
    }
  };

  const removeBlockedDate = async (date: string) => {
    setBlockedLoading(true);
    setBlockedError(null);
    setBlockedMessage(null);

    try {
      console.info("[admin-dashboard] unblock request", { date });
      const response = await fetch("/api/admin/availability/unblock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date })
      });
      const payload = await parseResponse<{ message: string }>(response);
      console.info("[admin-dashboard] unblock response", { date, message: payload.message });
      setBlockedDates((prev) => prev.filter((entry) => entry.eventDate !== date));
      setBlockedMessage(`${payload.message}. Public availability has been refreshed.`);
      router.refresh();
      await loadDashboard();
    } catch (error) {
      setBlockedError(error instanceof Error ? error.message : "Unable to remove date");
    } finally {
      setBlockedLoading(false);
    }
  };

  const quickLinks = useMemo(
    () => [
      { href: "#blocked-dates", label: "Blocked Dates" },
      { href: "#contact-info", label: "Contact Info" },
      { href: "#package-pricing", label: "Package Pricing" },
      { href: "#booking-settings", label: "Booking Settings" },
      { href: "#site-settings", label: "Site Settings" },
      { href: "#content-controls", label: "Content Controls" }
    ],
    []
  );

  const blockedDateSet = useMemo(() => new Set(blockedDates.map((entry) => entry.eventDate)), [blockedDates]);

  const calendarCells = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const offset = firstDay.getDay();
    const count = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day?: number; iso?: string; blocked?: boolean }> = [];

    for (let i = 0; i < offset; i += 1) {
      cells.push({});
    }

    for (let day = 1; day <= count; day += 1) {
      const iso = toIsoDateLocal(new Date(year, month, day));
      cells.push({ day, iso, blocked: blockedDateSet.has(iso) });
    }

    return cells;
  }, [blockedDateSet, calendarMonth]);

  const toggleCalendarDate = async (iso: string, blocked: boolean) => {
    setNewBlockedDate(iso);
    if (blocked) {
      await removeBlockedDate(iso);
      return;
    }

    setBlockedLoading(true);
    setBlockedError(null);
    setBlockedMessage(null);

    try {
      console.info("[admin-dashboard] calendar block request", { date: iso, note: newBlockedNote });
      const response = await fetch("/api/admin/availability/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: iso, note: newBlockedNote })
      });
      const payload = await parseResponse<{ blockedDate: BlockedDateEntry; message: string }>(response);
      console.info("[admin-dashboard] calendar block response", { date: payload.blockedDate.eventDate, status: payload.blockedDate.status });
      setBlockedDates((prev) => [...prev.filter((item) => item.eventDate !== payload.blockedDate.eventDate), payload.blockedDate].sort((a, b) => a.eventDate.localeCompare(b.eventDate)));
      setBlockedMessage(`${payload.message}. Public availability has been refreshed.`);
      router.refresh();
      await loadDashboard();
    } catch (error) {
      setBlockedError(error instanceof Error ? error.message : "Unable to block date");
    } finally {
      setBlockedLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (!authenticated) {
    return (
      <section className="mt-6 max-w-lg glass-panel p-5 md:p-6">
        <h2 className="text-xl font-bold text-white">Admin Sign In</h2>
        <p className="mt-2 text-sm text-slate-300">Use your admin password configured in environment variables.</p>
        <form className="mt-4 grid gap-3" onSubmit={login}>
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
    );
  }

  return (
    <div className="mt-6 grid gap-5">
      <section className="glass-panel p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Dashboard Home</h2>
            <p className="mt-1 text-sm text-slate-300">Manage key settings and live public values.</p>
          </div>
          <button type="button" className="btn-secondary md:w-auto" onClick={logout}>Sign Out</button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <article className="premium-card p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Total Blocked Dates</p><p className="mt-2 text-xl font-bold text-white">{summary?.totalBlockedDates ?? "-"}</p></article>
          <article className="premium-card p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Next Blocked Date</p><p className="mt-2 text-xl font-bold text-white">{summary?.nextBlockedDate || "None"}</p></article>
          <article className="premium-card p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Public Phone</p><p className="mt-2 text-sm font-bold text-white">{summary?.publicPhoneNumber || "-"}</p></article>
          <article className="premium-card p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Public Email</p><p className="mt-2 text-sm font-bold text-white">{summary?.publicEmail || "-"}</p></article>
          <article className="premium-card p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Booking Status</p><p className="mt-2 text-xl font-bold text-white">{summary?.bookingEnabled ? "Enabled" : "Disabled"}</p></article>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {quickLinks.map((item) => (
            <a key={item.href} href={item.href} className="btn-ghost">{item.label}</a>
          ))}
        </div>
      </section>

      <section id="blocked-dates" className="glass-panel p-5 md:p-6">
        <h3 className="text-xl font-bold text-white">Blocked Dates Manager</h3>
        <p className="mt-1 text-sm text-slate-300">Manage live blocked dates saved in Postgres.</p>
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 md:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              className="btn-secondary md:w-auto"
              onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            >
              Previous
            </button>
            <h4 className="text-base font-bold text-white">
              {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(calendarMonth)}
            </h4>
            <button
              type="button"
              className="btn-secondary md:w-auto"
              onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
            >
              Next
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {week.map((day) => (
              <div key={day} className="rounded-lg bg-white/5 py-2 text-center text-xs font-bold uppercase tracking-wider text-slate-300">
                {day}
              </div>
            ))}
            {calendarCells.map((cell, index) => (
              <button
                key={`${cell.iso || "pad"}-${index}`}
                type="button"
                disabled={!cell.iso || blockedLoading}
                onClick={() => {
                  if (!cell.iso) return;
                  void toggleCalendarDate(cell.iso, Boolean(cell.blocked));
                }}
                className={`min-h-[58px] rounded-lg border text-center text-sm font-semibold transition ${!cell.day ? "border-transparent bg-transparent" : cell.blocked ? "border-rose-400/50 bg-rose-500/20 text-rose-100" : "border-emerald-400/50 bg-emerald-500/15 text-emerald-100"}`}
                title={cell.iso ? `${cell.iso} (${cell.blocked ? "blocked" : "available"})` : ""}
              >
                {cell.day || ""}
              </button>
            ))}
          </div>

          <p className="mt-3 text-xs text-slate-300">Click a date to toggle block/unblock instantly.</p>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[260px_1fr_auto]">
          <input type="date" className="field-input" value={newBlockedDate} onChange={(event) => setNewBlockedDate(event.target.value)} />
          <input
            type="text"
            className="field-input"
            value={newBlockedNote}
            onChange={(event) => setNewBlockedNote(event.target.value)}
            placeholder="Optional note"
            maxLength={160}
          />
          <button type="button" className="btn-primary md:w-auto" onClick={addBlockedDate} disabled={blockedLoading}>
            {blockedLoading ? "Saving..." : "Add Blocked Date"}
          </button>
        </div>
        <div className="mt-4 grid gap-2">
          {blockedDates.length === 0 ? <p className="text-sm text-slate-400">No blocked dates configured.</p> : null}
          {blockedDates.map((blocked) => (
            <div key={blocked.id} className="flex flex-col gap-2 rounded-xl border border-slate-500/35 bg-slate-800/40 p-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100">{blocked.eventDate}</p>
                <p className="text-xs text-slate-400">{blocked.note || "No note"}</p>
              </div>
              <button
                type="button"
                className="btn-secondary md:w-auto"
                onClick={() => removeBlockedDate(blocked.eventDate)}
                disabled={blockedLoading}
              >
                {blockedLoading ? "Saving..." : "Mark Available"}
              </button>
            </div>
          ))}
        </div>
        {blockedMessage ? <p className="status-ok mt-3">{blockedMessage}</p> : null}
        {blockedError ? <p className="status-bad mt-3">{blockedError}</p> : null}
      </section>

      <section id="contact-info" className="glass-panel p-5 md:p-6">
        <h3 className="text-xl font-bold text-white">Contact Info Manager</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="field"><span className="field-label">Business Phone Number</span><input className="field-input" value={settings.contact.phone} onChange={(event) => setSettings((prev) => ({ ...prev, contact: { ...prev.contact, phone: event.target.value } }))} /></label>
          <label className="field"><span className="field-label">Tel Href</span><input className="field-input" value={settings.contact.phoneHref} onChange={(event) => setSettings((prev) => ({ ...prev, contact: { ...prev.contact, phoneHref: event.target.value } }))} /></label>
          <label className="field"><span className="field-label">Contact Email</span><input className="field-input" value={settings.contact.email} onChange={(event) => setSettings((prev) => ({ ...prev, contact: { ...prev.contact, email: event.target.value } }))} /></label>
          <label className="field"><span className="field-label">Service Area</span><input className="field-input" value={settings.contact.serviceArea} onChange={(event) => setSettings((prev) => ({ ...prev, contact: { ...prev.contact, serviceArea: event.target.value } }))} /></label>
        </div>
        <button type="button" className="btn-primary mt-4 md:w-auto" onClick={() => saveSettings({ contact: settings.contact }, "contact")}>
          Save Contact Info
        </button>
        {contactMessage ? <p className="status-ok mt-3">{contactMessage}</p> : null}
        {contactError ? <p className="status-bad mt-3">{contactError}</p> : null}
      </section>

      <section id="package-pricing" className="glass-panel p-5 md:p-6">
        <h3 className="text-xl font-bold text-white">Package Pricing Manager</h3>
        <div className="mt-3 grid gap-4 lg:grid-cols-3">
          {(["basic", "premium", "vip"] as const).map((key) => (
            <article key={key} className="premium-card p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{key.toUpperCase()}</p>
              <label className="field mt-2"><span className="field-label">Label</span><input className="field-input" value={settings.packages[key].name} onChange={(event) => setSettings((prev) => ({ ...prev, packages: { ...prev.packages, [key]: { ...prev.packages[key], name: event.target.value } } }))} /></label>
              <label className="field mt-2"><span className="field-label">Price</span><input className="field-input" value={settings.packages[key].startingAt} onChange={(event) => setSettings((prev) => ({ ...prev, packages: { ...prev.packages, [key]: { ...prev.packages[key], startingAt: event.target.value } } }))} /></label>
              <label className="field mt-2"><span className="field-label">CTA Label</span><input className="field-input" value={settings.packages[key].ctaLabel} onChange={(event) => setSettings((prev) => ({ ...prev, packages: { ...prev.packages, [key]: { ...prev.packages[key], ctaLabel: event.target.value } } }))} /></label>
            </article>
          ))}
        </div>
        <button type="button" className="btn-primary mt-4 md:w-auto" onClick={() => saveSettings({ packages: settings.packages }, "packages")}>
          Save Package Pricing
        </button>
        {packageMessage ? <p className="status-ok mt-3">{packageMessage}</p> : null}
        {packageError ? <p className="status-bad mt-3">{packageError}</p> : null}
      </section>

      <section id="booking-settings" className="glass-panel p-5 md:p-6">
        <h3 className="text-xl font-bold text-white">Booking Settings</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="field"><span className="field-label">Booking Enabled</span><select className="field-input" value={settings.booking.enabled ? "yes" : "no"} onChange={(event) => setSettings((prev) => ({ ...prev, booking: { ...prev.booking, enabled: event.target.value === "yes" } }))}><option value="yes">Enabled</option><option value="no">Disabled</option></select></label>
          <label className="field"><span className="field-label">Booking Notice Text</span><input className="field-input" value={settings.booking.notice} onChange={(event) => setSettings((prev) => ({ ...prev, booking: { ...prev.booking, notice: event.target.value } }))} placeholder="Bookings temporarily paused" /></label>
        </div>
        <button type="button" className="btn-primary mt-4 md:w-auto" onClick={() => saveSettings({ booking: settings.booking }, "booking")}>Save Booking Settings</button>
        {bookingMessage ? <p className="status-ok mt-3">{bookingMessage}</p> : null}
        {bookingError ? <p className="status-bad mt-3">{bookingError}</p> : null}
      </section>

      <section id="site-settings" className="glass-panel p-5 md:p-6">
        <h3 className="text-xl font-bold text-white">Site Settings</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <label className="field"><span className="field-label">Primary CTA Label</span><input className="field-input" value={settings.site.primaryCtaLabel} onChange={(event) => setSettings((prev) => ({ ...prev, site: { ...prev.site, primaryCtaLabel: event.target.value } }))} /></label>
          <label className="field"><span className="field-label">Hero Support Text</span><input className="field-input" value={settings.site.heroSupportText} onChange={(event) => setSettings((prev) => ({ ...prev, site: { ...prev.site, heroSupportText: event.target.value } }))} /></label>
          <label className="field"><span className="field-label">Service Area Line</span><input className="field-input" value={settings.site.serviceAreaLine} onChange={(event) => setSettings((prev) => ({ ...prev, site: { ...prev.site, serviceAreaLine: event.target.value } }))} /></label>
        </div>
        <button type="button" className="btn-primary mt-4 md:w-auto" onClick={() => saveSettings({ site: settings.site }, "site")}>Save Site Settings</button>
        {siteMessage ? <p className="status-ok mt-3">{siteMessage}</p> : null}
        {siteError ? <p className="status-bad mt-3">{siteError}</p> : null}
      </section>

      <section id="content-controls" className="glass-panel p-5 md:p-6">
        <h3 className="text-xl font-bold text-white">Content Controls</h3>
        <p className="mt-1 text-sm text-slate-300">Manage homepage sections, intros, and visibility toggles.</p>

        <div className="mt-4 grid gap-5">
          <article className="premium-card p-4">
            <h4 className="text-base font-bold text-white">Branding</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="field"><span className="field-label">Site Title</span><input className="field-input" value={content.branding.siteName} onChange={(event) => setContent((prev) => ({ ...prev, branding: { ...prev.branding, siteName: event.target.value } }))} /></label>
              <label className="field"><span className="field-label">Brand Text</span><input className="field-input" value={content.branding.logoText} onChange={(event) => setContent((prev) => ({ ...prev, branding: { ...prev.branding, logoText: event.target.value } }))} /></label>
              <label className="field md:col-span-2"><span className="field-label">Tagline</span><input className="field-input" value={content.branding.tagline} onChange={(event) => setContent((prev) => ({ ...prev, branding: { ...prev.branding, tagline: event.target.value } }))} /></label>
            </div>
            <div className="mt-3">
              <AdminImageField
                label="Logo Image"
                scope="branding"
                uploadTitle={content.branding.siteName || "Brand logo"}
                fallbackSrc="/images/branding/dj-press-logo-press.png"
                value={content.branding.logoImageAsset}
                legacyUrl={content.branding.logoImage}
                previewClassName="h-16 w-16 rounded-full border border-luxeGold/35 object-contain"
                onChange={(next) => setContent((prev) => ({ ...prev, branding: { ...prev.branding, logoImageAsset: next, logoImage: "" } }))}
                onLegacyClear={() => setContent((prev) => ({ ...prev, branding: { ...prev.branding, logoImage: "" } }))}
              />
            </div>
            <button type="button" className="btn-primary mt-4 md:w-auto" onClick={() => saveContentSection("branding", content.branding, "Branding updated")}>Save Branding</button>
          </article>

          <article className="premium-card p-4">
            <h4 className="text-base font-bold text-white">Section Visibility</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <label className="field"><span className="field-label">Homepage Hero</span><select className="field-input" value={content.sectionVisibility.homepageHero ? "yes" : "no"} onChange={(event) => setContent((prev) => ({ ...prev, sectionVisibility: { ...prev.sectionVisibility, homepageHero: event.target.value === "yes" } }))}><option value="yes">Visible</option><option value="no">Hidden</option></select></label>
              <label className="field"><span className="field-label">Homepage Services</span><select className="field-input" value={content.sectionVisibility.homepageServices ? "yes" : "no"} onChange={(event) => setContent((prev) => ({ ...prev, sectionVisibility: { ...prev.sectionVisibility, homepageServices: event.target.value === "yes" } }))}><option value="yes">Visible</option><option value="no">Hidden</option></select></label>
              <label className="field"><span className="field-label">Homepage Packages</span><select className="field-input" value={content.sectionVisibility.homepagePackages ? "yes" : "no"} onChange={(event) => setContent((prev) => ({ ...prev, sectionVisibility: { ...prev.sectionVisibility, homepagePackages: event.target.value === "yes" } }))}><option value="yes">Visible</option><option value="no">Hidden</option></select></label>
              <label className="field"><span className="field-label">Homepage Gallery</span><select className="field-input" value={content.sectionVisibility.homepageGallery ? "yes" : "no"} onChange={(event) => setContent((prev) => ({ ...prev, sectionVisibility: { ...prev.sectionVisibility, homepageGallery: event.target.value === "yes" } }))}><option value="yes">Visible</option><option value="no">Hidden</option></select></label>
              <label className="field"><span className="field-label">Homepage Reviews</span><select className="field-input" value={content.sectionVisibility.homepageReviews ? "yes" : "no"} onChange={(event) => setContent((prev) => ({ ...prev, sectionVisibility: { ...prev.sectionVisibility, homepageReviews: event.target.value === "yes" } }))}><option value="yes">Visible</option><option value="no">Hidden</option></select></label>
              <label className="field"><span className="field-label">Homepage Final CTA</span><select className="field-input" value={content.sectionVisibility.homepageAbout ? "yes" : "no"} onChange={(event) => setContent((prev) => ({ ...prev, sectionVisibility: { ...prev.sectionVisibility, homepageAbout: event.target.value === "yes" } }))}><option value="yes">Visible</option><option value="no">Hidden</option></select></label>
            </div>
            <button type="button" className="btn-primary mt-4 md:w-auto" onClick={() => saveContentSection("sectionVisibility", content.sectionVisibility, "Section visibility updated")}>Save Visibility</button>
          </article>

          <article className="premium-card p-4">
            <h4 className="text-base font-bold text-white">Homepage Hero</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="field"><span className="field-label">Badge Text</span><input className="field-input" value={content.homepageHero.kicker} onChange={(event) => setContent((prev) => ({ ...prev, homepageHero: { ...prev.homepageHero, kicker: event.target.value } }))} /></label>
              <label className="field"><span className="field-label">Headline</span><input className="field-input" value={content.homepageHero.title} onChange={(event) => setContent((prev) => ({ ...prev, homepageHero: { ...prev.homepageHero, title: event.target.value } }))} /></label>
              <label className="field md:col-span-2"><span className="field-label">Subheadline</span><input className="field-input" value={content.homepageHero.description} onChange={(event) => setContent((prev) => ({ ...prev, homepageHero: { ...prev.homepageHero, description: event.target.value } }))} /></label>
              <label className="field"><span className="field-label">Primary CTA</span><input className="field-input" value={content.homepageHero.primaryCtaLabel} onChange={(event) => setContent((prev) => ({ ...prev, homepageHero: { ...prev.homepageHero, primaryCtaLabel: event.target.value } }))} /></label>
              <label className="field"><span className="field-label">Secondary CTA</span><input className="field-input" value={content.homepageHero.secondaryCtaLabel} onChange={(event) => setContent((prev) => ({ ...prev, homepageHero: { ...prev.homepageHero, secondaryCtaLabel: event.target.value } }))} /></label>
            </div>
            <div className="mt-3">
              <AdminImageField
                label="Hero Image"
                scope="branding"
                uploadTitle={content.homepageHero.title || "Homepage hero image"}
                fallbackSrc="/images/dj/dj-press-live-performance.jpg"
                value={content.homepageHero.heroImageAsset}
                legacyUrl={content.homepageHero.heroImage}
                previewClassName="h-28 w-full rounded-xl object-cover"
                onChange={(next) => setContent((prev) => ({ ...prev, homepageHero: { ...prev.homepageHero, heroImageAsset: next, heroImage: "" } }))}
                onLegacyClear={() => setContent((prev) => ({ ...prev, homepageHero: { ...prev.homepageHero, heroImage: "" } }))}
              />
            </div>
            <button type="button" className="btn-primary mt-4 md:w-auto" onClick={() => saveContentSection("homepageHero", content.homepageHero, "Homepage hero updated")}>Save Homepage Hero</button>
          </article>

          <article className="premium-card p-4">
            <h4 className="text-base font-bold text-white">Homepage Featured Section</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="field"><span className="field-label">Kicker</span><input className="field-input" value={content.homepageFeatured.kicker} onChange={(event) => setContent((prev) => ({ ...prev, homepageFeatured: { ...prev.homepageFeatured, kicker: event.target.value } }))} /></label>
              <label className="field"><span className="field-label">Title</span><input className="field-input" value={content.homepageFeatured.title} onChange={(event) => setContent((prev) => ({ ...prev, homepageFeatured: { ...prev.homepageFeatured, title: event.target.value } }))} /></label>
              <label className="field md:col-span-2"><span className="field-label">Description</span><input className="field-input" value={content.homepageFeatured.description} onChange={(event) => setContent((prev) => ({ ...prev, homepageFeatured: { ...prev.homepageFeatured, description: event.target.value } }))} /></label>
            </div>
            <button type="button" className="btn-primary mt-4 md:w-auto" onClick={() => saveContentSection("homepageFeatured", content.homepageFeatured, "Homepage featured section updated")}>Save Featured Section</button>
          </article>

          <article className="premium-card p-4">
            <h4 className="text-base font-bold text-white">Homepage Trust Section</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="field"><span className="field-label">Kicker</span><input className="field-input" value={content.homepageTrust.kicker} onChange={(event) => setContent((prev) => ({ ...prev, homepageTrust: { ...prev.homepageTrust, kicker: event.target.value } }))} /></label>
              <label className="field"><span className="field-label">Title</span><input className="field-input" value={content.homepageTrust.title} onChange={(event) => setContent((prev) => ({ ...prev, homepageTrust: { ...prev.homepageTrust, title: event.target.value } }))} /></label>
              <label className="field md:col-span-2"><span className="field-label">Description</span><input className="field-input" value={content.homepageTrust.description} onChange={(event) => setContent((prev) => ({ ...prev, homepageTrust: { ...prev.homepageTrust, description: event.target.value } }))} /></label>
            </div>
            <button type="button" className="btn-primary mt-4 md:w-auto" onClick={() => saveContentSection("homepageTrust", content.homepageTrust, "Homepage trust section updated")}>Save Trust Section</button>
          </article>

          <article className="premium-card p-4">
            <h4 className="text-base font-bold text-white">Homepage Highlights Section</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="field"><span className="field-label">Kicker</span><input className="field-input" value={content.homepageHighlights.kicker} onChange={(event) => setContent((prev) => ({ ...prev, homepageHighlights: { ...prev.homepageHighlights, kicker: event.target.value } }))} /></label>
              <label className="field"><span className="field-label">Title</span><input className="field-input" value={content.homepageHighlights.title} onChange={(event) => setContent((prev) => ({ ...prev, homepageHighlights: { ...prev.homepageHighlights, title: event.target.value } }))} /></label>
              <label className="field md:col-span-2"><span className="field-label">Description</span><input className="field-input" value={content.homepageHighlights.description} onChange={(event) => setContent((prev) => ({ ...prev, homepageHighlights: { ...prev.homepageHighlights, description: event.target.value } }))} /></label>
            </div>
            <button type="button" className="btn-primary mt-4 md:w-auto" onClick={() => saveContentSection("homepageHighlights", content.homepageHighlights, "Homepage highlights section updated")}>Save Highlights Section</button>
          </article>

          <article className="premium-card p-4">
            <h4 className="text-base font-bold text-white">Homepage Final CTA</h4>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="field"><span className="field-label">Kicker</span><input className="field-input" value={content.homepageFinalCta.kicker} onChange={(event) => setContent((prev) => ({ ...prev, homepageFinalCta: { ...prev.homepageFinalCta, kicker: event.target.value } }))} /></label>
              <label className="field"><span className="field-label">Title</span><input className="field-input" value={content.homepageFinalCta.title} onChange={(event) => setContent((prev) => ({ ...prev, homepageFinalCta: { ...prev.homepageFinalCta, title: event.target.value } }))} /></label>
              <label className="field md:col-span-2"><span className="field-label">Description</span><input className="field-input" value={content.homepageFinalCta.description} onChange={(event) => setContent((prev) => ({ ...prev, homepageFinalCta: { ...prev.homepageFinalCta, description: event.target.value } }))} /></label>
              <label className="field"><span className="field-label">Primary CTA</span><input className="field-input" value={content.homepageFinalCta.primaryCtaLabel} onChange={(event) => setContent((prev) => ({ ...prev, homepageFinalCta: { ...prev.homepageFinalCta, primaryCtaLabel: event.target.value } }))} /></label>
              <label className="field"><span className="field-label">Secondary CTA</span><input className="field-input" value={content.homepageFinalCta.secondaryCtaLabel} onChange={(event) => setContent((prev) => ({ ...prev, homepageFinalCta: { ...prev.homepageFinalCta, secondaryCtaLabel: event.target.value } }))} /></label>
            </div>
            <button type="button" className="btn-primary mt-4 md:w-auto" onClick={() => saveContentSection("homepageFinalCta", content.homepageFinalCta, "Homepage final CTA updated")}>Save Final CTA</button>
          </article>

          <article className="premium-card p-4">
            <h4 className="text-base font-bold text-white">Public Page Intros</h4>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              <div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Services Intro</p>
                <label className="field"><span className="field-label">Kicker</span><input className="field-input" value={content.servicesIntro.kicker} onChange={(event) => setContent((prev) => ({ ...prev, servicesIntro: { ...prev.servicesIntro, kicker: event.target.value } }))} /></label>
                <label className="field"><span className="field-label">Title</span><input className="field-input" value={content.servicesIntro.title} onChange={(event) => setContent((prev) => ({ ...prev, servicesIntro: { ...prev.servicesIntro, title: event.target.value } }))} /></label>
                <label className="field"><span className="field-label">Description</span><input className="field-input" value={content.servicesIntro.description} onChange={(event) => setContent((prev) => ({ ...prev, servicesIntro: { ...prev.servicesIntro, description: event.target.value } }))} /></label>
                <button type="button" className="btn-secondary md:w-auto" onClick={() => saveContentSection("servicesIntro", content.servicesIntro, "Services intro updated")}>Save Services Intro</button>
              </div>

              <div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Packages Intro</p>
                <label className="field"><span className="field-label">Kicker</span><input className="field-input" value={content.packagesIntro.kicker} onChange={(event) => setContent((prev) => ({ ...prev, packagesIntro: { ...prev.packagesIntro, kicker: event.target.value } }))} /></label>
                <label className="field"><span className="field-label">Title</span><input className="field-input" value={content.packagesIntro.title} onChange={(event) => setContent((prev) => ({ ...prev, packagesIntro: { ...prev.packagesIntro, title: event.target.value } }))} /></label>
                <label className="field"><span className="field-label">Description</span><input className="field-input" value={content.packagesIntro.description} onChange={(event) => setContent((prev) => ({ ...prev, packagesIntro: { ...prev.packagesIntro, description: event.target.value } }))} /></label>
                <button type="button" className="btn-secondary md:w-auto" onClick={() => saveContentSection("packagesIntro", content.packagesIntro, "Packages intro updated")}>Save Packages Intro</button>
              </div>

              <div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Gallery Intro</p>
                <label className="field"><span className="field-label">Kicker</span><input className="field-input" value={content.galleryIntro.kicker} onChange={(event) => setContent((prev) => ({ ...prev, galleryIntro: { ...prev.galleryIntro, kicker: event.target.value } }))} /></label>
                <label className="field"><span className="field-label">Title</span><input className="field-input" value={content.galleryIntro.title} onChange={(event) => setContent((prev) => ({ ...prev, galleryIntro: { ...prev.galleryIntro, title: event.target.value } }))} /></label>
                <label className="field"><span className="field-label">Description</span><input className="field-input" value={content.galleryIntro.description} onChange={(event) => setContent((prev) => ({ ...prev, galleryIntro: { ...prev.galleryIntro, description: event.target.value } }))} /></label>
                <button type="button" className="btn-secondary md:w-auto" onClick={() => saveContentSection("galleryIntro", content.galleryIntro, "Gallery intro updated")}>Save Gallery Intro</button>
              </div>

              <div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Reviews Intro</p>
                <label className="field"><span className="field-label">Kicker</span><input className="field-input" value={content.reviewsIntro.kicker} onChange={(event) => setContent((prev) => ({ ...prev, reviewsIntro: { ...prev.reviewsIntro, kicker: event.target.value } }))} /></label>
                <label className="field"><span className="field-label">Title</span><input className="field-input" value={content.reviewsIntro.title} onChange={(event) => setContent((prev) => ({ ...prev, reviewsIntro: { ...prev.reviewsIntro, title: event.target.value } }))} /></label>
                <label className="field"><span className="field-label">Description</span><input className="field-input" value={content.reviewsIntro.description} onChange={(event) => setContent((prev) => ({ ...prev, reviewsIntro: { ...prev.reviewsIntro, description: event.target.value } }))} /></label>
                <button type="button" className="btn-secondary md:w-auto" onClick={() => saveContentSection("reviewsIntro", content.reviewsIntro, "Reviews intro updated")}>Save Reviews Intro</button>
              </div>

              <div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3 lg:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300">About Intro</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="field"><span className="field-label">Kicker</span><input className="field-input" value={content.aboutIntro.kicker} onChange={(event) => setContent((prev) => ({ ...prev, aboutIntro: { ...prev.aboutIntro, kicker: event.target.value } }))} /></label>
                  <label className="field"><span className="field-label">Title</span><input className="field-input" value={content.aboutIntro.title} onChange={(event) => setContent((prev) => ({ ...prev, aboutIntro: { ...prev.aboutIntro, title: event.target.value } }))} /></label>
                  <label className="field"><span className="field-label">Paragraph One</span><input className="field-input" value={content.aboutIntro.paragraphOne} onChange={(event) => setContent((prev) => ({ ...prev, aboutIntro: { ...prev.aboutIntro, paragraphOne: event.target.value } }))} /></label>
                  <label className="field"><span className="field-label">Paragraph Two</span><input className="field-input" value={content.aboutIntro.paragraphTwo} onChange={(event) => setContent((prev) => ({ ...prev, aboutIntro: { ...prev.aboutIntro, paragraphTwo: event.target.value } }))} /></label>
                </div>
                <button type="button" className="btn-secondary md:w-auto" onClick={() => saveContentSection("aboutIntro", content.aboutIntro, "About intro updated")}>Save About Intro</button>
              </div>
            </div>
          </article>

          <article className="premium-card p-4">
            <h4 className="text-base font-bold text-white">Dynamic Services</h4>
            <div className="mt-3 grid gap-3">
              {content.services.map((item, index) => (
                <div key={item.id} className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="field"><span className="field-label">Title</span><input className="field-input" value={item.title} onChange={(event) => setOrderedServices(content.services.map((row, rowIndex) => rowIndex === index ? { ...row, title: event.target.value } : row))} /></label>
                    <label className="field"><span className="field-label">Icon (optional)</span><input className="field-input" value={item.icon || ""} onChange={(event) => setOrderedServices(content.services.map((row, rowIndex) => rowIndex === index ? { ...row, icon: event.target.value } : row))} /></label>
                    <label className="field md:col-span-2"><span className="field-label">Description</span><input className="field-input" value={item.description} onChange={(event) => setOrderedServices(content.services.map((row, rowIndex) => rowIndex === index ? { ...row, description: event.target.value } : row))} /></label>
                  </div>
                  <AdminImageField
                    label="Service Image"
                    scope="services"
                    uploadTitle={item.title || `Service ${index + 1}`}
                    fallbackSrc="/images/dj/dj-press-live-performance.jpg"
                    value={item.imageAsset}
                    legacyUrl={item.image}
                    previewClassName="h-28 w-full rounded-xl object-cover"
                    onChange={(next) => setOrderedServices(content.services.map((row, rowIndex) => rowIndex === index ? { ...row, imageAsset: next, image: "" } : row))}
                    onLegacyClear={() => setOrderedServices(content.services.map((row, rowIndex) => rowIndex === index ? { ...row, image: "" } : row))}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-ghost" onClick={() => setOrderedServices(moveItem(content.services, index, "up"))} disabled={index === 0}>Move Up</button>
                    <button type="button" className="btn-ghost" onClick={() => setOrderedServices(moveItem(content.services, index, "down"))} disabled={index === content.services.length - 1}>Move Down</button>
                    <button type="button" className="btn-secondary" onClick={() => setOrderedServices(content.services.filter((_, rowIndex) => rowIndex !== index))}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" onClick={() => setOrderedServices([...content.services, { id: createStableId("service"), title: "", description: "", icon: "", image: "", imageAsset: undefined, order: content.services.length }])}>Add Service</button>
              <button type="button" className="btn-primary" onClick={() => saveContentSection("services", content.services, "Services updated")}>Save Services</button>
            </div>
          </article>

          <article className="premium-card p-4">
            <h4 className="text-base font-bold text-white">Dynamic Packages</h4>
            <div className="mt-3 grid gap-3">
              {content.packages.map((item, index) => (
                <div key={item.id} className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="field"><span className="field-label">Name</span><input className="field-input" value={item.name} onChange={(event) => setOrderedPackages(content.packages.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value } : row))} /></label>
                    <label className="field"><span className="field-label">Price</span><input className="field-input" value={item.price} onChange={(event) => setOrderedPackages(content.packages.map((row, rowIndex) => rowIndex === index ? { ...row, price: event.target.value } : row))} /></label>
                    <label className="field md:col-span-2"><span className="field-label">Features (one per line)</span><textarea className="field-input min-h-[90px]" value={item.features.join("\n")} onChange={(event) => setOrderedPackages(content.packages.map((row, rowIndex) => rowIndex === index ? { ...row, features: event.target.value.split("\n").map((feature) => feature.trim()).filter(Boolean) } : row))} /></label>
                    <label className="field"><span className="field-label">Highlight</span><select className="field-input" value={item.highlight ? "yes" : "no"} onChange={(event) => setOrderedPackages(content.packages.map((row, rowIndex) => rowIndex === index ? { ...row, highlight: event.target.value === "yes" } : row))}><option value="no">No</option><option value="yes">Yes</option></select></label>
                  </div>
                  <AdminImageField
                    label="Package Image"
                    scope="packages"
                    uploadTitle={item.name || `Package ${index + 1}`}
                    fallbackSrc="/images/dj/dj-press-live-performance.jpg"
                    value={item.imageAsset}
                    previewClassName="h-28 w-full rounded-xl object-cover"
                    onChange={(next) => setOrderedPackages(content.packages.map((row, rowIndex) => rowIndex === index ? { ...row, imageAsset: next } : row))}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-ghost" onClick={() => setOrderedPackages(moveItem(content.packages, index, "up"))} disabled={index === 0}>Move Up</button>
                    <button type="button" className="btn-ghost" onClick={() => setOrderedPackages(moveItem(content.packages, index, "down"))} disabled={index === content.packages.length - 1}>Move Down</button>
                    <button type="button" className="btn-secondary" onClick={() => setOrderedPackages(content.packages.filter((_, rowIndex) => rowIndex !== index))}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" onClick={() => setOrderedPackages([...content.packages, { id: createStableId("package"), name: "", price: "", features: [], highlight: false, imageAsset: undefined, order: content.packages.length }])}>Add Package</button>
              <button type="button" className="btn-primary" onClick={() => saveContentSection("packages", content.packages, "Packages updated")}>Save Packages</button>
            </div>
          </article>

          <article className="premium-card p-4">
            <h4 className="text-base font-bold text-white">Dynamic Gallery</h4>
            <p className="mt-1 text-xs text-slate-400">Images upload into managed storage. Video entries continue using direct URLs.</p>
            <div className="mt-3 grid gap-3">
              {content.gallery.map((item, index) => (
                <div key={item.id} className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="field"><span className="field-label">Media Type</span><select className="field-input" value={item.type} onChange={(event) => setOrderedGallery(content.gallery.map((row, rowIndex) => rowIndex === index ? { ...row, type: event.target.value === "video" ? "video" : "image" } : row))}><option value="image">Image</option><option value="video">Video</option></select></label>
                    <label className="field"><span className="field-label">Title</span><input className="field-input" value={item.title || ""} onChange={(event) => setOrderedGallery(content.gallery.map((row, rowIndex) => rowIndex === index ? { ...row, title: event.target.value } : row))} /></label>
                    <label className="field"><span className="field-label">Caption</span><input className="field-input" value={item.caption || ""} onChange={(event) => setOrderedGallery(content.gallery.map((row, rowIndex) => rowIndex === index ? { ...row, caption: event.target.value } : row))} /></label>
                    <label className="field"><span className="field-label">Alt Text</span><input className="field-input" value={item.alt || ""} onChange={(event) => setOrderedGallery(content.gallery.map((row, rowIndex) => rowIndex === index ? { ...row, alt: event.target.value } : row))} /></label>
                    {item.type === "video" ? (
                      <label className="field md:col-span-2"><span className="field-label">Video URL</span><input className="field-input" value={item.url} onChange={(event) => setOrderedGallery(content.gallery.map((row, rowIndex) => rowIndex === index ? { ...row, url: event.target.value } : row))} /></label>
                    ) : null}
                  </div>
                  {item.type === "image" ? (
                    <AdminImageField
                      label="Gallery Image"
                      scope="gallery"
                      uploadTitle={item.title || item.caption || `Gallery ${index + 1}`}
                      fallbackSrc="/images/branding/dj-press-logo-press.png"
                      value={item.imageAsset}
                      legacyUrl={item.url}
                      previewClassName="h-28 w-full rounded-xl object-cover"
                      onChange={(next) => setOrderedGallery(content.gallery.map((row, rowIndex) => rowIndex === index ? { ...row, imageAsset: next, url: next?.url || "/images/branding/dj-press-logo-press.png" } : row))}
                      onLegacyClear={() => setOrderedGallery(content.gallery.map((row, rowIndex) => rowIndex === index ? { ...row, url: "/images/branding/dj-press-logo-press.png" } : row))}
                    />
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-ghost" onClick={() => setOrderedGallery(moveItem(content.gallery, index, "up"))} disabled={index === 0}>Move Up</button>
                    <button type="button" className="btn-ghost" onClick={() => setOrderedGallery(moveItem(content.gallery, index, "down"))} disabled={index === content.gallery.length - 1}>Move Down</button>
                    <button type="button" className="btn-secondary" onClick={() => setOrderedGallery(content.gallery.filter((_, rowIndex) => rowIndex !== index))}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" onClick={() => setOrderedGallery([...content.gallery, { id: createStableId("gallery"), url: "/images/branding/dj-press-logo-press.png", type: "image", title: "", caption: "", alt: "", imageAsset: undefined, order: content.gallery.length }])}>Add Gallery Item</button>
              <button type="button" className="btn-primary" onClick={() => saveContentSection("gallery", content.gallery, "Gallery items updated")}>Save Gallery</button>
            </div>
          </article>

          <article className="premium-card p-4">
            <h4 className="text-base font-bold text-white">Dynamic Reviews</h4>
            <div className="mt-3 grid gap-3">
              {content.reviews.map((item, index) => (
                <div key={item.id} className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="field"><span className="field-label">Name</span><input className="field-input" value={item.name} onChange={(event) => setReviews(content.reviews.map((row, rowIndex) => rowIndex === index ? { ...row, name: event.target.value } : row))} /></label>
                    <label className="field"><span className="field-label">Rating (1-5)</span><input className="field-input" type="number" min={1} max={5} value={item.rating} onChange={(event) => setReviews(content.reviews.map((row, rowIndex) => rowIndex === index ? { ...row, rating: Number(event.target.value) || 5 } : row))} /></label>
                    <label className="field md:col-span-2"><span className="field-label">Review Text</span><textarea className="field-input min-h-[90px]" value={item.text} onChange={(event) => setReviews(content.reviews.map((row, rowIndex) => rowIndex === index ? { ...row, text: event.target.value } : row))} /></label>
                    <label className="field"><span className="field-label">Approved</span><select className="field-input" value={item.approved ? "yes" : "no"} onChange={(event) => setReviews(content.reviews.map((row, rowIndex) => rowIndex === index ? { ...row, approved: event.target.value === "yes" } : row))}><option value="yes">Yes</option><option value="no">No</option></select></label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-ghost" onClick={() => setReviews(moveItem(content.reviews, index, "up"))} disabled={index === 0}>Move Up</button>
                    <button type="button" className="btn-ghost" onClick={() => setReviews(moveItem(content.reviews, index, "down"))} disabled={index === content.reviews.length - 1}>Move Down</button>
                    <button type="button" className="btn-secondary" onClick={() => setReviews(content.reviews.filter((_, rowIndex) => rowIndex !== index))}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" onClick={() => setReviews([...content.reviews, { id: createStableId("review"), name: "", rating: 5, text: "", approved: true }])}>Add Review</button>
              <button type="button" className="btn-primary" onClick={() => saveContentSection("reviews", content.reviews, "Reviews updated")}>Save Reviews</button>
            </div>
          </article>

          <article className="premium-card p-4">
            <h4 className="text-base font-bold text-white">About Stats</h4>
            <div className="mt-3 grid gap-3">
              {content.aboutStats.map((item, index) => (
                <div key={item.id} className="grid gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="field"><span className="field-label">Label</span><input className="field-input" value={item.label} onChange={(event) => setAboutStats(content.aboutStats.map((row, rowIndex) => rowIndex === index ? { ...row, label: event.target.value } : row))} /></label>
                    <label className="field"><span className="field-label">Value</span><input className="field-input" value={item.value} onChange={(event) => setAboutStats(content.aboutStats.map((row, rowIndex) => rowIndex === index ? { ...row, value: event.target.value } : row))} /></label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="btn-ghost" onClick={() => setAboutStats(moveItem(content.aboutStats, index, "up"))} disabled={index === 0}>Move Up</button>
                    <button type="button" className="btn-ghost" onClick={() => setAboutStats(moveItem(content.aboutStats, index, "down"))} disabled={index === content.aboutStats.length - 1}>Move Down</button>
                    <button type="button" className="btn-secondary" onClick={() => setAboutStats(content.aboutStats.filter((_, rowIndex) => rowIndex !== index))}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-secondary" onClick={() => setAboutStats([...content.aboutStats, { id: createStableId("about-stat"), label: "", value: "" }])}>Add About Stat</button>
              <button type="button" className="btn-primary" onClick={() => saveContentSection("aboutStats", content.aboutStats, "About stats updated")}>Save About Stats</button>
            </div>
          </article>
        </div>

        {contentMessage ? <p className="status-ok mt-3">{contentMessage}</p> : null}
        {contentError ? <p className="status-bad mt-3">{contentError}</p> : null}
      </section>

      {loading ? <p className="text-sm text-slate-300">Loading admin data...</p> : null}
    </div>
  );
}
