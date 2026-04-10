import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "../components/layout/site-header";
import { SiteFooter } from "../components/layout/site-footer";
import { MobileBookCta } from "../components/layout/mobile-book-cta";
import { getPublicSiteData } from "../lib/site-settings";

export async function generateMetadata(): Promise<Metadata> {
  const { siteContact } = await getPublicSiteData();

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: {
      default: "DJ Press International | Premium DJ Booking Platform",
      template: "%s | DJ Press International"
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
      siteName: "DJ Press International",
      images: [
        {
          url: "/images/branding/dj-press-logo-press.png",
          width: 1024,
          height: 1024,
          alt: "DJ Press International logo"
        }
      ],
      type: "website",
      locale: "en_US"
    },
    twitter: {
      card: "summary_large_image",
      title: "DJ Press International",
      description: "Premium DJ booking for weddings, nightlife, and private events in Charleston.",
      images: ["/images/branding/dj-press-logo-press.png"]
    },
    other: {
      "contact:phone_number": siteContact.phone
    }
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { siteContact, packageTiers, siteSettings } = await getPublicSiteData();

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "DJ Press International",
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
        <SiteHeader siteContact={siteContact} primaryCtaLabel={siteSettings.primaryCtaLabel} />
        {children}
        <SiteFooter
          siteContact={siteContact}
          packageTiers={packageTiers}
          primaryCtaLabel={siteSettings.primaryCtaLabel}
          serviceAreaLine={siteSettings.serviceAreaLine}
        />
        <MobileBookCta label={siteSettings.primaryCtaLabel} />
      </body>
    </html>
  );
}
