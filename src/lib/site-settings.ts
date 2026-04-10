import { promises as fs } from "fs";
import path from "path";
import { packageTiers as defaultPackageTiers } from "../data/packages";
import { siteContact as defaultSiteContact } from "../data/site";
import { PublicSiteData, SiteSettings } from "../types/site-settings";

const siteSettingsPath = path.join(process.cwd(), "data", "site-settings.json");

function packageDefaults(id: "basic" | "premium" | "vip") {
  const tier = defaultPackageTiers.find((item) => item.id === id);
  return {
    name: tier?.name || id,
    startingAt: tier?.startingAt || "",
    ctaLabel: tier?.ctaLabel || "Book"
  };
}

const basicDefaults = packageDefaults("basic");
const premiumDefaults = packageDefaults("premium");
const vipDefaults = packageDefaults("vip");

const defaultSettings: SiteSettings = {
  contact: {
    phone: defaultSiteContact.phone,
    phoneHref: defaultSiteContact.phoneHref,
    email: defaultSiteContact.email,
    serviceArea: defaultSiteContact.serviceArea
  },
  packages: {
    basic: basicDefaults,
    premium: premiumDefaults,
    vip: vipDefaults
  },
  booking: {
    enabled: true,
    notice: ""
  },
  site: {
    primaryCtaLabel: "Book Now",
    heroSupportText: "Charleston Luxury DJ Booking",
    serviceAreaLine: defaultSiteContact.serviceArea
  }
};

function normalizeSettings(input: unknown): SiteSettings {
  if (!input || typeof input !== "object") {
    return defaultSettings;
  }

  const candidate = input as Partial<SiteSettings>;
  return {
    contact: {
      phone: candidate.contact?.phone?.trim() || defaultSettings.contact.phone,
      phoneHref: candidate.contact?.phoneHref?.trim() || defaultSettings.contact.phoneHref,
      email: candidate.contact?.email?.trim() || defaultSettings.contact.email,
      serviceArea: candidate.contact?.serviceArea?.trim() || defaultSettings.contact.serviceArea
    },
    packages: {
      basic: {
        name: candidate.packages?.basic?.name?.trim() || defaultSettings.packages.basic.name,
        startingAt: candidate.packages?.basic?.startingAt?.trim() || defaultSettings.packages.basic.startingAt,
        ctaLabel: candidate.packages?.basic?.ctaLabel?.trim() || defaultSettings.packages.basic.ctaLabel
      },
      premium: {
        name: candidate.packages?.premium?.name?.trim() || defaultSettings.packages.premium.name,
        startingAt: candidate.packages?.premium?.startingAt?.trim() || defaultSettings.packages.premium.startingAt,
        ctaLabel: candidate.packages?.premium?.ctaLabel?.trim() || defaultSettings.packages.premium.ctaLabel
      },
      vip: {
        name: candidate.packages?.vip?.name?.trim() || defaultSettings.packages.vip.name,
        startingAt: candidate.packages?.vip?.startingAt?.trim() || defaultSettings.packages.vip.startingAt,
        ctaLabel: candidate.packages?.vip?.ctaLabel?.trim() || defaultSettings.packages.vip.ctaLabel
      }
    },
    booking: {
      enabled: typeof candidate.booking?.enabled === "boolean" ? candidate.booking.enabled : defaultSettings.booking.enabled,
      notice: candidate.booking?.notice?.trim() ?? defaultSettings.booking.notice
    },
    site: {
      primaryCtaLabel: candidate.site?.primaryCtaLabel?.trim() || defaultSettings.site.primaryCtaLabel,
      heroSupportText: candidate.site?.heroSupportText?.trim() || defaultSettings.site.heroSupportText,
      serviceAreaLine: candidate.site?.serviceAreaLine?.trim() || defaultSettings.site.serviceAreaLine
    }
  };
}

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const raw = await fs.readFile(siteSettingsPath, "utf8");
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return defaultSettings;
  }
}

export async function saveSiteSettings(next: SiteSettings): Promise<SiteSettings> {
  const normalized = normalizeSettings(next);
  await fs.writeFile(siteSettingsPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

export async function patchSiteSettings(partial: Partial<SiteSettings>): Promise<SiteSettings> {
  const current = await getSiteSettings();
  const merged: SiteSettings = {
    contact: { ...current.contact, ...partial.contact },
    packages: {
      basic: { ...current.packages.basic, ...partial.packages?.basic },
      premium: { ...current.packages.premium, ...partial.packages?.premium },
      vip: { ...current.packages.vip, ...partial.packages?.vip }
    },
    booking: { ...current.booking, ...partial.booking },
    site: { ...current.site, ...partial.site }
  };

  return saveSiteSettings(merged);
}

export async function getPublicSiteData(): Promise<PublicSiteData> {
  const settings = await getSiteSettings();

  const packageMap = new Map(
    defaultPackageTiers.map((tier) => {
      const override = settings.packages[tier.id as keyof SiteSettings["packages"]];
      return [
        tier.id,
        {
          ...tier,
          name: override?.name || tier.name,
          startingAt: override?.startingAt || tier.startingAt,
          ctaLabel: override?.ctaLabel || tier.ctaLabel
        }
      ];
    })
  );

  return {
    siteContact: {
      ...defaultSiteContact,
      email: settings.contact.email,
      phone: settings.contact.phone,
      phoneHref: settings.contact.phoneHref,
      serviceArea: settings.contact.serviceArea
    },
    packageTiers: defaultPackageTiers.map((tier) => packageMap.get(tier.id) || tier),
    bookingSettings: settings.booking,
    siteSettings: settings.site
  };
}
