"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "../../utils/cn";

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

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#070a14]/88 backdrop-blur-xl">
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
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls="main-nav"
          className="focusable rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-100 md:hidden"
        >
          Menu
        </button>

        <nav id="main-nav" className={cn("absolute left-0 right-0 top-[76px] border-b border-white/10 bg-[#080c19]/98 pb-3 shadow-panel md:static md:flex md:items-center md:gap-2 md:border-0 md:bg-transparent md:pb-0 md:shadow-none", open ? "block" : "hidden md:flex")}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
                className={cn(
                  "focusable block border-b border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-luxeBlue/10 hover:text-white md:rounded-lg md:border-0 md:px-3 md:py-2",
                  active && "bg-gradient-to-r from-luxeBlue/25 to-luxePurple/20 text-white md:shadow-glow md:ring-1 md:ring-luxeBlue/45"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Link href="/booking" className="btn-primary m-3 mt-2 md:m-0 md:ml-2">
            Book Now
          </Link>
        </nav>
      </div>
    </header>
  );
}
