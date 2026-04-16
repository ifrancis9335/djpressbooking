import { Dispatch, SetStateAction } from "react";
import { SiteSettings } from "../../../types/site-settings";

interface BookingSettingsManagerProps {
  settings: SiteSettings;
  setSettings: Dispatch<SetStateAction<SiteSettings>>;
  saveBooking: () => void;
  bookingMessage: string | null;
  bookingError: string | null;
}

export function BookingSettingsManager({ settings, setSettings, saveBooking, bookingMessage, bookingError }: BookingSettingsManagerProps) {
  return (
    <section id="booking-settings" className="glass-panel p-5 md:p-6">
      <h3 className="text-xl font-bold text-white">Booking Settings</h3>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="field"><span className="field-label">Booking Enabled</span><select className="field-input" value={settings.booking.enabled ? "yes" : "no"} onChange={(event) => setSettings((prev) => ({ ...prev, booking: { ...prev.booking, enabled: event.target.value === "yes" } }))}><option value="yes">Enabled</option><option value="no">Disabled</option></select></label>
        <label className="field"><span className="field-label">Booking Notice Text</span><input className="field-input" value={settings.booking.notice} onChange={(event) => setSettings((prev) => ({ ...prev, booking: { ...prev.booking, notice: event.target.value } }))} placeholder="Bookings temporarily paused" /></label>
      </div>
      <button type="button" className="btn-primary mt-4 md:w-auto" onClick={saveBooking}>Save Booking Settings</button>
      {bookingMessage ? <p className="status-ok mt-3">{bookingMessage}</p> : null}
      {bookingError ? <p className="status-bad mt-3">{bookingError}</p> : null}
    </section>
  );
}
