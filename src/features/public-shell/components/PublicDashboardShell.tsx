"use client";

import type { ReactNode } from "react";
import { PublicSidebar } from "./PublicSidebar";
import { PublicTopbar } from "./PublicTopbar";

interface PublicDashboardShellProps {
  children: ReactNode;
  siteName: string;
  sitePhone: string;
  sitePhoneHref: string;
}

export function PublicDashboardShell({ children, siteName, sitePhone, sitePhoneHref }: PublicDashboardShellProps) {
  return (
    <div className="public-shell-root">
      <PublicSidebar siteName={siteName} />
      <div className="public-shell-main">
        <PublicTopbar sitePhone={sitePhone} sitePhoneHref={sitePhoneHref} />
        <div className="public-shell-viewport">
          {children}
        </div>
      </div>
    </div>
  );
}
