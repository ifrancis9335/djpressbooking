"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchAdminBookings, softDeleteAdminBooking, updateAdminBookingStatus } from "../../../lib/admin/bookings-admin";
import { analyzeBookings, AIAnalysisResult, AIInsight } from "../../../lib/admin/admin-ai";

interface AdminAIInsightsProps {
  refreshToken?: number;
  onMutation?: () => void;
}

interface InsightRowProps {
  item: AIInsight;
  actionLoading: string | null;
  onConfirm: (id: string) => Promise<void>;
  onDeleteTest: (id: string) => Promise<void>;
}

function InsightRow({ item, actionLoading, onConfirm, onDeleteTest }: InsightRowProps) {
  const borderBg =
    item.type === "warning"
      ? "border-rose-500/40 bg-rose-900/20"
      : item.type === "suggestion"
        ? "border-amber-500/40 bg-amber-900/20"
        : "border-emerald-500/40 bg-emerald-900/20";

  const textColor =
    item.type === "warning"
      ? "text-rose-300"
      : item.type === "suggestion"
        ? "text-amber-300"
        : "text-emerald-300";

  const confirmKey = item.bookingId ? item.bookingId + "_confirm" : null;
  const deleteKey = item.bookingId ? item.bookingId + "_delete_test" : null;

  return (
    <li className={`flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-start sm:justify-between ${borderBg}`}>
      <p className={`text-sm leading-relaxed ${textColor}`}>{item.message}</p>
      {item.bookingId && item.action && (
        <div className="flex shrink-0 flex-wrap gap-2">
          {item.action === "confirm" && confirmKey && (
            <button
              type="button"
              disabled={actionLoading === confirmKey}
              onClick={() => void onConfirm(item.bookingId!)}
              className="rounded border border-emerald-500/60 bg-emerald-600/80 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {actionLoading === confirmKey ? "Saving…" : "Confirm"}
            </button>
          )}
          {item.action === "delete_test" && deleteKey && (
            <button
              type="button"
              disabled={actionLoading === deleteKey}
              onClick={() => void onDeleteTest(item.bookingId!)}
              className="rounded border border-rose-500/60 bg-rose-700/80 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-600 disabled:opacity-50"
            >
              {actionLoading === deleteKey ? "Moving…" : "Move to Trash"}
            </button>
          )}
          <button
            type="button"
            disabled
            title="Coming soon"
            className="cursor-not-allowed rounded border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/40"
          >
            Follow-Up
          </button>
        </div>
      )}
    </li>
  );
}

export function AdminAIInsights({ refreshToken = 0, onMutation }: AdminAIInsightsProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResult>({
    warnings: [],
    suggestions: [],
    insights: [],
  });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadAndAnalyze = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await fetchAdminBookings({ includeDeleted: false });
      setAnalysis(analyzeBookings(payload.bookings ?? []));
    } catch {
      // Insights are non-critical — fail silently so admin panel remains functional
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAndAnalyze();
  }, [loadAndAnalyze, refreshToken]);

  const handleConfirm = async (bookingId: string) => {
    setActionError(null);
    setActionLoading(bookingId + "_confirm");
    try {
      await updateAdminBookingStatus(bookingId, "confirmed");
      onMutation?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to confirm booking");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTest = async (bookingId: string) => {
    setActionError(null);
    setActionLoading(bookingId + "_delete_test");
    try {
      await softDeleteAdminBooking(bookingId);
      onMutation?.();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Unable to move booking to trash");
    } finally {
      setActionLoading(null);
    }
  };

  const total =
    analysis.warnings.length + analysis.suggestions.length + analysis.insights.length;

  if (!loading && total === 0) return null;

  return (
    <section id="ai-insights" className="mx-auto mb-6 max-w-5xl px-4">
      <div className="glass-panel p-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-base font-bold uppercase tracking-wide text-white/90">
            AI Insights
          </h2>
          {loading && (
            <span className="text-xs text-white/40">Analyzing…</span>
          )}
          {!loading && total > 0 && (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold text-white/60">
              {total}
            </span>
          )}
        </div>

        {actionError && (
          <p className="mb-3 rounded border border-rose-500/40 bg-rose-900/20 px-3 py-2 text-sm text-rose-400">
            {actionError}
          </p>
        )}

        {analysis.warnings.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-rose-400">
              Warnings ({analysis.warnings.length})
            </h3>
            <ul className="space-y-2">
              {analysis.warnings.map((item, i) => (
                <InsightRow
                  key={`warning-${i}`}
                  item={item}
                  actionLoading={actionLoading}
                  onConfirm={handleConfirm}
                  onDeleteTest={handleDeleteTest}
                />
              ))}
            </ul>
          </div>
        )}

        {analysis.suggestions.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-400">
              Suggestions ({analysis.suggestions.length})
            </h3>
            <ul className="space-y-2">
              {analysis.suggestions.map((item, i) => (
                <InsightRow
                  key={`suggestion-${i}`}
                  item={item}
                  actionLoading={actionLoading}
                  onConfirm={handleConfirm}
                  onDeleteTest={handleDeleteTest}
                />
              ))}
            </ul>
          </div>
        )}

        {analysis.insights.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Insights ({analysis.insights.length})
            </h3>
            <ul className="space-y-2">
              {analysis.insights.map((item, i) => (
                <InsightRow
                  key={`insight-${i}`}
                  item={item}
                  actionLoading={actionLoading}
                  onConfirm={handleConfirm}
                  onDeleteTest={handleDeleteTest}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
