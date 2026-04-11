import { siteContact as defaultSiteContact } from "../data/site";
import {
  AboutStatContentItem,
  DeepPartial,
  GalleryContentItem,
  ManagedImageAsset,
  PackageContentItem,
  ReviewContentItem,
  ServiceContentItem,
  SiteContent
} from "../types/site-content";

export const defaultSiteContent: SiteContent = {
  branding: {
    siteName: "DJ Press International",
    logoText: "DJ Press International",
    tagline: "Premium DJ booking in Charleston",
    logoImage: "/images/branding/dj-press-logo-press.png",
    logoImageAsset: undefined
  },
  contact: {
    headline: "Book DJ Press International",
    description: "Share your event details to receive availability and package guidance.",
    phone: defaultSiteContact.phone,
    phoneHref: defaultSiteContact.phoneHref,
    email: defaultSiteContact.email,
    serviceArea: defaultSiteContact.serviceArea,
    responseWindow: defaultSiteContact.responseWindow
  },
  homepageHero: {
    kicker: "Charleston Luxury DJ Booking",
    title: "Premium DJ Experiences for Weddings, Private Events, and Nightlife",
    description:
      "DJ Press International delivers polished event execution, crowd-focused music flow, and premium energy for Charleston-area celebrations.",
    primaryCtaLabel: "Book Now",
    secondaryCtaLabel: "Explore Services",
    heroImage: "/images/dj/dj-press-live-performance.jpg",
    heroImageAsset: undefined
  },
  homepageFeatured: {
    kicker: "Featured Experience",
    title: "Why Events Feel Different with DJ Press",
    description: "Elevated direction, polished pacing, and premium production consistency across event segments."
  },
  homepageTrust: {
    kicker: "Trust & Performance",
    title: "Why Book DJ Press International",
    description: "Professional communication, reliable execution, and high-energy event flow designed for mixed audiences."
  },
  homepageHighlights: {
    kicker: "Event Highlights",
    title: "Experiences We Build",
    description: "Curated event formats with intentional transitions from opening vibe through peak dancefloor moments."
  },
  homepageFinalCta: {
    kicker: "Reserve Your Date",
    title: "Ready to Lock In Your Date?",
    description: "Submit your event details for guided package recommendations and fast availability confirmation.",
    primaryCtaLabel: "Start Booking Inquiry",
    secondaryCtaLabel: "Contact Team"
  },
  servicesIntro: {
    kicker: "Event Services",
    title: "Services & Event Types",
    description: "Each event receives custom curation, technical planning, and premium execution."
  },
  packagesIntro: {
    kicker: "Pricing & Value",
    title: "Packages",
    description: "Transparent starting rates with scalable production options for your event goals."
  },
  galleryIntro: {
    kicker: "Visual Showcase",
    title: "Gallery Experience",
    description: "A premium visual snapshot of sound, lighting, and crowd energy across event styles."
  },
  reviewsIntro: {
    kicker: "Client Confidence",
    title: "Client Reviews",
    description: "High-trust feedback from weddings, private events, and corporate experiences."
  },
  aboutIntro: {
    kicker: "Brand Story",
    title: "About DJ Press International",
    paragraphOne:
      "DJ Press International was built to deliver elite entertainment with disciplined execution.",
    paragraphTwo:
      "From weddings and corporate activations to nightlife and cultural events, the focus remains premium quality and reliability."
  },
  services: [],
  packages: [],
  gallery: [],
  reviews: [],
  aboutStats: [],
  bookingSettings: {
    enabled: true,
    notice: "",
    inquiryTitle: "Booking Inquiry",
    inquiryDescription: "Choose a date first, then submit a short inquiry."
  },
  sectionVisibility: {
    homepageHero: true,
    homepageServices: true,
    homepagePackages: true,
    homepageGallery: true,
    homepageReviews: true,
    homepageAbout: true
  },
  seoBasics: {
    defaultTitle: "DJ Press International",
    defaultDescription:
      "Book DJ Press International for weddings, nightlife, and high-impact private events in Charleston.",
    siteUrl: "http://localhost:3000",
    ogImage: "/images/branding/dj-press-logo-press.png",
    noIndex: false
  }
};

