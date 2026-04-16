import { Dispatch, SetStateAction } from "react";
import { SiteSettings } from "../../../types/site-settings";

interface ContactSettingsManagerProps {
  settings: SiteSettings;
  setSettings: Dispatch<SetStateAction<SiteSettings>>;
  saveContact: () => void;
  contactMessage: string | null;
  contactError: string | null;
}

export function ContactSettingsManager({ settings, setSettings, saveContact, contactMessage, contactError }: ContactSettingsManagerProps) {
  return (
    <section id="contact-info" className="glass-panel p-5 md:p-6">
      <h3 className="text-xl font-bold text-white">Contact Info Manager</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="field"><span className="field-label">Business Phone Number</span><input className="field-input" value={settings.contact.phone} onChange={(event) => setSettings((prev) => ({ ...prev, contact: { ...prev.contact, phone: event.target.value } }))} /></label>
        <label className="field"><span className="field-label">Tel Href</span><input className="field-input" value={settings.contact.phoneHref} onChange={(event) => setSettings((prev) => ({ ...prev, contact: { ...prev.contact, phoneHref: event.target.value } }))} /></label>
        <label className="field"><span className="field-label">Contact Email</span><input className="field-input" value={settings.contact.email} onChange={(event) => setSettings((prev) => ({ ...prev, contact: { ...prev.contact, email: event.target.value } }))} /></label>
        <label className="field"><span className="field-label">Service Area</span><input className="field-input" value={settings.contact.serviceArea} onChange={(event) => setSettings((prev) => ({ ...prev, contact: { ...prev.contact, serviceArea: event.target.value } }))} /></label>
      </div>
      <button type="button" className="btn-primary mt-4 md:w-auto" onClick={saveContact}>
        Save Contact Info
      </button>
      {contactMessage ? <p className="status-ok mt-3">{contactMessage}</p> : null}
      {contactError ? <p className="status-bad mt-3">{contactError}</p> : null}
    </section>
  );
}
