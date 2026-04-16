"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { readCookieValue } from "../../utils/csrf";
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
import { AdminDashboardShell } from "./dashboard/AdminDashboardShell";
import { AdminNotificationsBell } from "./dashboard/AdminNotificationsBell";
import { AdminNotificationsPanel } from "./dashboard/AdminNotificationsPanel";
import { BlockedDatesManager } from "./dashboard/BlockedDatesManager";
import { AdminBookingsManager } from "./dashboard/AdminBookingsManager";
import { ContactSettingsManager } from "./dashboard/ContactSettingsManager";
import { PackagePricingManager } from "./dashboard/PackagePricingManager";
import { BookingSettingsManager } from "./dashboard/BookingSettingsManager";
import { SiteSettingsManager } from "./dashboard/SiteSettingsManager";
import { BrandingManager } from "./dashboard/BrandingManager";
import { HomepageContentManager } from "./dashboard/HomepageContentManager";
import { DynamicServicesManager } from "./dashboard/DynamicServicesManager";
import { DynamicPackagesManager } from "./dashboard/DynamicPackagesManager";
import { DynamicGalleryManager } from "./dashboard/DynamicGalleryManager";
import { DynamicReviewsManager } from "./dashboard/DynamicReviewsManager";
import { AboutStatsManager } from "./dashboard/AboutStatsManager";
import { useAdminNotifications } from "./dashboard/useAdminNotifications";
import { BlockedDateEntry, DashboardSummary } from "./dashboard/types";
import { defaultSettings, parseResponse, toIsoDateLocal, warnAdminLoadFailure } from "./dashboard/utils";
import { AdminNotification } from "../../types/notification";

interface BookingFocusRequest {
  bookingId: string;
  token: number;
}

