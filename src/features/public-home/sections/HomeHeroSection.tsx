import Link from "next/link";
import { heroTrustItems } from "../../../data/catalog";
import { AnimatedCounter } from "../../../components/ui/animated-counter";
import { FallbackImage } from "../../../components/ui/fallback-image";
import type { HomeHeroData } from "../types";

interface HomeHeroSectionProps {
  hero: HomeHeroData;
}

export function HomeHeroSection({ hero }: HomeHeroSectionProps) {
  return (
    <section className="section-shell">
      <div className="container-width hero-luxury grid gap-6 md:grid-cols-[1.05fr_0.95fr] md:items-center">
        <div className="hero-luxury-content">
          <p className="section-kicker border-luxeGold/55 bg-luxeGold/12 text-amber-100">
            {hero.kicker}
          </p>
          <h1 className="hero-luxury-title mt-4">
            {hero.title}
          </h1>
          <p className="hero-luxury-copy mt-4">
            {hero.description}
          </p>
          <div className="cta-rhythm">
            <Link href="/booking" className="btn-primary">{hero.primaryCtaLabel}</Link>
            <Link href="/services" className="btn-secondary">{hero.secondaryCtaLabel}</Link>
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
              src={hero.heroImage}
              fallbackSrc="/images/dj/dj-press-live-performance.jpg"
              alt={`${hero.siteName} live performance at a premium event`}
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
                src={hero.logoImage}
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
  );
}
