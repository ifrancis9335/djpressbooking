import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import {
  eventHighlights,
  featuredExperiencePillars,
  galleryItems,
  heroTrustItems,
  serviceTypes,
  testimonials
} from "../data/catalog";
import { AnimatedCounter } from "../components/ui/animated-counter";
import { Reveal } from "../components/ui/reveal";
import { getPublicSiteData } from "../lib/site-settings";

export const metadata: Metadata = {
  title: "Luxury DJ Booking in Charleston",
  description:
    "Book DJ Press International for weddings, nightlife, and high-impact private events in Charleston and surrounding areas."
};

export default async function HomePage() {
  const { packageTiers, siteContact, siteSettings } = await getPublicSiteData();

  const featuredMediaCards = [
    {
      id: "live-dj-performance",
      title: "Live DJ Performance",
      category: "Live Performance",
      image: "/images/dj/dj-press-live-performance.jpg",
      alt: "DJ Press performing live behind the DJ booth",
      imagePosition: "center 24%",
      isLogo: false
    },
    {
      id: "brand-identity-card",
      title: "Branded Booth Identity",
      category: "Brand Presence",
      image: "/images/branding/dj-press-logo-press.png",
      alt: "DJ Press International logo mark",
      isLogo: true
    }
  ] as const;

  return (
    <main>
      <section className="section-shell">
        <div className="container-width hero-luxury grid gap-6 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div className="hero-luxury-content">
            <p className="section-kicker border-luxeGold/55 bg-luxeGold/12 text-amber-100">
              {siteSettings.heroSupportText}
            </p>
            <h1 className="hero-luxury-title mt-4">
              Premium DJ Experiences for Weddings, Private Events, and Nightlife
            </h1>
            <p className="hero-luxury-copy mt-4">
              DJ Press International delivers polished event execution, crowd-focused music flow, and premium energy for Charleston-area celebrations.
              From first dance to final set, every transition is intentional and professionally managed.
            </p>
            <div className="cta-rhythm">
              <Link href="/booking" className="btn-primary">{siteSettings.primaryCtaLabel}</Link>
              <Link href="/services" className="btn-secondary">Explore Services</Link>
            </div>

            <div className="hero-mini-stats">
              <AnimatedCounter value={12} suffix="+" label="Event formats" />
              <AnimatedCounter value={24} suffix="h" label="Response target" />
              <AnimatedCounter value={98} suffix="%" label="Client satisfaction focus" />
            </div>
          </div>

          <aside className="hero-side-panel motion-float">
            <figure className="hero-media-shell">
              <Image
                src="/images/dj/dj-press-live-performance.jpg"
                alt="DJ Press live performance at a premium event"
                width={980}
                height={780}
                className="hero-media-image"
                priority
              />
              <figcaption className="hero-media-caption">Live DJ Performance</figcaption>
            </figure>
            <div className="mt-3 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-white md:text-xl">Why Clients Book DJ Press</h2>
              <span className="hero-support-mark" aria-hidden="true">
                <Image
                  src="/images/branding/dj-press-logo-press.png"
                  alt="PRESS turntable brand mark"
                  width={38}
                  height={38}
                  className="h-7 w-7 object-contain"
                />
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {heroTrustItems.map((item) => (
                <article key={item.title} className="trust-item">
                  <h3>{item.title}</h3>
                  <p>{item.detail}</p>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="section-shell">
        <Reveal className="container-width">
          <p className="section-kicker">Featured Experience</p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">Why Events Feel Different with DJ Press</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="experience-grid mt-0">
              {featuredExperiencePillars.map((pillar) => (
                <article className="premium-card" key={pillar.title}>
                  <h3 className="text-xl text-white">{pillar.title}</h3>
                  <p className="mt-2 text-slate-300">{pillar.description}</p>
                </article>
              ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {featuredMediaCards.map((item) => (
                <figure key={item.id} className={`gallery-shell relative ${item.isLogo ? "booth-brand-shell" : ""}`}>
                  <Image
                    src={item.image}
                    alt={item.alt}
                    width={900}
                    height={560}
                    className={item.isLogo ? "booth-brand-image" : "h-[210px] w-full object-cover"}
                    style={item.isLogo ? undefined : { objectPosition: item.imagePosition }}
                  />
                  {item.isLogo ? (
                    <figcaption className="brand-card-label">{item.title}</figcaption>
                  ) : (
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#05070f]/95 to-transparent p-3">
                      <p className="text-xs uppercase tracking-wider text-luxeBlue">{item.category}</p>
                      <p className="mt-1 text-sm font-semibold text-white">{item.title}</p>
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="section-shell">
        <Reveal className="container-width">
          <p className="section-kicker">Trust & Performance</p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">Why Book DJ Press International</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <article className="premium-card"><h3 className="text-xl text-white">Energy + Control</h3><p className="mt-2 text-slate-300">Dynamic crowd engagement without sacrificing timeline precision.</p></article>
            <article className="premium-card"><h3 className="text-xl text-white">Genre Versatility</h3><p className="mt-2 text-slate-300">Hip-Hop, R&B, Afrobeat, Reggae, Classics, and event-specific blends.</p></article>
            <article className="premium-card"><h3 className="text-xl text-white">Booking Confidence</h3><p className="mt-2 text-slate-300">Strong process from inquiry to confirmation with premium communication.</p></article>
          </div>
        </Reveal>
      </section>

      <section className="section-shell">
        <Reveal className="container-width">
          <div className="spotlight-card grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-luxeBlue">Event Spotlight</p>
              <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">Luxury Wedding + Afterparty Flow</h2>
              <p className="mt-3 max-w-2xl text-slate-300">From ceremony transitions to peak-hour dance energy, DJ Press International builds cinematic event momentum with polished pacing and premium sound architecture.</p>
            </div>
            <Link href="/booking" className="btn-primary">Reserve Your Date</Link>
          </div>
        </Reveal>
      </section>

      <section className="section-shell">
        <Reveal className="container-width">
          <p className="section-kicker">Event Coverage</p>
          <h2 className="text-3xl font-bold text-white">Event Types</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {serviceTypes.slice(0, 6).map((service) => (
              <article key={service.title} className="premium-card">
                <h3 className="text-lg text-white">{service.title}</h3>
                <p className="mt-2 text-sm text-slate-300">{service.description}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/services" className="btn-secondary">View All Services</Link>
            <Link href="/booking" className="btn-primary">Book Your Event</Link>
          </div>
        </Reveal>
      </section>

      <section className="section-shell">
        <Reveal className="container-width">
          <p className="section-kicker">Pricing</p>
          <h2 className="text-3xl font-bold text-white">Featured Packages</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {packageTiers.map((tier) => (
              <article key={tier.name} className={`premium-card ${tier.featured ? "package-card-featured" : ""}`}>
                <span className="rounded-full border border-luxeBlue/40 bg-luxeBlue/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-luxeBlue">Starting at {tier.startingAt}</span>
                <h3 className="mt-3 text-xl text-white">{tier.name}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Best for: {tier.bestFor}</p>
                <p className="mt-2 text-sm text-slate-300">{tier.summary}</p>
                <p className="mt-2 text-xs text-luxeGold">{tier.duration}</p>
                <Link href="/booking" className="btn-primary mt-4">{tier.ctaLabel}</Link>
              </article>
            ))}
          </div>
          <div className="mt-5">
            <Link href="/packages" className="btn-secondary">Explore Full Packages</Link>
          </div>
        </Reveal>
      </section>

      <section className="section-shell">
        <Reveal className="container-width">
          <p className="section-kicker">Event Highlights</p>
          <h2 className="text-3xl font-bold text-white">Experiences We Build</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {eventHighlights.map((highlight) => (
              <article className="event-highlight-card" key={highlight.title}>
                {highlight.image ? (
                  <figure className="event-highlight-media">
                    <Image
                      src={highlight.image}
                      alt={highlight.title}
                      width={900}
                      height={540}
                      className={`event-highlight-thumb ${highlight.imageFit === "contain" ? "event-highlight-thumb-contain" : "event-highlight-thumb-cover"}`}
                      style={{
                        objectPosition: highlight.imagePosition ?? "center 24%",
                        height: highlight.imageHeight ? `${highlight.imageHeight}px` : undefined
                      }}
                    />
                  </figure>
                ) : null}
                <p className="text-xs font-extrabold uppercase tracking-wider text-luxeBlue">{highlight.audience}</p>
                <h3 className="mt-2 text-2xl text-white">{highlight.title}</h3>
                <p className="mt-2">{highlight.summary}</p>
                <Link href="/booking" className="btn-ghost mt-4">{highlight.cta}</Link>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="section-shell">
        <Reveal className="container-width">
          <div className="mb-5 flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
            <p className="section-kicker">Experience</p>
            <h2 className="text-3xl font-bold text-white">Gallery Preview</h2>
            <Link href="/gallery" className="btn-secondary">View Gallery</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {galleryItems.slice(0, 3).map((item) => (
              <figure key={item.title} className="gallery-shell">
                <Image src={item.image} alt={item.alt} width={800} height={500} className="h-[235px] w-full object-cover" />
                <figcaption className="p-3 text-sm font-semibold text-slate-200">
                  {item.title}
                  <p className="mt-1 text-xs font-normal text-slate-400">{item.caption}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="section-shell">
        <Reveal className="container-width">
          <div className="mb-5 flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
            <p className="section-kicker">Social Proof</p>
            <h2 className="text-3xl font-bold text-white">Client Reviews</h2>
            <Link href="/reviews" className="btn-secondary">Read More</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((review) => (
              <article className="quote-card" key={review.id}>
                <p className="text-luxeGold">{"★".repeat(review.rating)}</p>
                <h3 className="mt-2 text-lg text-white">{review.eventType}</h3>
                <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">{review.trustLabel}</p>
                <p className="mt-2 text-sm text-slate-300">&ldquo;{review.quote}&rdquo;</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {review.tags.map((tag) => (
                    <span className="review-tag" key={tag}>{tag}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
          <div className="cta-rhythm">
            <Link href="/reviews" className="btn-secondary">Read Full Reviews</Link>
            <Link href="/booking" className="btn-primary">Book with Confidence</Link>
          </div>
        </Reveal>
      </section>

      <section className="section-shell pb-16">
        <Reveal className="container-width cta-cinematic">
          <p className="section-kicker">Reserve Your Date</p>
          <h2 className="text-3xl font-bold text-white">{siteContact.bookingCta.title}</h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            {siteContact.bookingCta.description}
          </p>
          <p className="cta-powerline">{siteContact.bookingCta.badge}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/booking" className="btn-primary">Start Booking Inquiry</Link>
            <Link href="/contact" className="btn-secondary">Contact Team</Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
