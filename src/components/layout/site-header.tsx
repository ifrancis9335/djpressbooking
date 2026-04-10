"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "../../utils/cn";
import { PublicSiteData } from "../../types/site-settings";

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
  siteContact: PublicSiteData["siteContact"];
  primaryCtaLabel: string;
}

export function SiteHeader({ siteContact, primaryCtaLabel }: SiteHeaderProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <header className="sticky top-0 z-[120] border-b border-white/10 bg-[#070a14]/88 backdrop-blur-xl">
      <div className="container-width flex min-h-[76px] items-center justify-between gap-4">
        <Link href="/" className="focusable flex items-center gap-2.5 text-sm font-extrabold uppercase tracking-[0.12em] text-slate-100 md:text-base">
          <Image
            src="/images/branding/dj-press-logo-press.png"
            alt="DJ Press International primary logo"
            width={36}
            height={36}
            className="h-8 w-8 rounded-full border border-luxeGold/35 object-contain shadow-glow md:h-9 md:w-9"
            priority
          />
          <span>DJ <span className="text-luxeGold">Press</span> International</span>
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
          <a href={siteContact.phoneHref} className="focusable mx-3 text-sm font-semibold text-luxeGold">
            {siteContact.phone}
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

          <a
            href={siteContact.phoneHref}
            onClick={() => setIsMobileMenuOpen(false)}
            className="focusable mt-1 rounded-xl border border-luxeGold/35 bg-luxeGold/10 px-4 py-3 text-center text-sm font-semibold text-luxeGold"
          >
            {siteContact.phone}
          </a>

          <Link href="/booking" onClick={() => setIsMobileMenuOpen(false)} className="btn-primary mt-1">
            {primaryCtaLabel}
          </Link>
        </nav>
      </div>
    </header>
  );
}
