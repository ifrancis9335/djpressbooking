import { AddOnOption, PackageComparisonRow, PackageTier } from "../types/catalog";

export const packageTiers: PackageTier[] = [
  {
    id: "basic",
    name: "Basic",
    startingAt: "$350",
    bestFor: "Intimate celebrations and focused timelines",
    duration: "Up to 4 hours",
    summary: "Clean professional execution with planning support and reliable event flow.",
    includes: [
      "Professional sound system",
      "Pre-event planning call",
      "Custom playlist framework",
      "Timeline-aligned key moment support"
    ],
    highlights: ["Best value starter", "High clarity sound"],
    ctaLabel: "Book Basic"
  },
  {
    id: "premium",
    name: "Premium",
    startingAt: "$500",
    bestFor: "Weddings and milestone private events",
    duration: "Up to 6 hours",
    featureLabel: "Most Requested",
    featured: true,
    summary: "Expanded production, stronger dancefloor atmosphere, and elevated event pacing.",
    includes: [
      "Expanded audio coverage",
      "Lighting enhancement package",
      "Timeline and key-moment mapping",
      "Priority planning support"
    ],
    highlights: ["Featured package", "Most balanced production"],
    ctaLabel: "Book Premium"
  },
  {
    id: "vip",
    name: "Luxury / VIP",
    startingAt: "$1,200",
    bestFor: "High-touch brand and milestone experiences",
    duration: "Up to 8 hours",
    summary: "Premium event direction with VIP planning support and high-impact atmosphere control.",
    includes: [
      "Premium lighting scenes",
      "MC support included",
      "Priority event strategy sessions",
      "Advanced timeline control"
    ],
    highlights: ["Elite production", "Highest planning priority"],
    ctaLabel: "Book VIP"
  }
];

export const packageComparisonRows: PackageComparisonRow[] = [
  { feature: "Performance Coverage", basic: "Up to 4 hours", premium: "Up to 6 hours", vip: "Up to 8 hours" },
  { feature: "Sound Presence", basic: "Professional", premium: "Expanded", vip: "Premium full-room" },
  { feature: "Lighting", basic: "Standard", premium: "Enhanced", vip: "Premium scene design" },
  { feature: "MC Support", basic: "Add-on", premium: "Add-on", vip: "Included" },
  { feature: "Planning Priority", basic: "Standard", premium: "Priority", vip: "VIP priority" },
  { feature: "Best For", basic: "Smaller events", premium: "Milestone events", vip: "Signature experiences" }
];

export const packageAddOns: AddOnOption[] = [
  {
    id: "extra-hour",
    name: "Extra Hour",
    priceHint: "From $175/hr",
    description: "Extend dancefloor momentum when your timeline needs more room."
  },
  {
    id: "mc-hosting",
    name: "MC / Hosting",
    priceHint: "From $250",
    description: "Professional announcements, transitions, and guest-direction support."
  },
  {
    id: "lighting-package",
    name: "Lighting Package",
    priceHint: "From $300",
    description: "Venue atmosphere upgrade with premium dancefloor lighting design."
  },
  {
    id: "playlist-planning",
    name: "Custom Playlist Planning",
    priceHint: "From $150",
    description: "Collaborative curation for must-play, do-not-play, and key moments."
  },
  {
    id: "travel-support",
    name: "Travel Outside Base Area",
    priceHint: "Quote-based",
    description: "Expanded coverage beyond core Charleston service radius."
  },
  {
    id: "ceremony-support",
    name: "Ceremony Support",
    priceHint: "From $275",
    description: "Dedicated ceremony audio and cue support for wedding timelines."
  }
];
