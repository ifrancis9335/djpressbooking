import { Metadata } from "next";
import Link from "next/link";
import { packageAddOns, packageComparisonRows } from "../../../data/catalog";
import { FallbackImage } from "../../../components/ui/fallback-image";
import { Reveal } from "../../../components/ui/reveal";
import { getPublicSiteData } from "../../../lib/site-settings";
import { getPackageItems } from "../../../lib/content-items";

export const metadata: Metadata = {
  title: "Packages",
  description: "Compare Basic, Premium, and Luxury/VIP DJ packages with add-ons."
};

export default async function PackagesPage() {
  const { siteContent } = await getPublicSiteData();
  const packageItems = getPackageItems(siteContent);
  const showComparisonTable = packageItems.length === 3 && ["basic", "premium", "vip"].every((id) => packageItems.some((item) => item.id === id));

  return (
    <div className="page-container">
      <div className="container-width">
        <Reveal>
          <p className="section-kicker">{siteContent.packagesIntro.kicker}</p>
          <h1 className="text-3xl font-bold text-white md:text-4xl">{siteContent.packagesIntro.title}</h1>
          <p className="mt-3 max-w-3xl text-slate-300">{siteContent.packagesIntro.description}</p>
        </Reveal>

        <Reveal className="mt-6 grid gap-4 md:grid-cols-3">
          {packageItems.length > 0 ? packageItems.map((tier) => (
            <article className={`premium-card ${tier.featured ? "package-card-featured" : ""}`} key={tier.id}>
              {tier.image ? (
                <FallbackImage
                  src={tier.image}
                  fallbackSrc="/images/dj/dj-press-live-performance.jpg"
                  alt={`${tier.name} package image`}
                  width={900}
                  height={520}
                  className="mb-3 h-[200px] w-full rounded-xl object-cover"
                />
              ) : null}
              {tier.featureLabel ? (
                <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-luxeGold">{tier.featureLabel}</p>
              ) : null}
              <span className="rounded-full border border-luxeBlue/40 bg-luxeBlue/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-luxeBlue">
                Starting at {tier.startingAt}
              </span>
              <h2 className="mt-3 text-xl text-white">{tier.name}</h2>
              {tier.bestFor ? <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Best for: {tier.bestFor}</p> : null}
              {tier.duration ? <p className="text-xs text-luxeGold">{tier.duration}</p> : null}
              <p className="mt-2 text-sm text-slate-300">{tier.summary}</p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-300">
                {tier.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              {tier.highlights?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {tier.highlights.map((item) => (
                    <span className="review-tag" key={item}>{item}</span>
                  ))}
                </div>
              ) : null}
              <Link href={`/booking?package=${tier.id}`} className="btn-primary mt-5">{tier.ctaLabel}</Link>
            </article>
          )) : (
            <article className="glass-panel p-5 md:col-span-3">
              <h2 className="text-2xl font-bold text-white">Packages are being updated</h2>
              <p className="mt-3 max-w-2xl text-slate-300">The public package lineup is temporarily hidden while the admin team updates pricing and feature details.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link href="/booking" className="btn-primary">Start Booking Inquiry</Link>
                <Link href="/contact" className="btn-secondary">Contact the Team</Link>
              </div>
            </article>
          )}
        </Reveal>

        {showComparisonTable ? <Reveal className="mt-8 glass-panel p-5 md:p-7">
          <h2 className="text-2xl font-bold text-white">Quick Comparison</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm text-slate-200">
              <thead>
                <tr className="border-b border-white/15 text-xs uppercase tracking-wider text-slate-300">
                  <th className="py-3 pr-4">Feature</th>
                  <th className="py-3 pr-4">Basic</th>
                  <th className="py-3 pr-4">Premium</th>
                  <th className="py-3">Luxury / VIP</th>
                </tr>
              </thead>
              <tbody>
                {packageComparisonRows.map((row) => (
                  <tr className="border-b border-white/10 last:border-b-0" key={row.feature}>
                    <td className="py-3 pr-4">{row.feature}</td>
                    <td>{row.basic}</td>
                    <td>{row.premium}</td>
                    <td>{row.vip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal> : null}

        <section className="mt-8 glass-panel p-5">
          <h2 className="text-2xl font-bold text-white">Add-ons</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {packageAddOns.map((addon) => (
              <article key={addon.id} className="addon-chip">
                <div className="flex items-start justify-between gap-2">
                  <h3>{addon.name}</h3>
                  <span className="text-xs font-semibold text-luxeGold">{addon.priceHint}</span>
                </div>
                <p>{addon.description}</p>
              </article>
            ))}
          </div>
        </section>

        <Reveal className="mt-8 cta-cinematic">
          <h2 className="text-3xl font-bold text-white">Need Help Choosing a Package?</h2>
          <p className="mt-3 max-w-2xl text-slate-300">Submit your event details and receive a package recommendation based on venue, guest profile, and atmosphere goals.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/booking" className="btn-primary">Start Booking Inquiry</Link>
            <Link href="/contact" className="btn-secondary">Talk to the Team</Link>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
