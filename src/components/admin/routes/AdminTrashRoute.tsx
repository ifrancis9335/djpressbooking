"use client";

import { useState } from "react";
import { AdminWorkspacePage } from "../admin-workspace-page";
import { AdminBookingsWorkspace } from "../dashboard/AdminBookingsWorkspace";
import { useAdminApp } from "../admin-app-context";
import { useAdminContentWorkspace } from "./useAdminContentWorkspace";

export function AdminTrashRoute() {
  const { refreshSummary } = useAdminApp();
  const [refreshToken, setRefreshToken] = useState(0);
  const { settings, content, loading, loadError, reload } = useAdminContentWorkspace(refreshSummary);

  const handleMutation = async () => {
    setRefreshToken((current) => current + 1);
    await refreshSummary();
  };

  return (
    <AdminWorkspacePage
      kicker="Trash"
      title="Trash Retention"
      description="Inspect deleted bookings, restore them safely, purge expired trash, and permanently remove records only when intended."
      actions={<button type="button" className="btn-secondary md:w-auto" onClick={() => void reload()}>Reload Workspace Data</button>}
    >
      {loading ? <section className="glass-panel p-5 md:p-6"><p className="text-sm text-slate-300">Loading trash workspace...</p></section> : null}
      {loadError ? <section className="glass-panel p-5 md:p-6"><p className="status-bad">{loadError}</p></section> : null}
      {!loading && !loadError ? (
        <AdminBookingsWorkspace
          settings={settings}
          content={content}
          refreshToken={refreshToken}
          onBookingMutation={() => void handleMutation()}
          viewMode="trash"
        />
      ) : null}
    </AdminWorkspacePage>
  );
}
