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

function shouldRenderPublicChat(pathname: string) {
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/booking-reply")) return false;

  return !(
    pathname === "/booking" ||
    pathname === "/contact" ||
    pathname === "/availability" ||
    pathname === "/find-booking" ||
    pathname === "/booking-history"
  );
}

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
  const showChatWidget = shouldRenderPublicChat(pathname);

  if (isAdminRoute) {
    return <>{children}</>;
  }

  if (isDashboardRoute) {
    // Dashboard shell handles its own navigation; keep chat widget and mobile CTA
    return (
      <>
        {children}
        {showChatWidget ? chatWidget : null}
        {mobileBookCta}
      </>
    );
  }

  return (
    <>
      {header}
      {children}
      {showChatWidget ? chatWidget : null}
      {footer}
      {mobileBookCta}
    </>
  );
}
