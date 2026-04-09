import { EventHighlight, ServiceType } from "../types/catalog";

export const serviceTypes: ServiceType[] = [
  { title: "Weddings", description: "Elegant timeline control from ceremony transitions to final dance.", image: "/images/dj/dj-press-live-performance.jpg" },
  { title: "Birthdays", description: "Customized music flow designed around your guest energy.", image: "/images/dj/dj-press-performance-portrait.jpg" },
  { title: "Private Parties", description: "High-impact entertainment with premium crowd control.", image: "/images/dj/dj-press-live-performance.jpg" },
  { title: "Corporate Events", description: "Professional pacing for networking, awards, and celebration blocks.", image: "/images/dj/dj-press-performance-portrait.jpg" },
  { title: "Club / Lounge", description: "Peak-time momentum with polished open-format transitions.", image: "/images/gallery/Glowing DJ button design.png" },
  { title: "Reunions", description: "Era-spanning curation built for mixed-age dance floors.", image: "/images/gallery/DJ Press logo with waveform design2.png" },
  { title: "School Events", description: "Clean edits and age-appropriate programming with confidence.", image: "/images/dj/dj-press-performance-portrait.jpg" },
  { title: "Cookouts / Day Parties", description: "Daytime social energy with rhythmic progression into dance mode.", image: "/images/dj/dj-press-live-performance.jpg" },
  { title: "Holiday Parties", description: "Festive and elevated atmosphere designed for broad audiences.", image: "/images/gallery/Glowing DJ button design.png" },
  { title: "Caribbean / Reggae Events", description: "Authentic island and dancehall-informed set architecture.", image: "/images/dj/dj-press-live-performance.jpg" },
  { title: "Afrobeat Events", description: "Modern Afrobeat and crossover blends with premium energy.", image: "/images/gallery/DJ Press logo with waveform design2.png" },
  { title: "MC / Host Add-on", description: "Professional announcements, transitions, and room management.", image: "/images/gallery/DJ Press International logo desig22.png" }
];

export const eventHighlights: EventHighlight[] = [
  {
    title: "Wedding Signature Flow",
    audience: "Weddings",
    summary: "From ceremony cues to afterparty peak-hour transitions, every segment is intentionally paced.",
    cta: "Build wedding soundtrack",
    image: "/images/dj/dj-press-live-performance.jpg",
    imagePosition: "center 20%",
    imageFit: "cover"
  },
  {
    title: "Private Party Momentum",
    audience: "Private Parties",
    summary: "Music architecture tuned to your guest mix, vibe goals, and social energy shifts.",
    cta: "Plan private event",
    image: "/images/dj/dj-press-performance-portrait.jpg",
    imagePosition: "center 22%",
    imageFit: "cover",
    imageHeight: 300
  },
  {
    title: "Corporate Rhythm Control",
    audience: "Corporate",
    summary: "Professional soundtrack management for networking, speaking blocks, and celebration closeout.",
    cta: "Map corporate timeline",
    image: "/images/gallery/DJ Press International logo desig22.png",
    imageFit: "contain"
  },
  {
    title: "Caribbean / Reggae Nights",
    audience: "Caribbean",
    summary: "Island-forward curation with smooth transitions across reggae, dancehall, and crossover moments.",
    cta: "Design Caribbean night",
    image: "/images/gallery/Glowing DJ button design.png",
    imageFit: "contain"
  },
  {
    title: "Afrobeat / Nightlife Energy",
    audience: "Afrobeat & Clubs",
    summary: "Modern Afrobeat and nightlife sequencing designed for sustained dancefloor pressure.",
    cta: "Shape nightlife energy",
    image: "/images/gallery/DJ Press logo with waveform design2.png",
    imageFit: "contain"
  }
];
