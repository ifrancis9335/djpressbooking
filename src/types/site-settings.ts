export interface ContactSettings {
  phone: string;
  phoneHref: string;
  email: string;
  serviceArea: string;
}

export interface PackageOverride {
  name: string;
  startingAt: string;
  ctaLabel: string;
}

export interface PackageSettings {
  basic: PackageOverride;
  premium: PackageOverride;
  vip: PackageOverride;
}

export interface BookingSettings {
  enabled: boolean;
  notice: string;
}

export interface SiteUiSettings {
  primaryCtaLabel: string;
  heroSupportText: string;
  serviceAreaLine: string;
}

export interface SiteSettings {
  contact: ContactSettings;
  packages: PackageSettings;
  booking: BookingSettings;
  site: SiteUiSettings;
}

export interface PublicSiteData {
  siteContact: {
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
  };
  packageTiers: Array<{
    id: string;
    name: string;
    startingAt: string;
    bestFor: string;
    duration: string;
    featured?: boolean;
    featureLabel?: string;
    summary: string;
    includes: string[];
    highlights?: string[];
    ctaLabel: string;
  }>;
  bookingSettings: BookingSettings;
  siteSettings: SiteUiSettings;
}