function mergeSection<T extends object>(base: T, patch?: DeepPartial<T>): T {
  if (!patch || typeof patch !== "object") {
    return { ...base };
  }

  const next = { ...base } as Record<string, unknown>;
  const baseRecord = base as Record<string, unknown>;
  const patchRecord = patch as Record<string, unknown>;

  Object.keys(baseRecord).forEach((key) => {
    const incoming = patchRecord[key];

    if (typeof incoming === "undefined") {
      return;
    }

    if (typeof baseRecord[key] === "string") {
      if (typeof incoming !== "string" || incoming.trim() === "") {
        next[key] = baseRecord[key];
      } else {
        next[key] = incoming.trim();
      }
      return;
    }

    if (typeof baseRecord[key] === "boolean") {
      next[key] = typeof incoming === "boolean" ? incoming : baseRecord[key];
      return;
    }

    next[key] = incoming;
  });

  return next as T;
}

function sanitizeString(value: unknown, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed || fallback;
}

function sanitizeOrder(value: unknown, fallback: number) {
  if (typeof value !== "number" || Number.isNaN(value) || value < 0) {
    return fallback;
  }
  return Math.floor(value);
}

function normalizeManagedImageAsset(value: unknown): ManagedImageAsset | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as Partial<ManagedImageAsset>;
  const url = sanitizeString(candidate.url);
  if (!url) {
    return undefined;
  }

  const title = sanitizeString(candidate.title, "Uploaded image");
  const mimeType = sanitizeString(candidate.mimeType) || undefined;
  const size = typeof candidate.size === "number" && Number.isFinite(candidate.size) && candidate.size > 0
    ? Math.floor(candidate.size)
    : undefined;

  return {
    url,
    title,
    type: "image",
    mimeType,
    size
  };
}

function normalizeBrandingContent(input: DeepPartial<SiteContent>["branding"] | undefined) {
  const merged = mergeSection(defaultSiteContent.branding, input);

  return {
    ...merged,
    logoImage: sanitizeString(input?.logoImage) || defaultSiteContent.branding.logoImage,
    logoImageAsset: normalizeManagedImageAsset(input?.logoImageAsset)
  };
}

function normalizeHomepageHeroContent(input: DeepPartial<SiteContent>["homepageHero"] | undefined) {
  const merged = mergeSection(defaultSiteContent.homepageHero, input);

  return {
    ...merged,
    heroImage: sanitizeString(input?.heroImage) || defaultSiteContent.homepageHero.heroImage,
    heroImageAsset: normalizeManagedImageAsset(input?.heroImageAsset)
  };
}

function normalizeServices(input: unknown): ServiceContentItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const normalized: ServiceContentItem[] = [];

  input.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      return;
    }

    const row = item as Partial<ServiceContentItem>;
    const title = sanitizeString(row.title);
    const description = sanitizeString(row.description);
    if (!title || !description) {
      return;
    }

    normalized.push({
      id: sanitizeString(row.id, `service-${index + 1}`),
      title,
      description,
      icon: sanitizeString(row.icon) || undefined,
      image: sanitizeString(row.image) || undefined,
      imageAsset: normalizeManagedImageAsset(row.imageAsset),
      order: sanitizeOrder(row.order, index)
    });
  });

  return normalized.sort((a, b) => a.order - b.order).map((item, index) => ({ ...item, order: index }));
}

function normalizePackages(input: unknown): PackageContentItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const normalized: PackageContentItem[] = [];

  input.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      return;
    }

    const row = item as Partial<PackageContentItem>;
    const name = sanitizeString(row.name);
    const price = sanitizeString(row.price);
    if (!name || !price) {
      return;
    }

    const features = Array.isArray(row.features)
      ? row.features.map((feature) => sanitizeString(feature)).filter(Boolean)
      : [];

    normalized.push({
      id: sanitizeString(row.id, `package-${index + 1}`),
      name,
      price,
      features,
      highlight: typeof row.highlight === "boolean" ? row.highlight : false,
      imageAsset: normalizeManagedImageAsset(row.imageAsset),
      order: sanitizeOrder(row.order, index)
    });
  });

  return normalized.sort((a, b) => a.order - b.order).map((item, index) => ({ ...item, order: index }));
}

