"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface MobileBookCtaProps {
  label: string;
}

export function MobileBookCta({ label }: MobileBookCtaProps) {
  const pathname = usePathname();

  if (
    pathname.startsWith("/booking") ||
    pathname.startsWith("/contact") ||
    pathname.startsWith("/availability") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <Link href="/booking" className="btn-primary sticky-book">
      {label}
    </Link>
  );
}
