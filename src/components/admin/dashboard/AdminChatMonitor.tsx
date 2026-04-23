"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminChatSession, fetchAdminChatSessions } from "../../../lib/admin/chat-monitor-admin";

type ChatSession = AdminChatSession;

interface AlertSession extends ChatSession {
  alertedAt: number;
}

function formatSessionDate(timestamp: unknown) {
  if (!timestamp) return "N/A";
  const date = new Date(String(timestamp));
  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function AdminChatMonitor() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [activeAlert, setActiveAlert] = useState<AlertSession | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const alertedSessionsRef = useRef<Set<string>>(new Set());
  const sessionsRef = useRef<ChatSession[]>([]);

  // Tick every second so "X sec ago" stays live
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const secondsAgo = lastUpdated ? Math.floor((nowTick - lastUpdated.getTime()) / 1000) : null;

  const playAlertSound = useCallback(() => {
    try {
      const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) {
        return;
      }

      const audioContext = new AudioContextCtor();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch {
      // Ignore audio playback failures silently.
    }
  }, []);

  const checkForNewReadySessions = useCallback((newSessions: ChatSession[], oldSessions: ChatSession[]) => {
    const oldReadyIds = new Set(oldSessions.filter((old) => old.readyForBooking).map((old) => old.id));
    const newReadySessions = newSessions.filter(
      (session) => session.readyForBooking && !alertedSessionsRef.current.has(session.id) && !oldReadyIds.has(session.id)
    );

    if (newReadySessions.length > 0) {
      const latestSession = { ...newReadySessions[0], alertedAt: Date.now() };
      setActiveAlert(latestSession);
      alertedSessionsRef.current.add(latestSession.id);
      playAlertSound();

      window.setTimeout(() => setActiveAlert(null), 5000);
    }
  }, [playAlertSound]);

  const fetchSessions = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (silent) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      setError(null);
      const data = await fetchAdminChatSessions({ filter: "recent", limit: 15 });
      const newSessions = data.sessions || [];
      checkForNewReadySessions(newSessions, sessionsRef.current);
      sessionsRef.current = newSessions;
      setSessions(newSessions);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching sessions");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [checkForNewReadySessions]);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void fetchSessions({ silent: true });
      }
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoRefreshEnabled, fetchSessions]);

  const readyCount = useMemo(() => sessions.filter((session) => session.readyForBooking).length, [sessions]);
  const statusBadgeColor = readyCount > 0 ? "bg-amber-500" : "bg-slate-600";
  const formattedSessions = useMemo(
    () => sessions.map((session) => ({ ...session, formattedCreatedAt: formatSessionDate(session.createdAt), formattedUpdatedAt: formatSessionDate(session.updatedAt) })),
    [sessions]
  );

  return (
    <section id="chat-monitor" className="glass-panel p-5 md:p-6">
      {activeAlert && (
        <div className="mb-4 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4 shadow-lg shadow-amber-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-bold text-amber-300">New Booking Ready!</p>
              <p className="mt-1 text-sm text-amber-200">
                {activeAlert.eventType || "Event"} in {activeAlert.location || "TBD"} • {activeAlert.guestCount || "?"} guests
              </p>
            </div>
            <button onClick={() => setActiveAlert(null)} className="text-amber-400 hover:text-amber-300">
              ×
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-bold text-white">
            Chat Monitor
            {readyCount > 0 && (
              <span className={`${statusBadgeColor} rounded-full px-2 py-1 text-xs font-bold text-white`}>
                {readyCount} Ready
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm text-slate-300">Track live chat sessions and booking conversions.</p>
        </div>
        <button
          onClick={() => setAutoRefreshEnabled((current) => !current)}
          className={`btn-secondary whitespace-nowrap ${autoRefreshEnabled ? "ring-1 ring-amber-500" : ""}`}
        >
          {autoRefreshEnabled ? "Auto-Refresh On" : "Auto-Refresh Off"}
        </button>
      </div>

      {error && <div className="mt-4 rounded-lg bg-red-900/30 p-3 text-sm text-red-300">{error}</div>}

      {loading ? (
        <div className="mt-4 text-sm text-slate-400">Loading chat sessions...</div>
      ) : formattedSessions.length === 0 ? (
        <div className="mt-4 rounded-lg bg-slate-800/50 p-6 text-center">
          <p className="text-sm text-slate-300">No chat sessions yet. Sessions will appear here as users interact with the chat widget.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-400">Event Type</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-400">Date</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-400">Location</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-400">Guests</th>
                <th className="px-3 py-2 text-center text-xs font-semibold uppercase text-slate-400">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-400">Created</th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-400">Updated</th>
                <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {formattedSessions.map((session) => (
                <tr key={session.id} className={`hover:bg-slate-800/30 ${session.readyForBooking ? "bg-amber-500/5" : ""}`}>
                  <td className="px-3 py-2 text-slate-300">{session.eventType || "-"}</td>
                  <td className="px-3 py-2 text-slate-300">{session.eventDate || "-"}</td>
                  <td className="px-3 py-2 text-slate-300">{session.location || "-"}</td>
                  <td className="px-3 py-2 text-slate-300">{session.guestCount ? `${session.guestCount} people` : "-"}</td>
                  <td className="px-3 py-2 text-center">
                    {session.readyForBooking ? (
                      <span className="inline-block rounded-full bg-amber-500/20 px-2 py-1 text-xs font-bold text-amber-300">Ready</span>
                    ) : (
                      <span className="inline-block rounded-full bg-slate-700/50 px-2 py-1 text-xs text-slate-400">Browsing</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-400">{session.formattedCreatedAt}</td>
                  <td className="px-3 py-2 text-xs text-slate-400">{session.formattedUpdatedAt}</td>
                  <td className="px-3 py-2 text-right">
                    {session.readyForBooking ? (
                      <button
                        onClick={() => router.push("/admin/bookings")}
                        className="rounded bg-amber-600/30 px-2 py-1 text-xs font-bold text-amber-300 transition-colors hover:bg-amber-600/50"
                      >
                        View Booking Inbox
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-700 pt-4 text-xs text-slate-400">
        <p>
          Showing {formattedSessions.length} recent sessions
          {secondsAgo !== null ? ` • Last updated: ${secondsAgo}s ago` : ""}
          {isRefreshing ? " • Refreshing..." : ""}
        </p>
        <button
          onClick={() => void fetchSessions({ silent: true })}
          className="rounded border border-slate-600 px-3 py-1 transition-colors hover:border-slate-400 hover:text-slate-300"
          disabled={isRefreshing}
        >
          {isRefreshing ? "Refreshing..." : "Refresh Now"}
        </button>
      </div>
    </section>
  );
}