function normalizeGallery(input: unknown): GalleryContentItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const normalized: GalleryContentItem[] = [];

  input.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      return;
    }

    const row = item as Partial<GalleryContentItem>;
    const imageAsset = normalizeManagedImageAsset(row.imageAsset);
    const url = sanitizeString(row.url) || imageAsset?.url || "";
    if (!url) {
      return;
    }

    const title = sanitizeString(row.title) || sanitizeString(row.caption) || `Gallery Item ${index + 1}`;
    const caption = sanitizeString(row.caption) || undefined;
    const alt = sanitizeString(row.alt) || title;

    normalized.push({
      id: sanitizeString(row.id, `gallery-${index + 1}`),
      url,
      type: row.type === "video" ? "video" : "image",
      title,
      caption,
      alt,
      imageAsset,
      order: sanitizeOrder(row.order, index)
    });
  });

  return normalized.sort((a, b) => a.order - b.order).map((item, index) => ({ ...item, order: index }));
}

function normalizeReviews(input: unknown): ReviewContentItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const normalized: ReviewContentItem[] = [];

  input.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      return;
    }

    const row = item as Partial<ReviewContentItem>;
    const name = sanitizeString(row.name);
    const text = sanitizeString(row.text);
    if (!name || !text) {
      return;
    }

    const ratingRaw = typeof row.rating === "number" ? row.rating : 5;
    const rating = Math.min(5, Math.max(1, Math.floor(ratingRaw)));

    normalized.push({
      id: sanitizeString(row.id, `review-${index + 1}`),
      name,
      rating,
      text,
      approved: typeof row.approved === "boolean" ? row.approved : true
    });
  });

  return normalized;
}

function normalizeAboutStats(input: unknown): AboutStatContentItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const normalized: AboutStatContentItem[] = [];

  input.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      return;
    }

    const row = item as Partial<AboutStatContentItem>;
    const label = sanitizeString(row.label);
    const value = sanitizeString(row.value);
    if (!label || !value) {
      return;
    }

    normalized.push({
      id: sanitizeString(row.id, `about-stat-${index + 1}`),
      label,
      value
    });
  });

  return normalized;
}

export function mergeSiteContent(contentPatch?: DeepPartial<SiteContent>): SiteContent {
  return {
    branding: normalizeBrandingContent(contentPatch?.branding),
    contact: mergeSection(defaultSiteContent.contact, contentPatch?.contact),
    homepageHero: normalizeHomepageHeroContent(contentPatch?.homepageHero),
    homepageFeatured: mergeSection(defaultSiteContent.homepageFeatured, contentPatch?.homepageFeatured),
    homepageTrust: mergeSection(defaultSiteContent.homepageTrust, contentPatch?.homepageTrust),
    homepageHighlights: mergeSection(defaultSiteContent.homepageHighlights, contentPatch?.homepageHighlights),
    homepageFinalCta: mergeSection(defaultSiteContent.homepageFinalCta, contentPatch?.homepageFinalCta),
    servicesIntro: mergeSection(defaultSiteContent.servicesIntro, contentPatch?.servicesIntro),
    packagesIntro: mergeSection(defaultSiteContent.packagesIntro, contentPatch?.packagesIntro),
    galleryIntro: mergeSection(defaultSiteContent.galleryIntro, contentPatch?.galleryIntro),
    reviewsIntro: mergeSection(defaultSiteContent.reviewsIntro, contentPatch?.reviewsIntro),
    aboutIntro: mergeSection(defaultSiteContent.aboutIntro, contentPatch?.aboutIntro),
    services: normalizeServices(contentPatch?.services),
    packages: normalizePackages(contentPatch?.packages),
    gallery: normalizeGallery(contentPatch?.gallery),
    reviews: normalizeReviews(contentPatch?.reviews),
    aboutStats: normalizeAboutStats(contentPatch?.aboutStats),
    bookingSettings: mergeSection(defaultSiteContent.bookingSettings, contentPatch?.bookingSettings),
    sectionVisibility: mergeSection(defaultSiteContent.sectionVisibility, contentPatch?.sectionVisibility),
    seoBasics: mergeSection(defaultSiteContent.seoBasics, contentPatch?.seoBasics)
  };
}

