import { Dispatch, SetStateAction } from "react";
import { SiteSettings } from "../../../types/site-settings";
import { SiteContent } from "../../../types/site-content";

interface SharedContentManagerProps {
  settings: SiteSettings;
  setSettings: Dispatch<SetStateAction<SiteSettings>>;
  content: SiteContent;
  setContent: Dispatch<SetStateAction<SiteContent>>;
  save: () => void;
  message: string | null;
  error: string | null;
}

export function SharedContentManager({
  settings,
  setSettings,
  content,
  setContent,
  save,
  message,
  error
}: SharedContentManagerProps) {
  return (
    <section id="shared-content" className="glass-panel p-5 md:p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Shared Content Manager</h3>
          <p className="mt-1 text-sm text-slate-300">
            Update the core public business copy that should stay consistent across homepage, header, footer, and contact surfaces.
          </p>
        </div>
        <button type="button" className="btn-primary md:w-auto" onClick={save}>
          Save Shared Content
        </button>
      </div>

      <div className="mt-4 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="premium-card p-4">
          <h4 className="text-base font-bold text-white">Homepage Hero Copy</h4>
          <div className="mt-3 grid gap-3">
            <label className="field">
              <span className="field-label">Hero Heading</span>
              <input
                className="field-input"
                value={content.homepageHero.title}
                onChange={(event) =>
                  setContent((prev) => ({
                    ...prev,
                    homepageHero: { ...prev.homepageHero, title: event.target.value }
                  }))
                }
              />
            </label>
            <label className="field">
              <span className="field-label">Hero Subtext</span>
              <textarea
                className="field-input min-h-[110px]"
                value={content.homepageHero.description}
                onChange={(event) =>
                  setContent((prev) => ({
                    ...prev,
                    homepageHero: { ...prev.homepageHero, description: event.target.value }
                  }))
                }
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="field">
                <span className="field-label">Hero Primary CTA</span>
                <input
                  className="field-input"
                  value={content.homepageHero.primaryCtaLabel}
                  onChange={(event) =>
                    setContent((prev) => ({
                      ...prev,
                      homepageHero: { ...prev.homepageHero, primaryCtaLabel: event.target.value }
                    }))
                  }
                />
              </label>
              <label className="field">
                <span className="field-label">Hero Secondary CTA</span>
                <input
                  className="field-input"
                  value={content.homepageHero.secondaryCtaLabel}
                  onChange={(event) =>
                    setContent((prev) => ({
                      ...prev,
                      homepageHero: { ...prev.homepageHero, secondaryCtaLabel: event.target.value }
                    }))
                  }
                />
              </label>
            </div>
            <label className="field">
              <span className="field-label">Global Primary CTA Label</span>
              <input
                className="field-input"
                value={settings.site.primaryCtaLabel}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    site: { ...prev.site, primaryCtaLabel: event.target.value }
                  }))
                }
              />
            </label>
          </div>
        </article>

        <article className="premium-card p-4">
          <h4 className="text-base font-bold text-white">Public Contact Surface</h4>
          <div className="mt-3 grid gap-3">
            <label className="field">
              <span className="field-label">Business Phone</span>
              <input
                className="field-input"
                value={settings.contact.phone}
                onChange={(event) => {
                  const nextPhone = event.target.value;
                  setSettings((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, phone: nextPhone }
                  }));
                  setContent((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, phone: nextPhone }
                  }));
                }}
              />
            </label>
            <label className="field">
              <span className="field-label">Contact Email</span>
              <input
                className="field-input"
                value={settings.contact.email}
                onChange={(event) => {
                  const nextEmail = event.target.value;
                  setSettings((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, email: nextEmail }
                  }));
                  setContent((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, email: nextEmail }
                  }));
                }}
              />
            </label>
            <label className="field">
              <span className="field-label">Service Area Text</span>
              <input
                className="field-input"
                value={settings.contact.serviceArea}
                onChange={(event) => {
                  const nextServiceArea = event.target.value;
                  setSettings((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, serviceArea: nextServiceArea },
                    site: { ...prev.site, serviceAreaLine: nextServiceArea }
                  }));
                  setContent((prev) => ({
                    ...prev,
                    contact: { ...prev.contact, serviceArea: nextServiceArea }
                  }));
                }}
              />
            </label>
            <label className="field">
              <span className="field-label">Footer / Support Service Area Line</span>
              <input
                className="field-input"
                value={settings.site.serviceAreaLine}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    site: { ...prev.site, serviceAreaLine: event.target.value }
                  }))
                }
              />
            </label>
          </div>
        </article>
      </div>

      {message ? <p className="status-ok mt-4">{message}</p> : null}
      {error ? <p className="status-bad mt-4">{error}</p> : null}
    </section>
  );
}
