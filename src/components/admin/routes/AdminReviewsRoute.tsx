"use client";

import { AdminWorkspacePage } from "../admin-workspace-page";
import { DynamicReviewsManager } from "../dashboard/DynamicReviewsManager";
import { useAdminApp } from "../admin-app-context";
import { useAdminContentWorkspace } from "./useAdminContentWorkspace";

export function AdminReviewsRoute() {
  const { refreshSummary } = useAdminApp();
  const workspace = useAdminContentWorkspace(refreshSummary, { loadSettings: false, loadContent: true });

  return (
    <AdminWorkspacePage
      kicker="Reviews"
      title="Reviews Manager"
      description="Manage customer reviews in a route-isolated editor with explicit empty and save states."
      actions={<button type="button" className="btn-secondary md:w-auto" onClick={() => void workspace.reload()}>Reload Reviews</button>}
    >
      {workspace.loading ? <section className="glass-panel p-5 md:p-6"><p className="text-sm text-slate-300">Loading reviews workspace...</p></section> : null}
      {workspace.loadError ? <section className="glass-panel p-5 md:p-6"><p className="status-bad">{workspace.loadError}</p></section> : null}
      {!workspace.loading && !workspace.loadError ? (
        <section className="glass-panel p-5 md:p-6">
          {workspace.content.reviews.length === 0 ? <p className="mb-4 text-sm text-slate-300">No reviews yet. Add the first one below.</p> : null}
          <DynamicReviewsManager
            reviews={workspace.content.reviews}
            setReviews={workspace.setReviews}
            save={() => void workspace.saveContentSection("reviews", workspace.content.reviews, "Reviews updated")}
          />
          {workspace.contentMessage ? <p className="status-ok mt-3">{workspace.contentMessage}</p> : null}
          {workspace.contentError ? <p className="status-bad mt-3">{workspace.contentError}</p> : null}
        </section>
      ) : null}
    </AdminWorkspacePage>
  );
}
