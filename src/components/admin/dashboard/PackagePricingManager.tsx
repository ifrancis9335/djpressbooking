import { Dispatch, SetStateAction } from "react";
import { SiteSettings } from "../../../types/site-settings";

interface PackagePricingManagerProps {
  settings: SiteSettings;
  setSettings: Dispatch<SetStateAction<SiteSettings>>;
  savePackages: () => void;
  packageMessage: string | null;
  packageError: string | null;
}

export function PackagePricingManager({ settings, setSettings, savePackages, packageMessage, packageError }: PackagePricingManagerProps) {
  return (
    <section id="package-pricing" className="glass-panel p-5 md:p-6">
      <h3 className="text-xl font-bold text-white">Package Pricing Manager</h3>
      <div className="mt-3 grid gap-4 lg:grid-cols-3">
        {(["basic", "premium", "vip"] as const).map((key) => (
          <article key={key} className="premium-card p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{key.toUpperCase()}</p>
            <label className="field mt-2"><span className="field-label">Label</span><input className="field-input" value={settings.packages[key].name} onChange={(event) => setSettings((prev) => ({ ...prev, packages: { ...prev.packages, [key]: { ...prev.packages[key], name: event.target.value } } }))} /></label>
            <label className="field mt-2"><span className="field-label">Price</span><input className="field-input" value={settings.packages[key].startingAt} onChange={(event) => setSettings((prev) => ({ ...prev, packages: { ...prev.packages, [key]: { ...prev.packages[key], startingAt: event.target.value } } }))} /></label>
            <label className="field mt-2"><span className="field-label">CTA Label</span><input className="field-input" value={settings.packages[key].ctaLabel} onChange={(event) => setSettings((prev) => ({ ...prev, packages: { ...prev.packages, [key]: { ...prev.packages[key], ctaLabel: event.target.value } } }))} /></label>
          </article>
        ))}
      </div>
      <button type="button" className="btn-primary mt-4 md:w-auto" onClick={savePackages}>
        Save Package Pricing
      </button>
      {packageMessage ? <p className="status-ok mt-3">{packageMessage}</p> : null}
      {packageError ? <p className="status-bad mt-3">{packageError}</p> : null}
    </section>
  );
}