export function AdminDashboard() {
  const router = useRouter();
  const isDev = process.env.NODE_ENV !== "production";
  const getAdminCsrfHeader = useCallback(() => ({ "X-CSRF-Token": readCookieValue("dj_admin_csrf") }), []);
  const debugLog = (...args: unknown[]) => {
    if (isDev) {
      console.info(...args);
    }
  };
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
  const [bookingFocusRequest, setBookingFocusRequest] = useState<BookingFocusRequest | null>(null);
  const [bookingsRefreshToken, setBookingsRefreshToken] = useState(0);

  const {
    notifications,
    unreadCount,
    connectionState,
    error: notificationsError,
    markAsRead
  } = useAdminNotifications({ enabled: authenticated, getAdminCsrfHeader });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsResult, contentResult, summaryResult, blockedResult] = await Promise.allSettled([
        fetch("/api/admin/settings", { cache: "no-store" }).then((res) => parseResponse<{ settings: SiteSettings }>(res)),
        fetch("/api/admin/content", { cache: "no-store" }).then((res) => parseResponse<{ content: SiteContent }>(res)),
        fetch("/api/admin/dashboard", { cache: "no-store" }).then((res) => parseResponse<{ summary: DashboardSummary }>(res)),
        fetch(`/api/availability?list=blocked&t=${Date.now()}`, { cache: "no-store" }).then((res) =>
          parseResponse<{ blockedDates: BlockedDateEntry[] }>(res)
        )
      ]);

      if (settingsResult.status === "rejected") {
        warnAdminLoadFailure("settings", settingsResult.reason);
      }

      if (contentResult.status === "rejected") {
        warnAdminLoadFailure("content", contentResult.reason);
      }

      if (summaryResult.status === "rejected") {
        warnAdminLoadFailure("dashboard", summaryResult.reason);
      }

      if (blockedResult.status === "rejected") {
        warnAdminLoadFailure("availability", blockedResult.reason);
      }

      setSettings(settingsResult.status === "fulfilled" ? settingsResult.value.settings : defaultSettings);
      setContent(contentResult.status === "fulfilled" ? contentResult.value.content : defaultSiteContent);
      setSummary(summaryResult.status === "fulfilled" ? summaryResult.value.summary : null);
      setBlockedDates(blockedResult.status === "fulfilled" ? blockedResult.value.blockedDates : []);

      if (
        settingsResult.status === "fulfilled" ||
        contentResult.status === "fulfilled" ||
        summaryResult.status === "fulfilled"
      ) {
        setAuthenticated(true);
        setAuthError(null);
      }
    } catch (error) {
      console.warn("[ADMIN LOAD PARTIAL FAILURE]", error);
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
      setAuthenticated(true);
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
        headers: { "Content-Type": "application/json", ...getAdminCsrfHeader() },
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
        headers: { "Content-Type": "application/json", ...getAdminCsrfHeader() },
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

  const focusBookingFromNotification = useCallback((notification: AdminNotification) => {
    document.getElementById("bookings-inbox")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setBookingFocusRequest({ bookingId: notification.bookingId, token: Date.now() });
    void markAsRead(notification.id);
  }, [markAsRead]);

  const quickConfirmBookingFromNotification = useCallback(async (notification: AdminNotification) => {
    try {
      const response = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...getAdminCsrfHeader() },
        body: JSON.stringify({ id: notification.bookingId, status: "confirmed" })
      });

      await parseResponse<{ message: string }>(response);
      await markAsRead(notification.id);
      setBookingsRefreshToken((current) => current + 1);
      setBookingFocusRequest({ bookingId: notification.bookingId, token: Date.now() });
    } catch (actionError) {
      setContentError(actionError instanceof Error ? actionError.message : "Unable to confirm booking from notification");
    }
  }, [getAdminCsrfHeader, markAsRead]);

  const addBlockedDate = async () => {
    if (!newBlockedDate) {
      setBlockedError("Choose a date first.");
      return;
    }

    setBlockedLoading(true);
    setBlockedError(null);
    setBlockedMessage(null);

    try {
      debugLog("[admin-dashboard] block request", { date: newBlockedDate, note: newBlockedNote });
      const response = await fetch("/api/admin/availability/block", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminCsrfHeader() },
        body: JSON.stringify({ date: newBlockedDate, note: newBlockedNote })
      });
      const payload = await parseResponse<{ blockedDate: BlockedDateEntry; message: string }>(response);
      debugLog("[admin-dashboard] block response", { date: payload.blockedDate.eventDate, status: payload.blockedDate.status });
      setNewBlockedDate("");
      setNewBlockedNote("");
      router.refresh();
      await loadDashboard();
      setBlockedMessage(`${payload.message}. Public availability has been refreshed.`);
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
      debugLog("[admin-dashboard] unblock request", { date });
      const response = await fetch("/api/admin/availability/unblock", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminCsrfHeader() },
        body: JSON.stringify({ date })
      });
      const payload = await parseResponse<{ message: string }>(response);
      debugLog("[admin-dashboard] unblock response", { date, message: payload.message });
      router.refresh();
      await loadDashboard();
      setBlockedMessage(`${payload.message}. Public availability has been refreshed.`);
    } catch (error) {
      setBlockedError(error instanceof Error ? error.message : "Unable to remove date");
    } finally {
      setBlockedLoading(false);
    }
  };

  const quickLinks = useMemo(
    () => [
      { href: "#notifications", label: "Notifications" },
      { href: "#blocked-dates", label: "Blocked Dates" },
      { href: "#bookings-inbox", label: "Bookings Inbox" },
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
      debugLog("[admin-dashboard] calendar block request", { date: iso, note: newBlockedNote });
      const response = await fetch("/api/admin/availability/block", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAdminCsrfHeader() },
        body: JSON.stringify({ date: iso, note: newBlockedNote })
      });
      const payload = await parseResponse<{ blockedDate: BlockedDateEntry; message: string }>(response);
      debugLog("[admin-dashboard] calendar block response", { date: payload.blockedDate.eventDate, status: payload.blockedDate.status });
      router.refresh();
      await loadDashboard();
      setBlockedMessage(`${payload.message}. Public availability has been refreshed.`);
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
    <AdminDashboardShell
      summary={summary}
      quickLinks={quickLinks}
      onLogout={logout}
      loading={loading}
      notificationBell={
        <AdminNotificationsBell
          notifications={notifications}
          unreadCount={unreadCount}
          connectionState={connectionState}
          onMarkAsRead={markAsRead}
          onOpenBooking={focusBookingFromNotification}
          onQuickConfirm={quickConfirmBookingFromNotification}
        />
      }
    >
      <AdminNotificationsPanel
        notifications={notifications}
        unreadCount={unreadCount}
        connectionState={connectionState}
        error={notificationsError}
        onMarkAsRead={markAsRead}
        onOpenBooking={focusBookingFromNotification}
        onQuickConfirm={quickConfirmBookingFromNotification}
      />

      <BlockedDatesManager
        blockedDates={blockedDates}
        blockedLoading={blockedLoading}
        blockedMessage={blockedMessage}
        blockedError={blockedError}
        calendarMonth={calendarMonth}
        setCalendarMonth={(updater) => setCalendarMonth(updater)}
        calendarCells={calendarCells}
        newBlockedDate={newBlockedDate}
        setNewBlockedDate={setNewBlockedDate}
        newBlockedNote={newBlockedNote}
        setNewBlockedNote={setNewBlockedNote}
        addBlockedDate={() => void addBlockedDate()}
        removeBlockedDate={(date) => void removeBlockedDate(date)}
        toggleCalendarDate={toggleCalendarDate}
      />

      <AdminBookingsManager
        settings={settings}
        content={content}
        focusRequest={bookingFocusRequest}
        refreshToken={bookingsRefreshToken}
      />

      <ContactSettingsManager
        settings={settings}
        setSettings={setSettings}
        saveContact={() => void saveSettings({ contact: settings.contact }, "contact")}
        contactMessage={contactMessage}
        contactError={contactError}
      />

      <PackagePricingManager
        settings={settings}
        setSettings={setSettings}
        savePackages={() => void saveSettings({ packages: settings.packages }, "packages")}
        packageMessage={packageMessage}
        packageError={packageError}
      />

      <BookingSettingsManager
        settings={settings}
        setSettings={setSettings}
        saveBooking={() => void saveSettings({ booking: settings.booking }, "booking")}
        bookingMessage={bookingMessage}
        bookingError={bookingError}
      />

      <SiteSettingsManager
        settings={settings}
        setSettings={setSettings}
        saveSite={() => void saveSettings({ site: settings.site }, "site")}
        siteMessage={siteMessage}
        siteError={siteError}
      />

      <section id="content-controls" className="glass-panel p-5 md:p-6">
        <h3 className="text-xl font-bold text-white">Content Controls</h3>
        <p className="mt-1 text-sm text-slate-300">Manage homepage sections, intros, and visibility toggles.</p>

        <div className="mt-4 grid gap-5">
          <BrandingManager
            content={content}
            setContent={setContent}
            save={() => void saveContentSection("branding", content.branding, "Branding updated")}
          />

          <HomepageContentManager
            content={content}
            setContent={setContent}
            saveSection={(section, value, successMessage) => void saveContentSection(section, value, successMessage)}
          />

          <DynamicServicesManager
            services={content.services}
            setOrderedServices={setOrderedServices}
            save={() => void saveContentSection("services", content.services, "Services updated")}
          />

          <DynamicPackagesManager
            packages={content.packages}
            setOrderedPackages={setOrderedPackages}
            save={() => void saveContentSection("packages", content.packages, "Packages updated")}
          />

          <DynamicGalleryManager
            gallery={content.gallery}
            setOrderedGallery={setOrderedGallery}
            save={() => void saveContentSection("gallery", content.gallery, "Gallery items updated")}
          />

          <DynamicReviewsManager
            reviews={content.reviews}
            setReviews={setReviews}
            save={() => void saveContentSection("reviews", content.reviews, "Reviews updated")}
          />

          <AboutStatsManager
            aboutStats={content.aboutStats}
            setAboutStats={setAboutStats}
            save={() => void saveContentSection("aboutStats", content.aboutStats, "About stats updated")}
          />
        </div>

        {contentMessage ? <p className="status-ok mt-3">{contentMessage}</p> : null}
        {contentError ? <p className="status-bad mt-3">{contentError}</p> : null}
      </section>
    </AdminDashboardShell>
  );
}
