import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "../components/layout/site-header";
import { SiteFooter } from "../components/layout/site-footer";
import { MobileBookCta } from "../components/layout/mobile-book-cta";
import { getManagedImageUrl } from "../lib/media";
import { getPublicSiteData } from "../lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const { siteContact, siteContent } = await getPublicSiteData();
  const branding = siteContent.branding;
  const logoImage = getManagedImageUrl(branding.logoImageAsset, branding.logoImage, "/images/branding/dj-press-logo-press.png");

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: {
      default: `${branding.siteName} | Premium DJ Booking Platform`,
      template: `%s | ${branding.siteName}`
    },
    description:
      `Premium DJ booking platform for weddings, nightlife, and private events in Charleston, SC and surrounding areas. Call ${siteContact.phone}.`,
    robots: {
      index: true,
      follow: true
    },
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" }
      ],
      shortcut: "/favicon.svg"
    },
    openGraph: {
      title: "DJ Press International",
      description:
        "Luxury event soundtrack design and premium DJ booking for Charleston and surrounding areas.",
      url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      siteName: branding.siteName,
      images: [
        {
          url: logoImage,
          width: 1024,
          height: 1024,
          alt: `${branding.siteName} logo`
        }
      ],
      type: "website",
      locale: "en_US"
    },
    twitter: {
      card: "summary_large_image",
      title: branding.siteName,
      description: "Premium DJ booking for weddings, nightlife, and private events in Charleston.",
      images: [logoImage]
    },
    other: {
      "contact:phone_number": siteContact.phone
    }
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { siteContact, packageTiers, siteSettings, siteContent } = await getPublicSiteData();
  const branding = siteContent.branding;
  const primaryCtaLabel = siteContent.homepageHero.primaryCtaLabel || siteSettings.primaryCtaLabel;
  const secondaryCtaLabel = siteContent.homepageHero.secondaryCtaLabel || "Contact";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: branding.siteName,
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    telephone: siteContact.phone,
    email: siteContact.email,
    areaServed: siteContact.serviceArea,
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: siteContact.phone,
        contactType: "customer service"
      }
    ]
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema)
          }}
        />
        <SiteHeader
          branding={branding}
          phone={siteContact.phone}
          phoneHref={siteContact.phoneHref}
          primaryCtaLabel={primaryCtaLabel}
          secondaryCtaLabel={secondaryCtaLabel}
        />
        {children}
        <SiteFooter
          branding={branding}
          siteContact={siteContact}
          packageTiers={packageTiers}
          serviceAreaLine={siteSettings.serviceAreaLine}
          primaryCtaLabel={primaryCtaLabel}
        />
        <MobileBookCta label={primaryCtaLabel} />
      </body>
    </html>
  );
}
