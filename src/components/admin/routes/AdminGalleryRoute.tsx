"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AdminWorkspacePage } from "../admin-workspace-page";
import { DynamicGalleryManager } from "../dashboard/DynamicGalleryManager";
import { useAdminApp } from "../admin-app-context";
import { useAdminContentWorkspace } from "./useAdminContentWorkspace";

export function AdminGalleryRoute() {
  const { refreshSummary } = useAdminApp();
  const workspace = useAdminContentWorkspace(refreshSummary, { loadSettings: false, loadContent: true });
  const [savedGallerySnapshot, setSavedGallerySnapshot] = useState<string>("[]");

  const currentGallerySnapshot = useMemo(
    () => JSON.stringify(workspace.content.gallery),
    [workspace.content.gallery]
  );
  const currentGallerySnapshotRef = useRef(currentGallerySnapshot);

  useEffect(() => {
    currentGallerySnapshotRef.current = currentGallerySnapshot;
  }, [currentGallerySnapshot]);

  const hasUnsavedGalleryChanges = !workspace.loading && !workspace.loadError && currentGallerySnapshot !== savedGallerySnapshot;

  useEffect(() => {
    if (!workspace.loading && !workspace.loadError) {
      setSavedGallerySnapshot(currentGallerySnapshotRef.current);
    }
  }, [workspace.loading, workspace.loadError]);

  useEffect(() => {
    if (workspace.contentMessage && !workspace.contentError) {
      setSavedGallerySnapshot(currentGallerySnapshotRef.current);
    }
  }, [workspace.contentMessage, workspace.contentError]);

  return (
    <AdminWorkspacePage
      kicker="Gallery"
      title="Gallery Manager"
      description="Manage gallery media independently from other content modules."
      actions={<button type="button" className="btn-secondary md:w-auto" onClick={() => void workspace.reload()}>Reload Gallery</button>}
    >
      {workspace.loading ? <section className="glass-panel p-5 md:p-6"><p className="text-sm text-slate-300">Loading gallery workspace...</p></section> : null}
      {workspace.loadError ? <section className="glass-panel p-5 md:p-6"><p className="status-bad">{workspace.loadError}</p></section> : null}
      {!workspace.loading && !workspace.loadError ? (
        <section className="glass-panel p-5 md:p-6">
          {hasUnsavedGalleryChanges ? <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-300">Unsaved gallery changes</p> : null}
          {workspace.content.gallery.length === 0 ? <p className="mb-4 text-sm text-slate-300">No gallery items yet. Add one below.</p> : null}
          <DynamicGalleryManager
            gallery={workspace.content.gallery}
            setOrderedGallery={workspace.setOrderedGallery}
            save={() => void workspace.saveContentSection("gallery", workspace.content.gallery, "Gallery items updated")}
          />
          {workspace.contentMessage ? <p className="status-ok mt-3">{workspace.contentMessage}</p> : null}
          {workspace.contentError ? <p className="status-bad mt-3">{workspace.contentError}</p> : null}
        </section>
      ) : null}
    </AdminWorkspacePage>
  );
}
