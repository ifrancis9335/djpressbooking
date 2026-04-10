import Link from "next/link";
import Image from "next/image";
import { PublicSiteData } from "../../types/site-settings";

interface SiteFooterProps {
  siteContact: PublicSiteData["siteContact"];
  packageTiers: PublicSiteData["packageTiers"];
  primaryCtaLabel: string;
  serviceAreaLine: string;
}

export function SiteFooter({ siteContact, packageTiers, primaryCtaLabel, serviceAreaLine }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="footer-shell">
      <div className="container-width grid gap-8 py-12 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="section-kicker border-luxeGold/45 bg-luxeGold/10 text-amber-100">{serviceAreaLine}</p>
          <div className="mt-3 flex items-center gap-3">
            <Image
              src="/images/branding/dj-press-logo-press.png"
              alt="DJ Press International primary logo"
              width={52}
              height={52}
              className="h-11 w-11 rounded-full border border-luxeGold/35 object-contain"
            />
            <h3 className="text-lg font-bold text-white">DJ Press International</h3>
          </div>
          <p className="mt-2 text-sm text-slate-300">
            Premium DJ booking and event soundtrack design for {siteContact.serviceArea}.
          </p>
          <a className="focusable mt-3 inline-block text-sm font-semibold text-luxeGold" href={`mailto:${siteContact.email}`}>
            {siteContact.email}
          </a>
          <p className="mt-1 text-sm text-slate-300">
            <a className="focusable text-slate-200 hover:text-white" href={siteContact.phoneHref}>{siteContact.phone}</a>
          </p>
          <p className="mt-4 text-xs uppercase tracking-wider text-slate-400">Luxury nightlife energy. Professional event precision.</p>
          <div className="mt-3">
            <Image
              src="/images/branding/dj-press-logo-press.png"
              alt="DJ Press International primary logo"
              width={48}
              height={48}
              className="h-9 w-9 object-contain opacity-65"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">Explore</h3>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
            <Link className="footer-link" href="/services">Services</Link>
            <Link className="footer-link" href="/packages">Packages</Link>
            <Link className="footer-link" href="/availability">Availability</Link>
            <Link className="footer-link" href="/gallery">Gallery</Link>
            <Link className="footer-link" href="/reviews">Reviews</Link>
            <Link className="footer-link" href="/faq">FAQ</Link>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">Packages</h3>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
            {packageTiers.map((tier) => (
              <Link className="footer-link" key={tier.id} href={`/booking?package=${tier.id}`}>
                {tier.name} ({tier.startingAt})
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white">Policy & Booking</h3>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300">
            <Link className="footer-link" href="/booking-policy">Booking Policy</Link>
            <Link className="footer-link" href="/privacy">Privacy Policy</Link>
            <Link className="footer-link" href="/terms">Terms</Link>
            <Link className="footer-link" href="/contact">Contact</Link>
            <Link className="footer-link font-semibold text-luxeGold" href="/booking">{primaryCtaLabel}</Link>
          </div>
          <Link className="btn-primary mt-4" href="/booking">Start Booking Inquiry</Link>
          <p className="mt-4 text-xs tracking-wide text-slate-400">Copyright {year} DJ Press International. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
