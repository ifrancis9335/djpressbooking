import { Metadata } from "next";
import Link from "next/link";
import { packageAddOns, packageComparisonRows } from "../../data/catalog";
import { Reveal } from "../../components/ui/reveal";
import { getPublicSiteData } from "../../lib/site-settings";

export const metadata: Metadata = {
  title: "Packages",
  description: "Compare Basic, Premium, and Luxury/VIP DJ packages with add-ons."
};

export default async function PackagesPage() {
  const { packageTiers } = await getPublicSiteData();

  return (
    <main className="section-shell">
      <div className="container-width">
        <Reveal>
          <p className="section-kicker">Pricing & Value</p>
          <h1 className="text-3xl font-bold text-white md:text-4xl">Packages</h1>
          <p className="mt-3 max-w-3xl text-slate-300">Transparent starting rates with scalable production options for your event goals.</p>
        </Reveal>

        <Reveal className="mt-6 grid gap-4 md:grid-cols-3">
          {packageTiers.map((tier) => (
            <article className={`premium-card ${tier.featured ? "package-card-featured" : ""}`} key={tier.id}>
              {tier.featureLabel ? (
                <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-luxeGold">{tier.featureLabel}</p>
              ) : null}
              <span className="rounded-full border border-luxeBlue/40 bg-luxeBlue/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-luxeBlue">
                Starting at {tier.startingAt}
              </span>
              <h2 className="mt-3 text-xl text-white">{tier.name}</h2>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Best for: {tier.bestFor}</p>
              <p className="text-xs text-luxeGold">{tier.duration}</p>
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
          ))}
        </Reveal>

        <Reveal className="mt-8 glass-panel p-5 md:p-7">
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
        </Reveal>

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
    </main>
  );
}
