import { ExperiencePillar, HeroTrustItem, SiteContactInfo } from "../types/catalog";

export const siteContact: SiteContactInfo = {
  email: "Djpressbookings@gmail.com",
  phone: "+1 (843) 312-9965",
  phoneHref: "tel:+18433129965",
  serviceArea: "Charleston, SC and surrounding areas",
  responseWindow: "Typically within 24 hours",
  bookingCta: {
    title: "Ready to Lock In Your Date?",
    description:
      "Submit your event details for a guided package recommendation, timeline planning support, and rapid availability confirmation.",
    badge: "Premium response target within 24 hours"
  }
};

export const heroTrustItems: HeroTrustItem[] = [
  { title: "Charleston area service", detail: "Venue-ready local coverage" },
  { title: "Fast response", detail: "Booking team replies quickly" },
  { title: "Weddings to nightlife", detail: "Private, corporate, and club formats" },
  { title: "Premium execution", detail: "Disciplined event flow + polish" }
];

export const featuredExperiencePillars: ExperiencePillar[] = [
  { title: "Disciplined Event Flow", description: "Structured transitions from cocktail to peak dance moments." },
  { title: "Premium Sound Presence", description: "Venue-calibrated audio that feels powerful without fatigue." },
  { title: "Crowd Reading", description: "Real-time set control based on room response and energy pacing." },
  { title: "Timeline Control", description: "Critical moments land on-time with clear segment management." },
  { title: "Clean Edits Available", description: "Family-safe and brand-safe versions are handled smoothly." },
  { title: "Custom Event Energy", description: "Each event gets a unique momentum profile, not a generic playlist." }
];
