import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booking Policy",
  description: "Booking policy for DJ Press International event services."
};

export default function BookingPolicyPage() {
  return (
    <main className="section-shell">
      <div className="container-width">
        <section className="premium-card">
          <h1 className="text-3xl font-bold text-white">Booking Policy</h1>
          <p className="mt-3 text-sm text-slate-400">Effective date: April 8, 2026</p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-300">
            <li>Date reservations require a signed agreement and retainer payment.</li>
            <li>Retainers are non-refundable unless otherwise stated in writing in the signed agreement.</li>
            <li>Reschedule requests are subject to calendar availability and may require updated pricing.</li>
            <li>Final timeline and event details must be confirmed before performance date.</li>
            <li>Client must provide safe venue access, reliable power, and required event permissions.</li>
            <li>Overtime is available based on venue terms and schedule capacity.</li>
            <li>Travel and specialty production requests are documented in advance.</li>
            <li>Final service commitments are governed by the booking agreement.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
