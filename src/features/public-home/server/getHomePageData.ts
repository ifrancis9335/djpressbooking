import { getPublicViewModel } from "../../public-core/getPublicViewModel";
import { getManagedImageUrl } from "../../../lib/media";
import { featuredExperiencePillars } from "../../../data/catalog";
import type {
  HomePageData,
  HomeHeroData,
  HomeFeaturedExperienceData,
  HomeTrustData,
  HomeBookingCtaData,
  HomeServicesPreviewData,
  HomeServiceItem,
  HomePackageItem,
  HomeGalleryItem,
  HomeReviewItem
} from "../types";

const PREVIEW_LIMIT = 3;
const SERVICES_PREVIEW_LIMIT = 6;

export async function getHomePageData(): Promise<HomePageData> {
  const vm = await getPublicViewModel();

  const hero: HomeHeroData = {
    kicker: vm.raw.siteContent.homepageHero.kicker || vm.raw.siteSettings.heroSupportText,
    title: vm.raw.siteContent.homepageHero.title,
    description: vm.raw.siteContent.homepageHero.description,
    primaryCtaLabel: vm.raw.siteContent.homepageHero.primaryCtaLabel || vm.raw.siteSettings.primaryCtaLabel,
    secondaryCtaLabel: vm.raw.siteContent.homepageHero.secondaryCtaLabel,
    heroImage: getManagedImageUrl(
      vm.raw.siteContent.homepageHero.heroImageAsset,
      vm.raw.siteContent.homepageHero.heroImage,
      "/images/dj/dj-press-live-performance.jpg"
    ),
    logoImage: getManagedImageUrl(
      vm.raw.siteContent.branding.logoImageAsset,
      vm.raw.siteContent.branding.logoImage,
      "/images/branding/dj-press-logo-press.png"
    ),
    siteName: vm.raw.siteContent.branding.siteName
  };

  const servicesPreview: HomeServicesPreviewData = {
    kicker: vm.raw.siteContent.servicesIntro.kicker,
    title: vm.raw.siteContent.servicesIntro.title,
    description: vm.raw.siteContent.servicesIntro.description,
    items: vm.services.slice(0, SERVICES_PREVIEW_LIMIT)
  };

  const packagesPreview: HomePackageItem[] = vm.packages.slice(0, PREVIEW_LIMIT);

  const galleryPreview: HomeGalleryItem[] = vm.gallery.slice(0, PREVIEW_LIMIT);

  const reviewsPreview: HomeReviewItem[] = vm.reviews.slice(0, PREVIEW_LIMIT);

  const fallbackFeaturedMediaCards = [
    {
      id: "live-dj-performance",
      title: "Live DJ Performance",
      category: "Live Performance",
      image: "/images/dj/dj-press-live-performance.jpg",
      alt: "DJ Press performing live behind the DJ booth",
      imagePosition: "center 24%",
      isLogo: false
    },
    {
      id: "brand-identity-card",
      title: "Branded Booth Identity",
      category: "Brand Presence",
      image: "/images/branding/dj-press-logo-press.png",
      alt: "DJ Press International logo mark",
      isLogo: true
    }
  ];

  const hasSavedGalleryItems = vm.raw.siteContent.gallery.length > 0;

  const featuredExperience: HomeFeaturedExperienceData = {
    kicker: vm.raw.siteContent.homepageFeatured.kicker || "Featured Experience",
    title: vm.raw.siteContent.homepageFeatured.title || "Why Events Feel Different with DJ Press",
    description:
      vm.raw.siteContent.homepageFeatured.description ||
      "Elevated direction, polished pacing, and premium production consistency across event segments.",
    pillars: featuredExperiencePillars,
    mediaCards: hasSavedGalleryItems
      ? vm.gallery.slice(0, 2).map((item) => ({
          id: item.id,
          title: item.title,
          category: item.category,
          image: item.type === "video" ? "/images/branding/dj-press-logo-press.png" : item.image,
          alt: item.alt,
          imagePosition: "center 24%",
          isLogo: false
        }))
      : fallbackFeaturedMediaCards
  };

  const trust: HomeTrustData = {
    kicker: vm.raw.siteContent.homepageTrust.kicker || "Trust & Performance",
    title: vm.raw.siteContent.homepageTrust.title || "Why Book DJ Press International",
    description:
      vm.raw.siteContent.homepageTrust.description ||
      "Professional communication, reliable execution, and high-energy event flow designed for mixed audiences."
  };

  const bookingCta: HomeBookingCtaData = {
    enabled: vm.raw.bookingSettings.enabled,
    notice: vm.raw.bookingSettings.notice,
    phone: vm.raw.siteContact.phone,
    phoneHref: vm.raw.siteContact.phoneHref,
    email: vm.raw.siteContact.email,
    serviceArea: vm.raw.siteContact.serviceArea,
    primaryCtaLabel: vm.raw.siteSettings.primaryCtaLabel
  };

  return {
    hero,
    featuredExperience,
    trust,
    servicesPreview,
    packagesPreview,
    galleryPreview,
    reviewsPreview,
    bookingCta,
    raw: vm.raw
  };
}
