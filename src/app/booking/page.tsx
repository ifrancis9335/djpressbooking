import Link from "next/link";
import { Metadata } from "next";
import { Suspense } from "react";
import { BookingForm } from "../../components/forms/booking-form";
import { getPublicSiteData } from "../../lib/site-settings";

export const metadata: Metadata = {
  title: "Book DJ Press International",
  description: "Submit a full booking inquiry for weddings, nightlife, and premium events in Charleston."
};

export default async function BookingPage() {
  const initialPublicData = await getPublicSiteData();

  return (
    <main className="section-shell">
      <div className="container-width">
        <p className="section-kicker">Booking Flow</p>
        <h1 className="text-3xl font-bold text-white md:text-4xl">Booking Inquiry</h1>
        <p className="mt-3 max-w-3xl text-slate-300">
          Complete this form to receive date confirmation, package fit guidance, and next-step booking details.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <article className="premium-card"><h2 className="text-xl text-white">Step 1</h2><p className="mt-2 text-sm text-slate-300">Share your event details and priorities.</p></article>
          <article className="premium-card"><h2 className="text-xl text-white">Step 2</h2><p className="mt-2 text-sm text-slate-300">Receive availability and package options.</p></article>
          <article className="premium-card"><h2 className="text-xl text-white">Step 3</h2><p className="mt-2 text-sm text-slate-300">Confirm your date with booking terms.</p></article>
        </div>
        <div className="mt-6">
          <Suspense fallback={<div className="glass-panel p-6 text-sm text-slate-300">Loading booking form...</div>}>
            <BookingForm initialPublicData={initialPublicData} />
          </Suspense>
        </div>

        <div className="cta-rhythm">
          <Link href="/availability" className="btn-secondary">Check Date Availability</Link>
          <Link href="/contact" className="btn-primary">Speak With Booking Team</Link>
        </div>
      </div>
    </main>
  );
}
