"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AdminWorkspacePage } from "../admin-workspace-page";
import { AdminAIInsights } from "../dashboard/AdminAIInsights";
import { AdminBookingsWorkspace } from "../dashboard/AdminBookingsWorkspace";
import { useAdminApp } from "../admin-app-context";
import { useAdminContentWorkspace } from "./useAdminContentWorkspace";

export function AdminBookingsRoute() {
  const { refreshSummary } = useAdminApp();
  const searchParams = useSearchParams();
  const [refreshToken, setRefreshToken] = useState(0);
  const { settings, content, loading, loadError, reload } = useAdminContentWorkspace(refreshSummary);

  const focusRequest = useMemo(() => {
    const bookingId = searchParams.get("focus");
    return bookingId ? { bookingId, token: Date.now() + refreshToken } : null;
  }, [refreshToken, searchParams]);

  const handleMutation = async () => {
    setRefreshToken((current) => current + 1);
    await refreshSummary();
  };

  return (
    <AdminWorkspacePage
      kicker="Bookings"
      title="Bookings Workspace"
      description="Manage active booking records, status updates, thread responses, direct email, and AI-assisted triage in one dedicated route."
      actions={<button type="button" className="btn-secondary md:w-auto" onClick={() => void reload()}>Reload Workspace Data</button>}
    >
      {loading ? <section className="glass-panel p-5 md:p-6"><p className="text-sm text-slate-300">Loading booking workspace...</p></section> : null}
      {loadError ? <section className="glass-panel p-5 md:p-6"><p className="status-bad">{loadError}</p></section> : null}
      {!loading && !loadError ? (
        <>
          <AdminAIInsights refreshToken={refreshToken} onMutation={() => void handleMutation()} />
          <AdminBookingsWorkspace
            settings={settings}
            content={content}
            focusRequest={focusRequest}
            refreshToken={refreshToken}
            onBookingMutation={() => void handleMutation()}
            viewMode="active"
          />
        </>
      ) : null}
    </AdminWorkspacePage>
  );
}
