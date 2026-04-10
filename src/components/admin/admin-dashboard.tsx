"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { SiteSettings } from "../../types/site-settings";

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
  const [password, setPassword] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [blockedDates, setBlockedDates] = useState<BlockedDateEntry[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newBlockedNote, setNewBlockedNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [blockedLoading, setBlockedLoading] = useState(false);

  const [contactMessage, setContactMessage] = useState<string | null>(null);
  const [packageMessage, setPackageMessage] = useState<string | null>(null);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [siteMessage, setSiteMessage] = useState<string | null>(null);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const [contactError, setContactError] = useState<string | null>(null);
  const [packageError, setPackageError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [siteError, setSiteError] = useState<string | null>(null);
  const [blockedError, setBlockedError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsPayload, summaryPayload, blockedPayload] = await Promise.all([
        fetch("/api/admin/settings", { cache: "no-store" }).then((res) => parseResponse<{ settings: SiteSettings }>(res)),
        fetch("/api/admin/dashboard", { cache: "no-store" }).then((res) => parseResponse<{ summary: DashboardSummary }>(res)),
        fetch("/api/availability?list=blocked", { cache: "no-store" }).then((res) =>
          parseResponse<{ blockedDates: BlockedDateEntry[] }>(res)
        )
      ]);

      setSettings(settingsPayload.settings);
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

  const addBlockedDate = async () => {
    if (!newBlockedDate) {
      setBlockedError("Choose a date first.");
      return;
    }

    setBlockedLoading(true);
    setBlockedError(null);
    setBlockedMessage(null);

    try {
      const response = await fetch("/api/admin/availability/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: newBlockedDate, note: newBlockedNote })
      });
      const payload = await parseResponse<{ blockedDate: BlockedDateEntry; message: string }>(response);
      setBlockedDates((prev) => [...prev.filter((item) => item.eventDate !== payload.blockedDate.eventDate), payload.blockedDate].sort((a, b) => a.eventDate.localeCompare(b.eventDate)));
      setBlockedMessage(payload.message);
      setNewBlockedDate("");
      setNewBlockedNote("");
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
      const response = await fetch("/api/admin/availability/unblock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date })
      });
      const payload = await parseResponse<{ message: string }>(response);
      setBlockedDates((prev) => prev.filter((entry) => entry.eventDate !== date));
      setBlockedMessage(payload.message);
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
      { href: "#site-settings", label: "Site Settings" }
    ],
    []
  );

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

      {loading ? <p className="text-sm text-slate-300">Loading admin data...</p> : null}
    </div>
  );
}
