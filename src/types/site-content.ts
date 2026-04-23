export interface ManagedImageAsset {
  url: string;
  title: string;
  type: "image";
  mimeType?: string;
  size?: number;
}

export interface BrandingContent {
  siteName: string;
  logoText: string;
  tagline: string;
  logoImage?: string;
  logoImageAsset?: ManagedImageAsset | null;
}

export interface ContactContent {
  headline: string;
  description: string;
  phone: string;
  phoneHref: string;
  email: string;
  serviceArea: string;
  responseWindow: string;
}

export interface HomepageHeroContent {
  kicker: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  heroImage?: string;
  heroImageAsset?: ManagedImageAsset | null;
}

export interface HomepageSectionContent {
  kicker: string;
  title: string;
  description: string;
}

export interface HomepageFinalCtaContent {
  kicker: string;
  title: string;
  description: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
}

export interface SectionIntroContent {
  kicker: string;
  title: string;
  description: string;
}

export interface AboutIntroContent {
  kicker: string;
  title: string;
  paragraphOne: string;
  paragraphTwo: string;
}

export interface ServiceContentItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  image?: string;
  imageAsset?: ManagedImageAsset | null;
  order: number;
}

export interface PackageContentItem {
  id: string;
  name: string;
  price: string;
  description: string;
  features: string[];
  highlight?: boolean;
  visible: boolean;
  imageAsset?: ManagedImageAsset | null;
  order: number;
}

export interface GalleryContentItem {
  id: string;
  url: string;
  type: "image" | "video";
  title?: string;
  caption?: string;
  alt?: string;
  imageAsset?: ManagedImageAsset | null;
  order: number;
}

export interface ReviewContentItem {
  id: string;
  name: string;
  rating: number;
  text: string;
  approved: boolean;
}

export interface AboutStatContentItem {
  id: string;
  label: string;
  value: string;
}

export interface BookingContentSettings {
  enabled: boolean;
  notice: string;
  inquiryTitle: string;
  inquiryDescription: string;
}

export interface SectionVisibilityContent {
  homepageHero: boolean;
  homepageServices: boolean;
  homepagePackages: boolean;
  homepageGallery: boolean;
  homepageReviews: boolean;
  homepageAbout: boolean;
}

export interface SeoBasicsContent {
  defaultTitle: string;
  defaultDescription: string;
  siteUrl: string;
  ogImage: string;
  noIndex: boolean;
}

export interface SiteContent {
  branding: BrandingContent;
  contact: ContactContent;
  homepageHero: HomepageHeroContent;
  homepageFeatured: HomepageSectionContent;
  homepageTrust: HomepageSectionContent;
  homepageHighlights: HomepageSectionContent;
  homepageFinalCta: HomepageFinalCtaContent;
  servicesIntro: SectionIntroContent;
  packagesIntro: SectionIntroContent;
  galleryIntro: SectionIntroContent;
  reviewsIntro: SectionIntroContent;
  aboutIntro: AboutIntroContent;
  services: ServiceContentItem[];
  packages: PackageContentItem[];
  gallery: GalleryContentItem[];
  reviews: ReviewContentItem[];
  aboutStats: AboutStatContentItem[];
  bookingSettings: BookingContentSettings;
  sectionVisibility: SectionVisibilityContent;
  seoBasics: SeoBasicsContent;
}

export type SiteContentSectionKey = keyof SiteContent;

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};
