"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAdminNotifications } from "./dashboard/useAdminNotifications";
import type { DashboardSummary } from "./dashboard/types";
import { fetchAdminSummary } from "../../lib/admin/content-settings-admin";
import { fetchAdminSession, loginAdmin, logoutAdmin } from "../../lib/admin/auth-admin";
import { readCookieValue } from "../../utils/csrf";

interface AdminAppContextValue {
  configured: boolean;
  authenticated: boolean;
  sessionLoading: boolean;
  authLoading: boolean;
  authError: string | null;
  authMessage: string | null;
  summary: DashboardSummary | null;
  summaryLoading: boolean;
  summaryError: string | null;
  unreadCount: number;
  connectionState: "connecting" | "live" | "disconnected";
  notificationsError: string | null;
  notifications: ReturnType<typeof useAdminNotifications>["notifications"];
  markAsRead: ReturnType<typeof useAdminNotifications>["markAsRead"];
  refreshSummary: () => Promise<void>;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  getAdminCsrfHeader: () => Record<string, string>;
}

const AdminAppContext = createContext<AdminAppContextValue | null>(null);

export function AdminAppProvider({ children }: { children: ReactNode }) {
  const [configured, setConfigured] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const getAdminCsrfHeader = useCallback(() => ({ "X-CSRF-Token": readCookieValue("dj_admin_csrf") }), []);

  const {
    notifications,
    unreadCount,
    connectionState,
    error: notificationsError,
    markAsRead
  } = useAdminNotifications({ enabled: authenticated, getAdminCsrfHeader });

  const refreshSummary = useCallback(async () => {
    if (!authenticated) {
      setSummary(null);
      return;
    }

    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const payload = await fetchAdminSummary();
      setSummary(payload.summary);
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "Unable to load admin summary");
    } finally {
      setSummaryLoading(false);
    }
  }, [authenticated]);

  const loadSession = useCallback(async () => {
    setSessionLoading(true);
    setAuthError(null);
    try {
      const payload = await fetchAdminSession();
      setConfigured(payload.configured);
      setAuthenticated(payload.authenticated);
      if (!payload.authenticated) {
        setSummary(null);
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to load admin session");
      setAuthenticated(false);
      setSummary(null);
    } finally {
      setSessionLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!sessionLoading && authenticated) {
      void refreshSummary();
    }
  }, [authenticated, refreshSummary, sessionLoading]);

  const login = useCallback(async (password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    setAuthMessage(null);
    try {
      await loginAdmin(password);
      setAuthenticated(true);
      setAuthMessage("Authenticated successfully.");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to authenticate");
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await logoutAdmin();
    setAuthenticated(false);
    setSummary(null);
    setAuthMessage("Signed out.");
    setAuthError(null);
  }, []);

  const value = useMemo<AdminAppContextValue>(() => ({
    configured,
    authenticated,
    sessionLoading,
    authLoading,
    authError,
    authMessage,
    summary,
    summaryLoading,
    summaryError,
    notifications,
    unreadCount,
    connectionState,
    notificationsError,
    markAsRead,
    refreshSummary,
    login,
    logout,
    getAdminCsrfHeader
  }), [authError, authLoading, authMessage, authenticated, configured, connectionState, getAdminCsrfHeader, login, logout, markAsRead, notifications, notificationsError, refreshSummary, sessionLoading, summary, summaryError, summaryLoading, unreadCount]);

  return <AdminAppContext.Provider value={value}>{children}</AdminAppContext.Provider>;
}

export function useAdminApp() {
  const context = useContext(AdminAppContext);
  if (!context) {
    throw new Error("useAdminApp must be used inside AdminAppProvider");
  }
  return context;
}
