"use client";

import { AdminWorkspacePage } from "../admin-workspace-page";
import { AboutStatsManager } from "../dashboard/AboutStatsManager";
import { AdminActivityFeed } from "../dashboard/AdminActivityFeed";
import { BookingSettingsManager } from "../dashboard/BookingSettingsManager";
import { BrandingManager } from "../dashboard/BrandingManager";
import { ContactSettingsManager } from "../dashboard/ContactSettingsManager";
import { DynamicServicesManager } from "../dashboard/DynamicServicesManager";
import { HomepageContentManager } from "../dashboard/HomepageContentManager";
import { SharedContentManager } from "../dashboard/SharedContentManager";
import { SiteSettingsManager } from "../dashboard/SiteSettingsManager";
import { useAdminApp } from "../admin-app-context";
import { useAdminContentWorkspace } from "./useAdminContentWorkspace";

export function AdminSiteSettingsRoute() {
  const { authenticated, refreshSummary } = useAdminApp();
  const workspace = useAdminContentWorkspace(refreshSummary);

  return (
    <AdminWorkspacePage
      kicker="Settings"
      title="Site Settings"
      description="Central workspace for global contact, booking, shared content, branding, homepage, services, and audit activity."
      actions={<button type="button" className="btn-secondary md:w-auto" onClick={() => void workspace.reload()}>Reload Settings</button>}
    >
      {workspace.loading ? <section className="glass-panel p-5 md:p-6"><p className="text-sm text-slate-300">Loading site settings workspace...</p></section> : null}
      {workspace.loadError ? <section className="glass-panel p-5 md:p-6"><p className="status-bad">{workspace.loadError}</p></section> : null}
      {!workspace.loading && !workspace.loadError ? (
        <div className="grid gap-5">
          <SharedContentManager
            settings={workspace.settings}
            setSettings={workspace.setSettings}
            content={workspace.content}
            setContent={workspace.setContent}
            save={() => void workspace.saveSharedContent()}
            message={workspace.sharedContentMessage}
            error={workspace.sharedContentError}
          />

          <ContactSettingsManager
            settings={workspace.settings}
            setSettings={workspace.setSettings}
            saveContact={() => void workspace.saveSettingsByMode({ contact: workspace.settings.contact }, "contact")}
            contactMessage={workspace.contactMessage}
            contactError={workspace.contactError}
          />

          <BookingSettingsManager
            settings={workspace.settings}
            setSettings={workspace.setSettings}
            saveBooking={() => void workspace.saveSettingsByMode({ booking: workspace.settings.booking }, "booking")}
            bookingMessage={workspace.bookingMessage}
            bookingError={workspace.bookingError}
          />

          <SiteSettingsManager
            settings={workspace.settings}
            setSettings={workspace.setSettings}
            saveSite={() => void workspace.saveSettingsByMode({ site: workspace.settings.site }, "site")}
            siteMessage={workspace.siteMessage}
            siteError={workspace.siteError}
          />

          <section className="glass-panel p-5 md:p-6">
            <h3 className="text-xl font-bold text-white">Branding and Homepage</h3>
            <div className="mt-4 grid gap-5">
              <BrandingManager
                content={workspace.content}
                setContent={workspace.setContent}
                save={() => void workspace.saveContentSection("branding", workspace.content.branding, "Branding updated")}
              />
              <HomepageContentManager
                content={workspace.content}
                setContent={workspace.setContent}
                saveSection={(section, value, successMessage) => void workspace.saveContentSection(section, value, successMessage)}
              />
              <DynamicServicesManager
                services={workspace.content.services}
                setOrderedServices={workspace.setOrderedServices}
                save={() => void workspace.saveContentSection("services", workspace.content.services, "Services updated")}
              />
              <AboutStatsManager
                aboutStats={workspace.content.aboutStats}
                setAboutStats={workspace.setAboutStats}
                save={() => void workspace.saveContentSection("aboutStats", workspace.content.aboutStats, "About stats updated")}
              />
            </div>
            {workspace.contentMessage ? <p className="status-ok mt-3">{workspace.contentMessage}</p> : null}
            {workspace.contentError ? <p className="status-bad mt-3">{workspace.contentError}</p> : null}
          </section>

          <AdminActivityFeed enabled={authenticated} />
        </div>
      ) : null}
    </AdminWorkspacePage>
  );
}
