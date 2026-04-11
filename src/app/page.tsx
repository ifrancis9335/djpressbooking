import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import {
  eventHighlights,
  featuredExperiencePillars,
  heroTrustItems
} from "../data/catalog";
import { AnimatedCounter } from "../components/ui/animated-counter";
import { FallbackImage } from "../components/ui/fallback-image";
import { Reveal } from "../components/ui/reveal";
import { getManagedImageUrl } from "../lib/media";
import { getPublicSiteData } from "../lib/site-settings";
import { getGalleryItems, getPackageItems, getReviewItems, getServiceItems } from "../lib/content-items";

export const metadata: Metadata = {
  title: "Luxury DJ Booking in Charleston",
  description:
    "Book DJ Press International for weddings, nightlife, and high-impact private events in Charleston and surrounding areas."
};

export default async function HomePage() {
  const { siteContact, siteSettings, siteContent } = await getPublicSiteData();
  const visibility = siteContent.sectionVisibility;
  const heroImage = getManagedImageUrl(
    siteContent.homepageHero.heroImageAsset,
    siteContent.homepageHero.heroImage,
    "/images/dj/dj-press-live-performance.jpg"
  );
  const logoImage = getManagedImageUrl(
    siteContent.branding.logoImageAsset,
    siteContent.branding.logoImage,
    "/images/branding/dj-press-logo-press.png"
  );
  const serviceItems = getServiceItems(siteContent);
  const packageItems = getPackageItems(siteContent);
  const galleryItems = getGalleryItems(siteContent);
  const reviewItems = getReviewItems(siteContent);
  const homepageFeatured = {
    kicker: siteContent.homepageFeatured.kicker || "Featured Experience",
    title: siteContent.homepageFeatured.title || "Why Events Feel Different with DJ Press",
    description:
      siteContent.homepageFeatured.description ||
      "Elevated direction, polished pacing, and premium production consistency across event segments."
  };
  const homepageTrust = {
    kicker: siteContent.homepageTrust.kicker || "Trust & Performance",
    title: siteContent.homepageTrust.title || "Why Book DJ Press International",
    description:
      siteContent.homepageTrust.description ||
      "Professional communication, reliable execution, and high-energy event flow designed for mixed audiences."
  };
  const homepageHighlights = {
    kicker: siteContent.homepageHighlights.kicker || "Event Highlights",
    title: siteContent.homepageHighlights.title || "Experiences We Build",
    description:
      siteContent.homepageHighlights.description ||
      "Curated event formats with intentional transitions from opening vibe through peak dancefloor moments."
  };
  const homepageFinalCta = {
    kicker: siteContent.homepageFinalCta.kicker || "Reserve Your Date",
    title: siteContent.homepageFinalCta.title || siteContact.bookingCta.title,
    description: siteContent.homepageFinalCta.description || siteContact.bookingCta.description,
    primaryCtaLabel: siteContent.homepageFinalCta.primaryCtaLabel || "Start Booking Inquiry",
    secondaryCtaLabel: siteContent.homepageFinalCta.secondaryCtaLabel || "Contact Team"
  };

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
      {visibility.homepageHero ? (
      <section className="section-shell">
        <div className="container-width hero-luxury grid gap-6 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div className="hero-luxury-content">
            <p className="section-kicker border-luxeGold/55 bg-luxeGold/12 text-amber-100">
              {siteContent.homepageHero.kicker || siteSettings.heroSupportText}
            </p>
            <h1 className="hero-luxury-title mt-4">
              {siteContent.homepageHero.title}
            </h1>
            <p className="hero-luxury-copy mt-4">
              {siteContent.homepageHero.description}
            </p>
            <div className="cta-rhythm">
              <Link href="/booking" className="btn-primary">{siteContent.homepageHero.primaryCtaLabel || siteSettings.primaryCtaLabel}</Link>
              <Link href="/services" className="btn-secondary">{siteContent.homepageHero.secondaryCtaLabel}</Link>
            </div>

            <div className="hero-mini-stats">
              <AnimatedCounter value={12} suffix="+" label="Event formats" />
              <AnimatedCounter value={24} suffix="h" label="Response target" />
              <AnimatedCounter value={98} suffix="%" label="Client satisfaction focus" />
            </div>
          </div>

          <aside className="hero-side-panel motion-float">
            <figure className="hero-media-shell">
              <FallbackImage
                src={heroImage}
                fallbackSrc="/images/dj/dj-press-live-performance.jpg"
                alt={`${siteContent.branding.siteName} live performance at a premium event`}
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
                <FallbackImage
                  src={logoImage}
                  fallbackSrc="/images/branding/dj-press-logo-press.png"
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
      ) : null}

      <section className="section-shell">
        <Reveal className="container-width">
          <p className="section-kicker">{homepageFeatured.kicker}</p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">{homepageFeatured.title}</h2>
          <p className="mt-3 max-w-3xl text-slate-300">{homepageFeatured.description}</p>
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
          <p className="section-kicker">{homepageTrust.kicker}</p>
          <h2 className="text-3xl font-bold text-white md:text-4xl">{homepageTrust.title}</h2>
          <p className="mt-3 max-w-3xl text-slate-300">{homepageTrust.description}</p>
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
              <p className="text-xs font-extrabold uppercase tracking-wider text-luxeBlue">{homepageFinalCta.kicker}</p>
              <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">Luxury Wedding + Afterparty Flow</h2>
              <p className="mt-3 max-w-2xl text-slate-300">From ceremony transitions to peak-hour dance energy, DJ Press International builds cinematic event momentum with polished pacing and premium sound architecture.</p>
            </div>
            <Link href="/booking" className="btn-primary">{homepageFinalCta.primaryCtaLabel}</Link>
          </div>
        </Reveal>
      </section>

      {visibility.homepageServices ? (
      <section className="section-shell">
        <Reveal className="container-width">
          <p className="section-kicker">{siteContent.servicesIntro.kicker}</p>
          <h2 className="text-3xl font-bold text-white">{siteContent.servicesIntro.title}</h2>
          <p className="mt-3 max-w-3xl text-slate-300">{siteContent.servicesIntro.description}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {serviceItems.slice(0, 6).map((service) => (
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
      ) : null}

      {visibility.homepagePackages ? (
      <section className="section-shell">
        <Reveal className="container-width">
          <p className="section-kicker">{siteContent.packagesIntro.kicker}</p>
          <h2 className="text-3xl font-bold text-white">{siteContent.packagesIntro.title}</h2>
          <p className="mt-3 max-w-3xl text-slate-300">{siteContent.packagesIntro.description}</p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {packageItems.map((tier) => (
              <article key={tier.name} className={`premium-card ${tier.featured ? "package-card-featured" : ""}`}>
                {tier.image ? (
                  <FallbackImage
                    src={tier.image}
                    fallbackSrc="/images/dj/dj-press-live-performance.jpg"
                    alt={`${tier.name} package image`}
                    width={900}
                    height={520}
                    className="mb-3 h-[180px] w-full rounded-xl object-cover"
                  />
                ) : null}
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
      ) : null}

      <section className="section-shell">
        <Reveal className="container-width">
          <p className="section-kicker">{homepageHighlights.kicker}</p>
          <h2 className="text-3xl font-bold text-white">{homepageHighlights.title}</h2>
          <p className="mt-3 max-w-3xl text-slate-300">{homepageHighlights.description}</p>
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

      {visibility.homepageGallery ? (
      <section className="section-shell">
        <Reveal className="container-width">
          <div className="mb-5 flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
            <p className="section-kicker">{siteContent.galleryIntro.kicker}</p>
            <h2 className="text-3xl font-bold text-white">{siteContent.galleryIntro.title}</h2>
            <Link href="/gallery" className="btn-secondary">View Gallery</Link>
          </div>
          <p className="mb-5 max-w-3xl text-slate-300">{siteContent.galleryIntro.description}</p>
          <div className="grid gap-4 md:grid-cols-3">
            {galleryItems.slice(0, 3).map((item) => (
              <figure key={item.id} className="gallery-shell">
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
      ) : null}

      {visibility.homepageReviews ? (
      <section className="section-shell">
        <Reveal className="container-width">
          <div className="mb-5 flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
            <p className="section-kicker">{siteContent.reviewsIntro.kicker}</p>
            <h2 className="text-3xl font-bold text-white">{siteContent.reviewsIntro.title}</h2>
            <Link href="/reviews" className="btn-secondary">Read More</Link>
          </div>
          <p className="mb-5 max-w-3xl text-slate-300">{siteContent.reviewsIntro.description}</p>
          <div className="grid gap-4 md:grid-cols-3">
            {reviewItems.map((review) => (
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
      ) : null}

      {visibility.homepageAbout ? (
      <section className="section-shell pb-16">
        <Reveal className="container-width cta-cinematic">
          <p className="section-kicker">{homepageFinalCta.kicker}</p>
          <h2 className="text-3xl font-bold text-white">{homepageFinalCta.title}</h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            {homepageFinalCta.description}
          </p>
          <p className="cta-powerline">{siteContact.bookingCta.badge}</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/booking" className="btn-primary">{homepageFinalCta.primaryCtaLabel}</Link>
            <Link href="/contact" className="btn-secondary">{homepageFinalCta.secondaryCtaLabel}</Link>
          </div>
        </Reveal>
      </section>
      ) : null}
    </main>
  );
}
