"use client";

import { AdminWorkspacePage } from "../admin-workspace-page";
import { DynamicPackagesManager } from "../dashboard/DynamicPackagesManager";
import { PackagePricingManager } from "../dashboard/PackagePricingManager";
import { useAdminApp } from "../admin-app-context";
import { useAdminContentWorkspace } from "./useAdminContentWorkspace";

export function AdminPackagesRoute() {
  const { refreshSummary } = useAdminApp();
  const workspace = useAdminContentWorkspace(refreshSummary);

  return (
    <AdminWorkspacePage
      kicker="Packages"
      title="Packages Manager"
      description="Manage package pricing and package content in a dedicated workspace route."
      actions={<button type="button" className="btn-secondary md:w-auto" onClick={() => void workspace.reload()}>Reload Packages</button>}
    >
      {workspace.loading ? <section className="glass-panel p-5 md:p-6"><p className="text-sm text-slate-300">Loading package workspace...</p></section> : null}
      {workspace.loadError ? <section className="glass-panel p-5 md:p-6"><p className="status-bad">{workspace.loadError}</p></section> : null}
      {!workspace.loading && !workspace.loadError ? (
        <div className="grid gap-5">
          <PackagePricingManager
            settings={workspace.settings}
            setSettings={workspace.setSettings}
            savePackages={() => void workspace.saveSettingsByMode({ packages: workspace.settings.packages }, "packages")}
            packageMessage={workspace.packageMessage}
            packageError={workspace.packageError}
          />
          <section className="glass-panel p-5 md:p-6">
            <DynamicPackagesManager
              packages={workspace.content.packages}
              setOrderedPackages={workspace.setOrderedPackages}
              save={() => void workspace.saveContentSection("packages", workspace.content.packages, "Packages updated")}
            />
            {workspace.contentMessage ? <p className="status-ok mt-3">{workspace.contentMessage}</p> : null}
            {workspace.contentError ? <p className="status-bad mt-3">{workspace.contentError}</p> : null}
          </section>
        </div>
      ) : null}
    </AdminWorkspacePage>
  );
}
