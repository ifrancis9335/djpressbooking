"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminNotification } from "../../../types/notification";
import { fetchAdminNotifications, markAdminNotificationRead, openAdminNotificationsStream } from "../../../lib/admin/notifications-admin";

interface UseAdminNotificationsArgs {
  enabled: boolean;
  getAdminCsrfHeader: () => Record<string, string>;
}

type ConnectionState = "connecting" | "live" | "disconnected";

export function useAdminNotifications({ enabled, getAdminCsrfHeader }: UseAdminNotificationsArgs) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.read).length, [notifications]);

  const loadNotifications = useCallback(async () => {
    if (!enabled) {
      return;
    }

    try {
      const payload = await fetchAdminNotifications();
      setNotifications(payload.notifications || []);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load notifications");
    }
  }, [enabled]);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        void getAdminCsrfHeader();
        const payload = await markAdminNotificationRead(id);
        setNotifications((prev) => prev.map((item) => (item.id === id ? payload.notification : item)));
      } catch (markError) {
        setError(markError instanceof Error ? markError.message : "Unable to update notification");
      }
    },
    [getAdminCsrfHeader]
  );

  useEffect(() => {
    if (!enabled) {
      setNotifications([]);
      setConnectionState("disconnected");
      setError(null);
      return;
    }

    void loadNotifications();
    setConnectionState("connecting");

  const source = openAdminNotificationsStream();

    source.addEventListener("ready", () => {
      setConnectionState("live");
    });

    source.addEventListener("snapshot", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as { notifications?: AdminNotification[] };
        setNotifications(payload.notifications || []);
        setConnectionState("live");
        setError(null);
      } catch {
        setConnectionState("disconnected");
        setError("Unable to parse notification stream");
      }
    });

    source.addEventListener("error", (event) => {
      const payload = (event as MessageEvent).data;
      if (payload) {
        try {
          const parsed = JSON.parse(payload) as { message?: string };
          setError(parsed.message || "Notification stream error");
        } catch {
          setError("Notification stream error");
        }
      }
      setConnectionState("disconnected");
    });

    source.onerror = () => {
      setConnectionState("disconnected");
    };

    return () => {
      source.close();
    };
  }, [enabled, loadNotifications]);

  return {
    notifications,
    unreadCount,
    connectionState,
    error,
    markAsRead
  };
}