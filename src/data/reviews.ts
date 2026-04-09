import { Testimonial } from "../types/catalog";

export const testimonials: Testimonial[] = [
  {
    id: "wedding-signature",
    eventType: "Wedding Reception",
    trustLabel: "Verified wedding client",
    tags: ["Timeline control", "Packed dancefloor", "Clean transitions"],
    featured: true,
    quote: "Every transition felt intentional, and the dancefloor stayed packed from start to finish.",
    rating: 5
  },
  {
    id: "corporate-celebration",
    eventType: "Corporate Celebration",
    trustLabel: "Verified corporate event",
    tags: ["Professional setup", "Brand-safe flow", "On-time execution"],
    quote: "Professional communication, flawless setup, and a soundtrack that matched each segment.",
    rating: 5
  },
  {
    id: "private-birthday",
    eventType: "Private Birthday Event",
    trustLabel: "Verified private event",
    tags: ["Crowd reading", "Energy control", "Guest satisfaction"],
    quote: "Balanced clean edits with serious energy. Guests were still talking about the music days later.",
    rating: 5
  }
];