interface LegacyContentInput {
  content?: DeepPartial<SiteContent>;
  contact?: {
    headline?: string;
    description?: string;
    phone?: string;
    phoneHref?: string;
    email?: string;
    serviceArea?: string;
  };
  booking?: {
    enabled?: boolean;
    notice?: string;
  };
  site?: {
    primaryCtaLabel?: string;
    heroSupportText?: string;
  };
}

export function loadSiteContent(input?: LegacyContentInput): SiteContent {
  const seededFromLegacy: DeepPartial<SiteContent> = {
    contact: {
      phone: input?.contact?.phone,
      phoneHref: input?.contact?.phoneHref,
      email: input?.contact?.email,
      serviceArea: input?.contact?.serviceArea
    },
    bookingSettings: {
      enabled: input?.booking?.enabled,
      notice: input?.booking?.notice
    },
    homepageHero: {
      kicker: input?.site?.heroSupportText,
      primaryCtaLabel: input?.site?.primaryCtaLabel
    },
    homepageFinalCta: {
      title: input?.contact?.headline,
      description: input?.contact?.description
    }
  };

  const withLegacy = mergeSiteContent(seededFromLegacy);
  return mergeSiteContent({ ...withLegacy, ...input?.content });
}

export function mergeSiteContentPatch(current: SiteContent, patch: DeepPartial<SiteContent>): SiteContent {
  return {
    branding: {
      ...mergeSection(current.branding, patch.branding),
      logoImage: typeof patch.branding?.logoImage === "string"
        ? sanitizeString(patch.branding.logoImage) || current.branding.logoImage
        : current.branding.logoImage,
      logoImageAsset: typeof patch.branding?.logoImageAsset === "undefined"
        ? current.branding.logoImageAsset
        : normalizeManagedImageAsset(patch.branding.logoImageAsset)
    },
    contact: mergeSection(current.contact, patch.contact),
    homepageHero: {
      ...mergeSection(current.homepageHero, patch.homepageHero),
      heroImage: typeof patch.homepageHero?.heroImage === "string"
        ? sanitizeString(patch.homepageHero.heroImage) || current.homepageHero.heroImage
        : current.homepageHero.heroImage,
      heroImageAsset: typeof patch.homepageHero?.heroImageAsset === "undefined"
        ? current.homepageHero.heroImageAsset
        : normalizeManagedImageAsset(patch.homepageHero.heroImageAsset)
    },
    homepageFeatured: mergeSection(current.homepageFeatured, patch.homepageFeatured),
    homepageTrust: mergeSection(current.homepageTrust, patch.homepageTrust),
    homepageHighlights: mergeSection(current.homepageHighlights, patch.homepageHighlights),
    homepageFinalCta: mergeSection(current.homepageFinalCta, patch.homepageFinalCta),
    servicesIntro: mergeSection(current.servicesIntro, patch.servicesIntro),
    packagesIntro: mergeSection(current.packagesIntro, patch.packagesIntro),
    galleryIntro: mergeSection(current.galleryIntro, patch.galleryIntro),
    reviewsIntro: mergeSection(current.reviewsIntro, patch.reviewsIntro),
    aboutIntro: mergeSection(current.aboutIntro, patch.aboutIntro),
    services: typeof patch.services === "undefined" ? current.services : normalizeServices(patch.services),
    packages: typeof patch.packages === "undefined" ? current.packages : normalizePackages(patch.packages),
    gallery: typeof patch.gallery === "undefined" ? current.gallery : normalizeGallery(patch.gallery),
    reviews: typeof patch.reviews === "undefined" ? current.reviews : normalizeReviews(patch.reviews),
    aboutStats: typeof patch.aboutStats === "undefined" ? current.aboutStats : normalizeAboutStats(patch.aboutStats),
    bookingSettings: mergeSection(current.bookingSettings, patch.bookingSettings),
    sectionVisibility: mergeSection(current.sectionVisibility, patch.sectionVisibility),
    seoBasics: mergeSection(current.seoBasics, patch.seoBasics)
  };
}
