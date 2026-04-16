"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getManagedImageUrl } from "../../lib/media";
import { cn } from "../../utils/cn";
import { BrandingContent } from "../../types/site-content";
import { FallbackImage } from "../ui/fallback-image";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/packages", label: "Packages" },
  { href: "/availability", label: "Availability" },
  { href: "/gallery", label: "Gallery" },
  { href: "/reviews", label: "Reviews" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/find-booking", label: "Booking History" },
  { href: "/contact", label: "Contact" }
];

interface SiteHeaderProps {
  branding: BrandingContent;
  phone: string;
  phoneHref: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
}

function renderBrandText(text: string) {
  const match = text.match(/press/i);
  if (!match || typeof match.index !== "number") {
    return <span className="truncate">{text}</span>;
  }

  const start = match.index;
  const end = start + match[0].length;
  return (
    <span className="truncate">
      {text.slice(0, start)}
      <span className="text-luxeGold">{text.slice(start, end)}</span>
      {text.slice(end)}
    </span>
  );
}

export function SiteHeader({ branding, phone, phoneHref, primaryCtaLabel, secondaryCtaLabel }: SiteHeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const logoImage = getManagedImageUrl(branding.logoImageAsset, branding.logoImage, "/images/branding/dj-press-logo-press.png");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-[120] border-b border-white/10 bg-[#070a14]/88 backdrop-blur-xl">
      <div className="container-width flex min-h-[76px] items-center justify-between gap-3">
        <Link href="/" className="focusable flex min-w-0 max-w-[74%] items-center gap-2.5 text-sm font-extrabold uppercase tracking-[0.12em] text-slate-100 md:max-w-none md:text-base">
          <FallbackImage
            src={logoImage}
            fallbackSrc="/images/branding/dj-press-logo-press.png"
            alt={`${branding.siteName} primary logo`}
            width={36}
            height={36}
            className="h-8 w-8 rounded-full border border-luxeGold/35 object-contain shadow-glow md:h-9 md:w-9"
            priority
          />
          {renderBrandText(branding.logoText || branding.siteName)}
        </Link>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu-drawer"
          className="focusable rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 md:hidden"
        >
          {isMobileMenuOpen ? "Close" : "Menu"}
        </button>

        <nav className="hidden md:flex md:items-center md:gap-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focusable block border-b border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-luxeBlue/10 hover:text-white md:rounded-lg md:border-0 md:px-3 md:py-2",
                  active && "bg-gradient-to-r from-luxeBlue/25 to-luxePurple/20 text-white md:shadow-glow md:ring-1 md:ring-luxeBlue/45"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <a href={phoneHref} className="focusable hidden rounded-lg px-2 py-2 text-sm font-semibold text-slate-300 transition hover:bg-luxeBlue/10 hover:text-white xl:block">
            {phone}
          </a>
          <Link href="/booking" className="btn-primary md:ml-2">
            {primaryCtaLabel}
          </Link>
        </nav>
      </div>

      {isMobileMenuOpen ? (
        <div
          id="mobile-menu-drawer"
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile main navigation"
        >
          <div className="relative flex min-h-screen flex-col overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close mobile menu"
              className="focusable absolute right-5 top-5 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-2xl font-semibold leading-none text-white transition hover:bg-blue-500/20"
            >
              <span aria-hidden="true">×</span>
            </button>

            <div className="container-width flex w-full flex-1 flex-col px-0 pb-8 pt-24">
              <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-5">
                <FallbackImage
                  src={logoImage}
                  fallbackSrc="/images/branding/dj-press-logo-press.png"
                  alt={`${branding.siteName} primary logo`}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-full border border-luxeGold/35 object-contain shadow-glow"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Navigation</p>
                  <p className="truncate text-base font-semibold text-white">{branding.logoText || branding.siteName}</p>
                </div>
              </div>

              <nav className="flex flex-col gap-4" aria-label="Mobile main navigation">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "focusable w-full rounded-xl border border-white/10 px-5 py-4 text-left text-[18px] font-medium text-white transition hover:bg-blue-500/20",
                        active && "border-luxeBlue/50 bg-gradient-to-r from-luxeBlue/25 to-luxePurple/20 shadow-glow"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}

                <Link
                  href="/booking"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="focusable mt-2 inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-luxeBlue to-[#0072ff] px-5 py-4 text-[18px] font-semibold text-white transition hover:brightness-110"
                >
                  {primaryCtaLabel}
                </Link>

                <a
                  href={phoneHref}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="focusable w-full rounded-xl border border-white/10 px-5 py-4 text-left text-[18px] font-medium text-white transition hover:bg-blue-500/20"
                >
                  {secondaryCtaLabel}: {phone}
                </a>
              </nav>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
