import { Dispatch, SetStateAction } from "react";
import { SiteSettings } from "../../../types/site-settings";

interface SiteSettingsManagerProps {
  settings: SiteSettings;
  setSettings: Dispatch<SetStateAction<SiteSettings>>;
  saveSite: () => void;
  siteMessage: string | null;
  siteError: string | null;
}

export function SiteSettingsManager({ settings, setSettings, saveSite, siteMessage, siteError }: SiteSettingsManagerProps) {
  return (
    <section id="site-settings" className="glass-panel p-5 md:p-6">
      <h3 className="text-xl font-bold text-white">Site Settings</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <label className="field"><span className="field-label">Primary CTA Label</span><input className="field-input" value={settings.site.primaryCtaLabel} onChange={(event) => setSettings((prev) => ({ ...prev, site: { ...prev.site, primaryCtaLabel: event.target.value } }))} /></label>
        <label className="field"><span className="field-label">Hero Support Text</span><input className="field-input" value={settings.site.heroSupportText} onChange={(event) => setSettings((prev) => ({ ...prev, site: { ...prev.site, heroSupportText: event.target.value } }))} /></label>
        <label className="field"><span className="field-label">Service Area Line</span><input className="field-input" value={settings.site.serviceAreaLine} onChange={(event) => setSettings((prev) => ({ ...prev, site: { ...prev.site, serviceAreaLine: event.target.value } }))} /></label>
      </div>
      <button type="button" className="btn-primary mt-4 md:w-auto" onClick={saveSite}>Save Site Settings</button>
      {siteMessage ? <p className="status-ok mt-3">{siteMessage}</p> : null}
      {siteError ? <p className="status-bad mt-3">{siteError}</p> : null}
    </section>
  );
}
