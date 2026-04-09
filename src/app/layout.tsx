import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "../components/layout/site-header";
import { SiteFooter } from "../components/layout/site-footer";
import { MobileBookCta } from "../components/layout/mobile-book-cta";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "DJ Press International | Premium DJ Booking Platform",
    template: "%s | DJ Press International"
  },
  description:
    "Premium DJ booking platform for weddings, nightlife, and private events in Charleston, SC and surrounding areas.",
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
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
        <SiteFooter />
        <MobileBookCta />
      </body>
    </html>
  );
}
