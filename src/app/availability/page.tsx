import { Metadata } from "next";
import Link from "next/link";
import { AvailabilityCalendar } from "../../components/ui/availability-calendar";

export const metadata: Metadata = {
  title: "Availability",
  description: "Check available and admin-blocked event dates before booking."
};

export default function AvailabilityPage() {
  return (
    <main className="section-shell">
      <div className="container-width">
        <p className="section-kicker">Date Planning</p>
        <h1 className="text-3xl font-bold text-white md:text-4xl">Availability Calendar</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          This calendar shows only real admin-controlled blocked dates and available dates.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <article className="premium-card"><h2 className="text-lg text-emerald-300">Available</h2><p className="mt-2 text-sm text-slate-300">Open for active booking inquiries.</p></article>
          <article className="premium-card"><h2 className="text-lg text-slate-300">Blocked</h2><p className="mt-2 text-sm text-slate-300">Unavailable when blocked directly in admin.</p></article>
          <article className="premium-card"><h2 className="text-lg text-slate-400">Past Date</h2><p className="mt-2 text-sm text-slate-300">Past dates stay disabled for selection.</p></article>
        </div>
        <div className="mt-6">
          <AvailabilityCalendar />
        </div>
        <div className="cta-rhythm">
          <Link href="/booking" className="btn-primary">Request Your Date</Link>
          <Link href="/contact" className="btn-secondary">Ask About Flexible Dates</Link>
        </div>
      </div>
    </main>
  );
}
