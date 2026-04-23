"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PAGE_LABELS: Record<string, string> = {
  "/": "Overview",
  "/services": "Services",
  "/packages": "Packages",
  "/availability": "Availability",
  "/gallery": "Gallery",
  "/reviews": "Reviews",
  "/about": "About",
  "/faq": "FAQ",
  "/booking-history": "Booking History",
  "/contact": "Contact & Book"
};

const PAGE_SUBTITLES: Record<string, string> = {
  "/": "Mission control for services, packages, and direct booking pathways.",
  "/services": "Review curated event formats and performance specialties.",
  "/packages": "Compare package tiers and choose your best-fit booking lane.",
  "/availability": "Check date readiness and secure event timing quickly.",
  "/gallery": "Preview real event atmosphere and performance moments.",
  "/reviews": "Read verified customer outcomes and confidence signals.",
  "/about": "Brand profile, positioning, and premium service standards.",
  "/faq": "Operational answers for booking, timelines, and logistics.",
  "/booking-history": "Secure timeline for customer booking records and replies.",
  "/contact": "Direct support channel for custom planning and confirmations."
};

function getPageLabel(pathname: string): string {
  if (PAGE_LABELS[pathname]) return PAGE_LABELS[pathname];

  for (const [key, label] of Object.entries(PAGE_LABELS)) {
    if (key !== "/" && pathname.startsWith(key + "/")) return label;
  }

  return "Public";
}

function getPageSubtitle(pathname: string): string {
  if (PAGE_SUBTITLES[pathname]) return PAGE_SUBTITLES[pathname];

  for (const [key, subtitle] of Object.entries(PAGE_SUBTITLES)) {
    if (key !== "/" && pathname.startsWith(key + "/")) return subtitle;
  }

  return "Navigate modules, monitor status, and launch booking actions.";
}

interface PublicTopbarProps {
  sitePhone: string;
  sitePhoneHref: string;
}

export function PublicTopbar({ sitePhone, sitePhoneHref }: PublicTopbarProps) {
  const pathname = usePathname();
  const label = getPageLabel(pathname);
  const subtitle = getPageSubtitle(pathname);

  return (
    <header className="public-shell-topbar">
      <div className="public-shell-topbar-left">
        <div className="public-shell-topbar-meta">
          <span className="public-shell-badge">Public Dashboard</span>
          <span className="public-shell-status-pill">Live</span>
        </div>
        <h1 className="public-shell-page-title">{label}</h1>
        <p className="public-shell-page-subtitle">{subtitle}</p>
      </div>

      <div className="public-shell-topbar-right">
        <a href={sitePhoneHref} className="public-shell-action-btn public-shell-action-btn-secondary hidden md:inline-flex">
          {sitePhone}
        </a>
        <Link href="/booking" className="public-shell-action-btn public-shell-action-btn-primary">
            BOOK NOW
        </Link>
      </div>
    </header>
  );
}
