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
    if (!isMobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

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

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 top-[76px] bg-black/65 backdrop-blur-[2px] transition-opacity duration-200 md:hidden",
          isMobileMenuOpen ? "pointer-events-auto z-[125] opacity-100" : "pointer-events-none -z-10 opacity-0"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        id="mobile-menu-drawer"
        className={cn(
          "fixed inset-x-3 top-[84px] max-h-[calc(100vh-96px)] overflow-y-auto rounded-2xl border border-white/15 bg-[#090f1f]/98 p-3 shadow-panel transition-all duration-200 ease-out md:hidden",
          isMobileMenuOpen
            ? "z-[130] translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-2 opacity-0"
        )}
      >
        <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300">Menu</p>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="focusable rounded-lg border border-white/20 px-2.5 py-1 text-xs font-semibold text-slate-200"
          >
            Close
          </button>
        </div>
        <nav className="flex flex-col gap-1.5" aria-label="Mobile main navigation">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "focusable rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-luxeBlue/45 hover:bg-luxeBlue/10 hover:text-white",
                  active && "border-luxeBlue/45 bg-gradient-to-r from-luxeBlue/25 to-luxePurple/20 text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link href="/booking" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary mt-1">
            {primaryCtaLabel}
          </Link>

          <a
            href={phoneHref}
            onClick={() => setIsMobileMenuOpen(false)}
            className="focusable mt-1 rounded-xl border border-luxeBlue/40 bg-luxeBlue/10 px-4 py-3 text-center text-sm font-semibold text-slate-100"
          >
            {secondaryCtaLabel}: {phone}
          </a>
        </nav>
      </div>
    </header>
  );
}
