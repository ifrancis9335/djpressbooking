/**
 * Types for the public homepage data shape.
 * These describe the output of getHomePageData() — not the raw CMS data.
 */

import type { PublicSiteData } from "../../types/site-settings";

export interface HomeHeroData {
  kicker: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  heroImage: string;
  logoImage: string;
  siteName: string;
}

export interface HomeServiceItem {
  id: string;
  title: string;
  description: string;
  image?: string;
}

export interface HomeServicesPreviewData {
  kicker: string;
  title: string;
  description: string;
  items: HomeServiceItem[];
}

export interface HomePackageItem {
  id: string;
  name: string;
  startingAt: string;
  bestFor?: string;
  summary: string;
  includes: string[];
  featured?: boolean;
  featureLabel?: string;
  ctaLabel: string;
  highlights?: string[];
  image?: string;
}

export interface HomeGalleryItem {
  id: string;
  title: string;
  category: string;
  caption: string;
  image: string;
  alt: string;
  type: "image" | "video";
  url: string;
}

export interface HomeReviewItem {
  id: string;
  eventType: string;
  trustLabel: string;
  tags: string[];
  featured?: boolean;
  quote: string;
  rating: number;
}

export interface HomeBookingCtaData {
  enabled: boolean;
  notice: string;
  phone: string;
  phoneHref: string;
  email: string;
  serviceArea: string;
  primaryCtaLabel: string;
}

export interface HomeFeaturedExperiencePillar {
  title: string;
  description: string;
}

export interface HomeFeaturedMediaCard {
  id: string;
  title: string;
  category: string;
  image: string;
  alt: string;
  imagePosition?: string;
  isLogo: boolean;
}

export interface HomeFeaturedExperienceData {
  kicker: string;
  title: string;
  description: string;
  pillars: HomeFeaturedExperiencePillar[];
  mediaCards: HomeFeaturedMediaCard[];
}

export interface HomeTrustData {
  kicker: string;
  title: string;
  description: string;
}

export interface HomePageData {
  hero: HomeHeroData;
  featuredExperience: HomeFeaturedExperienceData;
  trust: HomeTrustData;
  servicesPreview: HomeServicesPreviewData;
  packagesPreview: HomePackageItem[];
  galleryPreview: HomeGalleryItem[];
  reviewsPreview: HomeReviewItem[];
  bookingCta: HomeBookingCtaData;
  raw: PublicSiteData;
}
