"use client";

import { AdminWorkspacePage } from "../admin-workspace-page";
import { BlockedDatesManager } from "../dashboard/BlockedDatesManager";
import { useAdminApp } from "../admin-app-context";
import { useAdminBlockedDatesWorkspace } from "./useAdminBlockedDatesWorkspace";

export function AdminBlockedDatesRoute() {
  const { refreshSummary } = useAdminApp();
  const workspace = useAdminBlockedDatesWorkspace(refreshSummary);

  return (
    <AdminWorkspacePage
      kicker="Availability"
      title="Blocked Dates"
      description="Load and manage blocked-date availability independently from the dashboard."
      actions={<button type="button" className="btn-secondary md:w-auto" onClick={() => void workspace.reload()}>Refresh Dates</button>}
    >
      {workspace.loading && !workspace.blockedDates.length ? <section className="glass-panel p-5 md:p-6"><p className="text-sm text-slate-300">Loading blocked dates...</p></section> : null}
      {workspace.loadError ? <section className="glass-panel p-5 md:p-6"><p className="status-bad">{workspace.loadError}</p></section> : null}
      {!workspace.loadError ? (
        <BlockedDatesManager
          blockedDates={workspace.blockedDates}
          blockedLoading={workspace.saving}
          blockedMessage={workspace.blockedMessage}
          blockedError={workspace.blockedError}
          calendarMonth={workspace.calendarMonth}
          setCalendarMonth={workspace.setCalendarMonth}
          calendarCells={workspace.calendarCells}
          newBlockedDate={workspace.newBlockedDate}
          setNewBlockedDate={workspace.setNewBlockedDate}
          newBlockedNote={workspace.newBlockedNote}
          setNewBlockedNote={workspace.setNewBlockedNote}
          addBlockedDate={() => void workspace.addBlockedDate()}
          removeBlockedDate={(date) => void workspace.removeBlockedDate(date)}
          toggleCalendarDate={(iso, blocked) => workspace.toggleCalendarDate(iso, blocked)}
        />
      ) : null}
    </AdminWorkspacePage>
  );
}
