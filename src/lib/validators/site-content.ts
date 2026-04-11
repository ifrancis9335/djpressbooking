import { z } from "zod";

const textRequired = (min = 1, max = 240) => z.string().trim().min(min).max(max);
const textOptional = (max = 240) => z.string().trim().max(max);

export const managedImageAssetSchema = z.object({
  url: textRequired(1, 500),
  title: textRequired(1, 180),
  type: z.literal("image"),
  mimeType: textOptional(120).optional(),
  size: z.number().int().min(1).max(10 * 1024 * 1024).optional()
});

export const brandingSchema = z.object({
  siteName: textRequired(2, 120),
  logoText: textRequired(1, 120),
  tagline: textRequired(2, 180),
  logoImage: textOptional(320).optional(),
  logoImageAsset: managedImageAssetSchema.nullable().optional()
});

export const contactContentSchema = z.object({
  headline: textRequired(2, 120),
  description: textRequired(2, 320),
  phone: textRequired(5, 40),
  phoneHref: textRequired(5, 60),
  email: z.string().trim().email(),
  serviceArea: textRequired(2, 180),
  responseWindow: textRequired(2, 120)
});

export const homepageHeroSchema = z.object({
  kicker: textRequired(2, 120),
  title: textRequired(2, 180),
  description: textRequired(2, 420),
  primaryCtaLabel: textRequired(2, 80),
  secondaryCtaLabel: textRequired(2, 80),
  heroImage: textOptional(320).optional(),
  heroImageAsset: managedImageAssetSchema.nullable().optional()
});

export const homepageSectionSchema = z.object({
  kicker: textRequired(2, 120),
  title: textRequired(2, 180),
  description: textRequired(2, 420)
});

export const homepageFinalCtaSchema = z.object({
  kicker: textRequired(2, 120),
  title: textRequired(2, 180),
  description: textRequired(2, 420),
  primaryCtaLabel: textRequired(2, 80),
  secondaryCtaLabel: textRequired(2, 80)
});

export const sectionIntroSchema = z.object({
  kicker: textRequired(2, 120),
  title: textRequired(2, 180),
  description: textRequired(2, 420)
});

export const aboutIntroSchema = z.object({
  kicker: textRequired(2, 120),
  title: textRequired(2, 180),
  paragraphOne: textRequired(2, 500),
  paragraphTwo: textRequired(2, 500)
});

export const serviceItemSchema = z.object({
  id: textRequired(2, 120),
  title: textRequired(2, 180),
  description: textRequired(2, 500),
  icon: textOptional(180).optional(),
  image: textOptional(320).optional(),
  imageAsset: managedImageAssetSchema.nullable().optional(),
  order: z.number().int().min(0)
});

export const packageItemSchema = z.object({
  id: textRequired(2, 120),
  name: textRequired(2, 180),
  price: textRequired(1, 80),
  features: z.array(textRequired(1, 180)).default([]),
  highlight: z.boolean().optional(),
  imageAsset: managedImageAssetSchema.nullable().optional(),
  order: z.number().int().min(0)
});

export const galleryItemSchema = z.object({
  id: textRequired(2, 120),
  url: textRequired(1, 500),
  type: z.enum(["image", "video"]),
  title: textOptional(180).optional(),
  caption: textOptional(280).optional(),
  alt: textOptional(240).optional(),
  imageAsset: managedImageAssetSchema.nullable().optional(),
  order: z.number().int().min(0)
});

export const reviewItemSchema = z.object({
  id: textRequired(2, 120),
  name: textRequired(2, 180),
  rating: z.number().int().min(1).max(5),
  text: textRequired(2, 1000),
  approved: z.boolean()
});

export const aboutStatItemSchema = z.object({
  id: textRequired(2, 120),
  label: textRequired(2, 120),
  value: textRequired(1, 120)
});

export const bookingContentSettingsSchema = z.object({
  enabled: z.boolean(),
  notice: textOptional(320),
  inquiryTitle: textRequired(2, 120),
  inquiryDescription: textRequired(2, 320)
});

export const sectionVisibilitySchema = z.object({
  homepageHero: z.boolean(),
  homepageServices: z.boolean(),
  homepagePackages: z.boolean(),
  homepageGallery: z.boolean(),
  homepageReviews: z.boolean(),
  homepageAbout: z.boolean()
});

