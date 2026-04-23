import Link from "next/link";
import { Metadata } from "next";
import { getHomePageData } from "../../features/public-home/server/getHomePageData";
import { HomeHeroSection } from "../../features/public-home/sections/HomeHeroSection";

export const metadata: Metadata = {
  title: "Luxury DJ Booking in Charleston",
  description:
    "Book DJ Press International for weddings, nightlife, and high-impact private events in Charleston and surrounding areas."
};

export default async function HomePage() {
  const homePageData = await getHomePageData();
  const { siteContent } = homePageData.raw;
  const visibility = siteContent.sectionVisibility;

  return (
    <div className="page-container">
      {/* Hero section only */}
      {visibility.homepageHero ? (
        <HomeHeroSection hero={homePageData.hero} />
      ) : null}

      {/* Dashboard grid */}
      <section className="section-shell">
        <div className="container-width">
          <p className="section-kicker">Navigate</p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">Explore Offerings</h2>
          <p className="mt-3 max-w-3xl text-slate-300">
            Select a section to explore services, check availability, or book your event.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {/* Services */}
            <Link
              href="/services"
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-luxeBlue/10 to-violet-500/5 p-5 transition hover:border-luxeBlue/40 hover:bg-luxeBlue/15"
            >
              <div className="flex flex-col gap-2">
                <div className="text-2xl">🎵</div>
                <h3 className="font-bold text-white group-hover:text-luxeBlue transition">Services</h3>
                <p className="text-xs text-slate-400">Event types & specialties</p>
              </div>
            </Link>

            {/* Packages */}
            <Link
              href="/packages"
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-luxeGold/10 to-amber-500/5 p-5 transition hover:border-luxeGold/40 hover:bg-luxeGold/15"
            >
              <div className="flex flex-col gap-2">
                <div className="text-2xl">💼</div>
                <h3 className="font-bold text-white group-hover:text-luxeGold transition">Packages</h3>
                <p className="text-xs text-slate-400">Booking tiers & pricing</p>
              </div>
            </Link>

            {/* Availability */}
            <Link
              href="/availability"
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-5 transition hover:border-emerald-500/40 hover:bg-emerald-500/15"
            >
              <div className="flex flex-col gap-2">
                <div className="text-2xl">📅</div>
                <h3 className="font-bold text-white group-hover:text-emerald-300 transition">Availability</h3>
                <p className="text-xs text-slate-400">Check open dates</p>
              </div>
            </Link>

            {/* Gallery */}
            <Link
              href="/gallery"
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-rose-500/10 to-pink-500/5 p-5 transition hover:border-rose-500/40 hover:bg-rose-500/15"
            >
              <div className="flex flex-col gap-2">
                <div className="text-2xl">📸</div>
                <h3 className="font-bold text-white group-hover:text-rose-300 transition">Gallery</h3>
                <p className="text-xs text-slate-400">Event highlights</p>
              </div>
            </Link>

            {/* Reviews */}
            <Link
              href="/reviews"
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 p-5 transition hover:border-cyan-500/40 hover:bg-cyan-500/15"
            >
              <div className="flex flex-col gap-2">
                <div className="text-2xl">⭐</div>
                <h3 className="font-bold text-white group-hover:text-cyan-300 transition">Reviews</h3>
                <p className="text-xs text-slate-400">Client testimonials</p>
              </div>
            </Link>

            {/* Contact */}
            <Link
              href="/contact"
              className="group relative overflow-hidden rounded-xl border border-luxeBlue/40 bg-gradient-to-br from-luxeBlue/20 to-violet-600/10 p-5 transition hover:border-luxeBlue/70 hover:bg-luxeBlue/25"
            >
              <div className="flex flex-col gap-2">
                <div className="text-2xl">💬</div>
                <h3 className="font-bold text-white group-hover:text-luxeBlue transition">Contact</h3>
                <p className="text-xs text-slate-300">Book your event</p>
              </div>
            </Link>
          </div>

          {/* Quick CTA */}
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link href="/booking" className="btn-primary flex-1 text-center">
              Start Booking Inquiry
            </Link>
            <Link href="/contact" className="btn-secondary flex-1 text-center">
              Contact Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
