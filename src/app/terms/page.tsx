import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for DJ Press International platform usage and booking inquiries."
};

export default function TermsPage() {
  return (
    <main className="section-shell">
      <div className="container-width">
        <section className="premium-card">
          <h1 className="text-3xl font-bold text-white">Terms</h1>
          <p className="mt-3 text-sm text-slate-400">Effective date: April 8, 2026</p>
          <p className="mt-3 text-slate-300">
            Submission of inquiries implies agreement to provide accurate event information and engage in respectful communication.
          </p>
          <p className="mt-3 text-slate-300">
            Service scope, pricing, and delivery are finalized through signed agreements and approved terms.
          </p>
          <p className="mt-3 text-slate-300">
            Retainers, payment schedules, and cancellation terms are governed by the executed booking agreement for each event.
          </p>
          <p className="mt-3 text-slate-300">
            DJ Press International is not responsible for venue, power, weather, or third-party disruptions outside direct operational control.
          </p>
          <p className="mt-3 text-slate-300">
            DJ Press International reserves the right to decline inquiries that conflict with schedule, capacity, or policy requirements.
          </p>
          <p className="mt-3 text-slate-300">
            Governing law and dispute handling venue are determined by the signed booking agreement.
          </p>
        </section>
      </div>
    </main>
  );
}
