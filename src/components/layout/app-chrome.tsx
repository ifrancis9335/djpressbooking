"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

// Routes rendered inside the (public) dashboard shell.
// Add paths here as pages migrate to src/app/(public)/.
// The dashboard shell provides its own nav — suppress the site chrome for these.
const PUBLIC_DASHBOARD_ROUTES = new Set([
  "/",
  "/services",
  "/packages",
  "/availability",
  "/gallery",
  "/reviews",
  "/about",
  "/faq",
  "/booking-history",
  "/contact"
]);

interface AppChromeProps {
  header: ReactNode;
  footer: ReactNode;
  chatWidget: ReactNode;
  mobileBookCta: ReactNode;
  children: ReactNode;
}

export function AppChrome({ header, footer, chatWidget, mobileBookCta, children }: AppChromeProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = PUBLIC_DASHBOARD_ROUTES.has(pathname);

  if (isAdminRoute) {
    return <>{children}</>;
  }

  if (isDashboardRoute) {
    // Dashboard shell handles its own navigation; keep chat widget and mobile CTA
    return (
      <>
        {children}
        {chatWidget}
        {mobileBookCta}
      </>
    );
  }

  return (
    <>
      {header}
      {children}
      {chatWidget}
      {footer}
      {mobileBookCta}
    </>
  );
}
