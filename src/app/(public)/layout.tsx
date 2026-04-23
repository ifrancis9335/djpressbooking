import type { ReactNode } from "react";
import { getPublicSiteData } from "../../lib/site-settings";
import { PublicDashboardShell } from "../../features/public-shell/components/PublicDashboardShell";

interface PublicLayoutProps {
  children: ReactNode;
}

export default async function PublicLayout({ children }: PublicLayoutProps) {
  const { siteContent, siteContact } = await getPublicSiteData();
  const siteName = siteContent.branding.siteName;

  return (
    <PublicDashboardShell
      siteName={siteName}
      sitePhone={siteContact.phone}
      sitePhoneHref={siteContact.phoneHref}
    >
      {children}
    </PublicDashboardShell>
  );
}
