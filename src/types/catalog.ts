export interface ServiceType {
  title: string;
  description: string;
  image?: string;
}

export interface HeroTrustItem {
  title: string;
  detail: string;
}

export interface ExperiencePillar {
  title: string;
  description: string;
}

export interface EventHighlight {
  title: string;
  audience: string;
  summary: string;
  cta: string;
  image?: string;
  imagePosition?: string;
  imageFit?: "cover" | "contain";
  imageHeight?: number;
}

export interface PackageTier {
  id: string;
  name: string;
  startingAt: string;
  bestFor?: string;
  duration?: string;
  featured?: boolean;
  featureLabel?: string;
  summary: string;
  includes: string[];
  highlights?: string[];
  ctaLabel: string;
}

export interface PackageComparisonRow {
  feature: string;
  basic: string;
  premium: string;
  vip: string;
}

export interface AddOnOption {
  id: string;
  name: string;
  priceHint: string;
  description: string;
}

export interface Testimonial {
  id: string;
  eventType: string;
  trustLabel: string;
  tags: string[];
  featured?: boolean;
  quote: string;
  rating: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  caption: string;
  image: string;
  alt: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SiteContactInfo {
  email: string;
  phone: string;
  phoneHref: string;
  serviceArea: string;
  responseWindow: string;
  bookingCta: {
    title: string;
    description: string;
    badge: string;
  };
}
