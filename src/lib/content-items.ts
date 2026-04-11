import { galleryItems as fallbackGalleryItems, serviceTypes as fallbackServiceTypes, testimonials as fallbackTestimonials } from "../data/catalog";
import { packageTiers as fallbackPackageTiers } from "../data/packages";
import { getManagedImageUrl } from "./media";
import { SiteContent } from "../types/site-content";

interface ServiceDisplayItem {
  id: string;
  title: string;
  description: string;
  image?: string;
}

interface PackageDisplayItem {
  id: string;
  name: string;
  startingAt: string;
  bestFor: string;
  duration: string;
  summary: string;
  includes: string[];
  featured?: boolean;
  featureLabel?: string;
  ctaLabel: string;
  highlights?: string[];
  image?: string;
}

interface GalleryDisplayItem {
  id: string;
  title: string;
  category: string;
  caption: string;
  image: string;
  alt: string;
  type: "image" | "video";
  url: string;
}

interface ReviewDisplayItem {
  id: string;
  eventType: string;
  trustLabel: string;
  tags: string[];
  featured?: boolean;
  quote: string;
  rating: number;
}

const defaultAboutStats = [
  { id: "stat-response", label: "Response Target", value: "24 Hours" },
  { id: "stat-event-types", label: "Event Formats", value: "12+" },
  { id: "stat-focus", label: "Service Focus", value: "Premium Execution" }
];

export function getServiceItems(content: SiteContent): ServiceDisplayItem[] {
  if (content.services.length === 0) {
    return fallbackServiceTypes.map((item, index) => ({
      id: `fallback-service-${index + 1}`,
      title: item.title,
      description: item.description,
      image: item.image
    }));
  }

  return [...content.services]
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      image: getManagedImageUrl(item.imageAsset, item.image, "") || undefined
    }));
}

export function getPackageItems(content: SiteContent): PackageDisplayItem[] {
  if (content.packages.length === 0) {
    return fallbackPackageTiers;
  }

  return [...content.packages]
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      id: item.id,
      name: item.name,
      startingAt: item.price,
      bestFor: item.features[0] || "Signature events",
      duration: "Custom timeline",
      summary: item.features.length > 0 ? item.features.join(" • ") : "Custom package details available on request.",
      includes: item.features,
      featured: item.highlight,
      featureLabel: item.highlight ? "Featured" : undefined,
      ctaLabel: `Book ${item.name}`,
      highlights: item.highlight ? ["Featured package"] : [],
      image: getManagedImageUrl(item.imageAsset, undefined, "") || undefined
    }));
}

export function getGalleryItems(content: SiteContent): GalleryDisplayItem[] {
  if (content.gallery.length === 0) {
    return fallbackGalleryItems.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      caption: item.caption,
      image: item.image,
      alt: item.alt,
      type: "image",
      url: item.image
    }));
  }

  return [...content.gallery]
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({
      id: item.id,
      title: item.title || item.caption || `${item.type === "video" ? "Video" : "Image"} ${index + 1}`,
      category: item.type === "video" ? "Video" : "Gallery",
      caption: item.caption || "",
      image: item.type === "image"
        ? getManagedImageUrl(item.imageAsset, item.url, "/images/branding/dj-press-logo-press.png")
        : "/images/branding/dj-press-logo-press.png",
      alt: item.alt || item.title || item.caption || `${item.type} content item`,
      type: item.type,
      url: item.type === "image"
        ? getManagedImageUrl(item.imageAsset, item.url, "/images/branding/dj-press-logo-press.png")
        : item.url
    }));
}

export function getReviewItems(content: SiteContent): ReviewDisplayItem[] {
  const approved = content.reviews.filter((item) => item.approved);
  if (approved.length === 0) {
    return fallbackTestimonials;
  }

  return approved.map((item, index) => ({
    id: item.id,
    eventType: item.name,
    trustLabel: "Approved client review",
    tags: ["Approved", "Live feedback"],
    featured: index === 0,
    quote: item.text,
    rating: item.rating
  }));
}

export function getAboutStats(content: SiteContent) {
  if (content.aboutStats.length === 0) {
    return defaultAboutStats;
  }

  return content.aboutStats.map((item) => ({
    id: item.id,
    label: item.label,
    value: item.value
  }));
}
