import { Dispatch, SetStateAction } from "react";
import { AdminImageField } from "../admin-image-field";
import { SiteContent } from "../../../types/site-content";

interface HomepageContentManagerProps {
  content: SiteContent;
  setContent: Dispatch<SetStateAction<SiteContent>>;
  saveSection: <K extends keyof SiteContent>(section: K, value: SiteContent[K], successMessage: string) => void;
}

export function HomepageContentManager({ content, setContent, saveSection }: HomepageContentManagerProps) {
  return (
    <>
      <article className="premium-card p-4">
        <h4 className="text-base font-bold text-white">Section Visibility</h4>
        <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <label className="field"><span className="field-label">Homepage Hero</span><select className="field-input" value={content.sectionVisibility.homepageHero ? "yes" : "no"} onChange={(event) => setContent((prev) => ({ ...prev, sectionVisibility: { ...prev.sectionVisibility, homepageHero: event.target.value === "yes" } }))}><option value="yes">Visible</option><option value="no">Hidden</option></select></label>
          <label className="field"><span className="field-label">Homepage Services</span><select className="field-input" value={content.sectionVisibility.homepageServices ? "yes" : "no"} onChange={(event) => setContent((prev) => ({ ...prev, sectionVisibility: { ...prev.sectionVisibility, homepageServices: event.target.value === "yes" } }))}><option value="yes">Visible</option><option value="no">Hidden</option></select></label>
          <label className="field"><span className="field-label">Homepage Packages</span><select className="field-input" value={content.sectionVisibility.homepagePackages ? "yes" : "no"} onChange={(event) => setContent((prev) => ({ ...prev, sectionVisibility: { ...prev.sectionVisibility, homepagePackages: event.target.value === "yes" } }))}><option value="yes">Visible</option><option value="no">Hidden</option></select></label>
          <label className="field"><span className="field-label">Homepage Gallery</span><select className="field-input" value={content.sectionVisibility.homepageGallery ? "yes" : "no"} onChange={(event) => setContent((prev) => ({ ...prev, sectionVisibility: { ...prev.sectionVisibility, homepageGallery: event.target.value === "yes" } }))}><option value="yes">Visible</option><option value="no">Hidden</option></select></label>
          <label className="field"><span className="field-label">Homepage Reviews</span><select className="field-input" value={content.sectionVisibility.homepageReviews ? "yes" : "no"} onChange={(event) => setContent((prev) => ({ ...prev, sectionVisibility: { ...prev.sectionVisibility, homepageReviews: event.target.value === "yes" } }))}><option value="yes">Visible</option><option value="no">Hidden</option></select></label>
          <label className="field"><span className="field-label">Homepage Final CTA</span><select className="field-input" value={content.sectionVisibility.homepageAbout ? "yes" : "no"} onChange={(event) => setContent((prev) => ({ ...prev, sectionVisibility: { ...prev.sectionVisibility, homepageAbout: event.target.value === "yes" } }))}><option value="yes">Visible</option><option value="no">Hidden</option></select></label>
        </div>
        <button type="button" className="btn-primary mt-4 md:w-auto" onClick={() => saveSection("sectionVisibility", content.sectionVisibility, "Section visibility updated")}>Save Visibility</button>
      </article>

      <article className="premium-card p-4">
        <h4 className="text-base font-bold text-white">Homepage Hero</h4>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="field"><span className="field-label">Badge Text</span><input className="field-input" value={content.homepageHero.kicker} onChange={(event) => setContent((prev) => ({ ...prev, homepageHero: { ...prev.homepageHero, kicker: event.target.value } }))} /></label>
          <label className="field"><span className="field-label">Headline</span><input className="field-input" value={content.homepageHero.title} onChange={(event) => setContent((prev) => ({ ...prev, homepageHero: { ...prev.homepageHero, title: event.target.value } }))} /></label>
          <label className="field md:col-span-2"><span className="field-label">Subheadline</span><input className="field-input" value={content.homepageHero.description} onChange={(event) => setContent((prev) => ({ ...prev, homepageHero: { ...prev.homepageHero, description: event.target.value } }))} /></label>
          <label className="field"><span className="field-label">Primary CTA</span><input className="field-input" value={content.homepageHero.primaryCtaLabel} onChange={(event) => setContent((prev) => ({ ...prev, homepageHero: { ...prev.homepageHero, primaryCtaLabel: event.target.value } }))} /></label>
          <label className="field"><span className="field-label">Secondary CTA</span><input className="field-input" value={content.homepageHero.secondaryCtaLabel} onChange={(event) => setContent((prev) => ({ ...prev, homepageHero: { ...prev.homepageHero, secondaryCtaLabel: event.target.value } }))} /></label>
        </div>
        <div className="mt-3">
          <AdminImageField
            label="Hero Image"
            scope="branding"
            uploadTitle={content.homepageHero.title || "Homepage hero image"}
            fallbackSrc="/images/dj/dj-press-live-performance.jpg"
            value={content.homepageHero.heroImageAsset}
            legacyUrl={content.homepageHero.heroImage}
            previewClassName="h-28 w-full rounded-xl object-cover"
            onChange={(next) => setContent((prev) => ({ ...prev, homepageHero: { ...prev.homepageHero, heroImageAsset: next, heroImage: "" } }))}
            onLegacyClear={() => setContent((prev) => ({ ...prev, homepageHero: { ...prev.homepageHero, heroImage: "" } }))}
          />
        </div>
        <button type="button" className="btn-primary mt-4 md:w-auto" onClick={() => saveSection("homepageHero", content.homepageHero, "Homepage hero updated")}>Save Homepage Hero</button>
      </article>

      <article className="premium-card p-4">
        <h4 className="text-base font-bold text-white">Homepage Featured Section</h4>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="field"><span className="field-label">Kicker</span><input className="field-input" value={content.homepageFeatured.kicker} onChange={(event) => setContent((prev) => ({ ...prev, homepageFeatured: { ...prev.homepageFeatured, kicker: event.target.value } }))} /></label>
          <label className="field"><span className="field-label">Title</span><input className="field-input" value={content.homepageFeatured.title} onChange={(event) => setContent((prev) => ({ ...prev, homepageFeatured: { ...prev.homepageFeatured, title: event.target.value } }))} /></label>
          <label className="field md:col-span-2"><span className="field-label">Description</span><input className="field-input" value={content.homepageFeatured.description} onChange={(event) => setContent((prev) => ({ ...prev, homepageFeatured: { ...prev.homepageFeatured, description: event.target.value } }))} /></label>
        </div>
        <button type="button" className="btn-primary mt-4 md:w-auto" onClick={() => saveSection("homepageFeatured", content.homepageFeatured, "Homepage featured section updated")}>Save Featured Section</button>
      </article>

      <article className="premium-card p-4">
        <h4 className="text-base font-bold text-white">Homepage Trust Section</h4>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="field"><span className="field-label">Kicker</span><input className="field-input" value={content.homepageTrust.kicker} onChange={(event) => setContent((prev) => ({ ...prev, homepageTrust: { ...prev.homepageTrust, kicker: event.target.value } }))} /></label>
          <label className="field"><span className="field-label">Title</span><input className="field-input" value={content.homepageTrust.title} onChange={(event) => setContent((prev) => ({ ...prev, homepageTrust: { ...prev.homepageTrust, title: event.target.value } }))} /></label>
          <label className="field md:col-span-2"><span className="field-label">Description</span><input className="field-input" value={content.homepageTrust.description} onChange={(event) => setContent((prev) => ({ ...prev, homepageTrust: { ...prev.homepageTrust, description: event.target.value } }))} /></label>
        </div>
        <button type="button" className="btn-primary mt-4 md:w-auto" onClick={() => saveSection("homepageTrust", content.homepageTrust, "Homepage trust section updated")}>Save Trust Section</button>
      </article>

      <article className="premium-card p-4">
        <h4 className="text-base font-bold text-white">Homepage Highlights Section</h4>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="field"><span className="field-label">Kicker</span><input className="field-input" value={content.homepageHighlights.kicker} onChange={(event) => setContent((prev) => ({ ...prev, homepageHighlights: { ...prev.homepageHighlights, kicker: event.target.value } }))} /></label>
          <label className="field"><span className="field-label">Title</span><input className="field-input" value={content.homepageHighlights.title} onChange={(event) => setContent((prev) => ({ ...prev, homepageHighlights: { ...prev.homepageHighlights, title: event.target.value } }))} /></label>
          <label className="field md:col-span-2"><span className="field-label">Description</span><input className="field-input" value={content.homepageHighlights.description} onChange={(event) => setContent((prev) => ({ ...prev, homepageHighlights: { ...prev.homepageHighlights, description: event.target.value } }))} /></label>
        </div>
        <button type="button" className="btn-primary mt-4 md:w-auto" onClick={() => saveSection("homepageHighlights", content.homepageHighlights, "Homepage highlights section updated")}>Save Highlights Section</button>
      </article>

      <article className="premium-card p-4">
        <h4 className="text-base font-bold text-white">Homepage Final CTA</h4>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="field"><span className="field-label">Kicker</span><input className="field-input" value={content.homepageFinalCta.kicker} onChange={(event) => setContent((prev) => ({ ...prev, homepageFinalCta: { ...prev.homepageFinalCta, kicker: event.target.value } }))} /></label>
          <label className="field"><span className="field-label">Title</span><input className="field-input" value={content.homepageFinalCta.title} onChange={(event) => setContent((prev) => ({ ...prev, homepageFinalCta: { ...prev.homepageFinalCta, title: event.target.value } }))} /></label>
          <label className="field md:col-span-2"><span className="field-label">Description</span><input className="field-input" value={content.homepageFinalCta.description} onChange={(event) => setContent((prev) => ({ ...prev, homepageFinalCta: { ...prev.homepageFinalCta, description: event.target.value } }))} /></label>
          <label className="field"><span className="field-label">Primary CTA</span><input className="field-input" value={content.homepageFinalCta.primaryCtaLabel} onChange={(event) => setContent((prev) => ({ ...prev, homepageFinalCta: { ...prev.homepageFinalCta, primaryCtaLabel: event.target.value } }))} /></label>
          <label className="field"><span className="field-label">Secondary CTA</span><input className="field-input" value={content.homepageFinalCta.secondaryCtaLabel} onChange={(event) => setContent((prev) => ({ ...prev, homepageFinalCta: { ...prev.homepageFinalCta, secondaryCtaLabel: event.target.value } }))} /></label>
        </div>
        <button type="button" className="btn-primary mt-4 md:w-auto" onClick={() => saveSection("homepageFinalCta", content.homepageFinalCta, "Homepage final CTA updated")}>Save Final CTA</button>
      </article>

      <article className="premium-card p-4">
        <h4 className="text-base font-bold text-white">Public Page Intros</h4>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Services Intro</p>
            <label className="field"><span className="field-label">Kicker</span><input className="field-input" value={content.servicesIntro.kicker} onChange={(event) => setContent((prev) => ({ ...prev, servicesIntro: { ...prev.servicesIntro, kicker: event.target.value } }))} /></label>
            <label className="field"><span className="field-label">Title</span><input className="field-input" value={content.servicesIntro.title} onChange={(event) => setContent((prev) => ({ ...prev, servicesIntro: { ...prev.servicesIntro, title: event.target.value } }))} /></label>
            <label className="field"><span className="field-label">Description</span><input className="field-input" value={content.servicesIntro.description} onChange={(event) => setContent((prev) => ({ ...prev, servicesIntro: { ...prev.servicesIntro, description: event.target.value } }))} /></label>
            <button type="button" className="btn-secondary md:w-auto" onClick={() => saveSection("servicesIntro", content.servicesIntro, "Services intro updated")}>Save Services Intro</button>
          </div>

          <div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Packages Intro</p>
            <label className="field"><span className="field-label">Kicker</span><input className="field-input" value={content.packagesIntro.kicker} onChange={(event) => setContent((prev) => ({ ...prev, packagesIntro: { ...prev.packagesIntro, kicker: event.target.value } }))} /></label>
            <label className="field"><span className="field-label">Title</span><input className="field-input" value={content.packagesIntro.title} onChange={(event) => setContent((prev) => ({ ...prev, packagesIntro: { ...prev.packagesIntro, title: event.target.value } }))} /></label>
            <label className="field"><span className="field-label">Description</span><input className="field-input" value={content.packagesIntro.description} onChange={(event) => setContent((prev) => ({ ...prev, packagesIntro: { ...prev.packagesIntro, description: event.target.value } }))} /></label>
            <button type="button" className="btn-secondary md:w-auto" onClick={() => saveSection("packagesIntro", content.packagesIntro, "Packages intro updated")}>Save Packages Intro</button>
          </div>

          <div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Gallery Intro</p>
            <label className="field"><span className="field-label">Kicker</span><input className="field-input" value={content.galleryIntro.kicker} onChange={(event) => setContent((prev) => ({ ...prev, galleryIntro: { ...prev.galleryIntro, kicker: event.target.value } }))} /></label>
            <label className="field"><span className="field-label">Title</span><input className="field-input" value={content.galleryIntro.title} onChange={(event) => setContent((prev) => ({ ...prev, galleryIntro: { ...prev.galleryIntro, title: event.target.value } }))} /></label>
            <label className="field"><span className="field-label">Description</span><input className="field-input" value={content.galleryIntro.description} onChange={(event) => setContent((prev) => ({ ...prev, galleryIntro: { ...prev.galleryIntro, description: event.target.value } }))} /></label>
            <button type="button" className="btn-secondary md:w-auto" onClick={() => saveSection("galleryIntro", content.galleryIntro, "Gallery intro updated")}>Save Gallery Intro</button>
          </div>

          <div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Reviews Intro</p>
            <label className="field"><span className="field-label">Kicker</span><input className="field-input" value={content.reviewsIntro.kicker} onChange={(event) => setContent((prev) => ({ ...prev, reviewsIntro: { ...prev.reviewsIntro, kicker: event.target.value } }))} /></label>
            <label className="field"><span className="field-label">Title</span><input className="field-input" value={content.reviewsIntro.title} onChange={(event) => setContent((prev) => ({ ...prev, reviewsIntro: { ...prev.reviewsIntro, title: event.target.value } }))} /></label>
            <label className="field"><span className="field-label">Description</span><input className="field-input" value={content.reviewsIntro.description} onChange={(event) => setContent((prev) => ({ ...prev, reviewsIntro: { ...prev.reviewsIntro, description: event.target.value } }))} /></label>
            <button type="button" className="btn-secondary md:w-auto" onClick={() => saveSection("reviewsIntro", content.reviewsIntro, "Reviews intro updated")}>Save Reviews Intro</button>
          </div>

          <div className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-3 lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-300">About Intro</p>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="field"><span className="field-label">Kicker</span><input className="field-input" value={content.aboutIntro.kicker} onChange={(event) => setContent((prev) => ({ ...prev, aboutIntro: { ...prev.aboutIntro, kicker: event.target.value } }))} /></label>
              <label className="field"><span className="field-label">Title</span><input className="field-input" value={content.aboutIntro.title} onChange={(event) => setContent((prev) => ({ ...prev, aboutIntro: { ...prev.aboutIntro, title: event.target.value } }))} /></label>
              <label className="field"><span className="field-label">Paragraph One</span><input className="field-input" value={content.aboutIntro.paragraphOne} onChange={(event) => setContent((prev) => ({ ...prev, aboutIntro: { ...prev.aboutIntro, paragraphOne: event.target.value } }))} /></label>
              <label className="field"><span className="field-label">Paragraph Two</span><input className="field-input" value={content.aboutIntro.paragraphTwo} onChange={(event) => setContent((prev) => ({ ...prev, aboutIntro: { ...prev.aboutIntro, paragraphTwo: event.target.value } }))} /></label>
            </div>
            <button type="button" className="btn-secondary md:w-auto" onClick={() => saveSection("aboutIntro", content.aboutIntro, "About intro updated")}>Save About Intro</button>
          </div>
        </div>
      </article>
    </>
  );
}
