import { Dispatch, SetStateAction } from "react";
import { AdminImageField } from "../admin-image-field";
import { SiteContent } from "../../../types/site-content";

interface BrandingManagerProps {
  content: SiteContent;
  setContent: Dispatch<SetStateAction<SiteContent>>;
  save: () => void;
}

export function BrandingManager({ content, setContent, save }: BrandingManagerProps) {
  return (
    <article className="premium-card p-4">
      <h4 className="text-base font-bold text-white">Branding</h4>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="field"><span className="field-label">Site Title</span><input className="field-input" value={content.branding.siteName} onChange={(event) => setContent((prev) => ({ ...prev, branding: { ...prev.branding, siteName: event.target.value } }))} /></label>
        <label className="field"><span className="field-label">Brand Text</span><input className="field-input" value={content.branding.logoText} onChange={(event) => setContent((prev) => ({ ...prev, branding: { ...prev.branding, logoText: event.target.value } }))} /></label>
        <label className="field md:col-span-2"><span className="field-label">Tagline</span><input className="field-input" value={content.branding.tagline} onChange={(event) => setContent((prev) => ({ ...prev, branding: { ...prev.branding, tagline: event.target.value } }))} /></label>
      </div>
      <div className="mt-3">
        <AdminImageField
          label="Logo Image"
          scope="branding"
          uploadTitle={content.branding.siteName || "Brand logo"}
          fallbackSrc="/images/branding/dj-press-logo-press.png"
          value={content.branding.logoImageAsset}
          legacyUrl={content.branding.logoImage}
          previewClassName="h-16 w-16 rounded-full border border-luxeGold/35 object-contain"
          onChange={(next) => setContent((prev) => ({ ...prev, branding: { ...prev.branding, logoImageAsset: next, logoImage: "" } }))}
          onLegacyClear={() => setContent((prev) => ({ ...prev, branding: { ...prev.branding, logoImage: "" } }))}
        />
      </div>
      <button type="button" className="btn-primary mt-4 md:w-auto" onClick={save}>Save Branding</button>
    </article>
  );
}
