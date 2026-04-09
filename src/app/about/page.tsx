import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { siteContact } from "../../data/catalog";

export const metadata: Metadata = {
  title: "About DJ Press International",
  description: "Learn the story behind DJ Press International and its premium event philosophy."
};

export default function AboutPage() {
  return (
    <main className="section-shell">
      <div className="container-width grid gap-5 md:grid-cols-[0.95fr_1.05fr] md:items-stretch">
        <section className="premium-card about-media-card">
          <Image
            src="/images/dj/dj-press-performance-portrait.jpg"
            alt="DJ Press brand portrait"
            width={920}
            height={580}
            className="about-media-image"
          />
          <p className="mt-3 text-xs uppercase tracking-[0.16em] text-luxeBlue">DJ Press International</p>
          <p className="mt-1 text-sm text-slate-300">Premium performance direction for weddings, private events, and nightlife.</p>
        </section>

        <section className="premium-card">
          <p className="section-kicker">Brand Story</p>
          <h1 className="text-3xl font-bold text-white">About DJ Press International</h1>
          <p className="mt-3 text-slate-300">
            DJ Press International was built to deliver elite entertainment with disciplined execution. Every event is custom-tailored to
            the audience, timeline, and atmosphere goals.
          </p>
          <p className="mt-3 text-slate-300">
            From weddings and corporate activations to nightlife and cultural events, the focus remains the same: premium quality,
            reliability, and unforgettable crowd energy.
          </p>
          <h2 className="text-2xl text-white">Core Brand Values</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-slate-300">
            <li>Professionalism and clear communication</li>
            <li>Reliable setup, timing, and execution</li>
            <li>Versatility across event formats and demographics</li>
            <li>High-energy performance with controlled flow</li>
            <li>Service focus across {siteContact.serviceArea}</li>
          </ul>
        </section>
      </div>
      <div className="container-width">
        <div className="cta-rhythm">
          <Link href="/booking" className="btn-primary">Book DJ Press International</Link>
          <Link href="/services" className="btn-secondary">Explore Services</Link>
        </div>
      </div>
    </main>
  );
}