export const seoBasicsSchema = z.object({
  defaultTitle: textRequired(2, 120),
  defaultDescription: textRequired(2, 320),
  siteUrl: textRequired(5, 260),
  ogImage: textRequired(1, 260),
  noIndex: z.boolean()
});

export const siteContentSchema = z.object({
  branding: brandingSchema,
  contact: contactContentSchema,
  homepageHero: homepageHeroSchema,
  homepageFeatured: homepageSectionSchema,
  homepageTrust: homepageSectionSchema,
  homepageHighlights: homepageSectionSchema,
  homepageFinalCta: homepageFinalCtaSchema,
  servicesIntro: sectionIntroSchema,
  packagesIntro: sectionIntroSchema,
  galleryIntro: sectionIntroSchema,
  reviewsIntro: sectionIntroSchema,
  aboutIntro: aboutIntroSchema,
  services: z.array(serviceItemSchema).default([]),
  packages: z.array(packageItemSchema).default([]),
  gallery: z.array(galleryItemSchema).default([]),
  reviews: z.array(reviewItemSchema).default([]),
  aboutStats: z.array(aboutStatItemSchema).default([]),
  bookingSettings: bookingContentSettingsSchema,
  sectionVisibility: sectionVisibilitySchema,
  seoBasics: seoBasicsSchema
});

export const contactSettingsSchema = z.object({
  phone: textRequired(5, 40),
  phoneHref: textRequired(5, 60),
  email: z.string().trim().email(),
  serviceArea: textRequired(2, 180)
});

export const packageOverrideSchema = z.object({
  name: textRequired(2, 120),
  startingAt: textRequired(1, 60),
  ctaLabel: textRequired(2, 80)
});

export const packageSettingsSchema = z.object({
  basic: packageOverrideSchema,
  premium: packageOverrideSchema,
  vip: packageOverrideSchema
});

export const bookingSettingsSchema = z.object({
  enabled: z.boolean(),
  notice: textOptional(320)
});

export const siteUiSettingsSchema = z.object({
  primaryCtaLabel: textRequired(2, 80),
  heroSupportText: textRequired(2, 160),
  serviceAreaLine: textRequired(2, 180)
});

export const siteSettingsPatchSchema = z
  .object({
    contact: contactSettingsSchema.partial().optional(),
    packages: z
      .object({
        basic: packageOverrideSchema.partial().optional(),
        premium: packageOverrideSchema.partial().optional(),
        vip: packageOverrideSchema.partial().optional()
      })
      .optional(),
    booking: bookingSettingsSchema.partial().optional(),
    site: siteUiSettingsSchema.partial().optional(),
    content: siteContentSchema.partial().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one settings section is required"
  });

export const sectionSchemaMap = {
  branding: brandingSchema,
  contact: contactContentSchema,
  homepageHero: homepageHeroSchema,
  homepageFeatured: homepageSectionSchema,
  homepageTrust: homepageSectionSchema,
  homepageHighlights: homepageSectionSchema,
  homepageFinalCta: homepageFinalCtaSchema,
  servicesIntro: sectionIntroSchema,
  packagesIntro: sectionIntroSchema,
  galleryIntro: sectionIntroSchema,
  reviewsIntro: sectionIntroSchema,
  aboutIntro: aboutIntroSchema,
  services: z.array(serviceItemSchema),
  packages: z.array(packageItemSchema),
  gallery: z.array(galleryItemSchema),
  reviews: z.array(reviewItemSchema),
  aboutStats: z.array(aboutStatItemSchema),
  bookingSettings: bookingContentSettingsSchema,
  sectionVisibility: sectionVisibilitySchema,
  seoBasics: seoBasicsSchema
} as const;

export const contentSectionPatchSchema = z.object({
  section: z.enum([
    "branding",
    "contact",
    "homepageHero",
    "homepageFeatured",
    "homepageTrust",
    "homepageHighlights",
    "homepageFinalCta",
    "servicesIntro",
    "packagesIntro",
    "galleryIntro",
    "reviewsIntro",
    "aboutIntro",
    "services",
    "packages",
    "gallery",
    "reviews",
    "aboutStats",
    "bookingSettings",
    "sectionVisibility",
    "seoBasics"
  ]),
  value: z.unknown()
});
