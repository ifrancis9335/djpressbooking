import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { galleryItems, testimonials } from "../../data/catalog";

export const metadata: Metadata = {
  title: "Client Reviews",
  description: "Read verified event feedback on professionalism, reliability, and crowd impact."
};

export default function ReviewsPage() {
  const featured = testimonials.find((item) => item.featured) ?? testimonials[0];
  const reviewBannerImage = galleryItems.find((item) => item.id === "alternate-dj-angle") ?? galleryItems[1] ?? galleryItems[0];

  return (
    <main className="section-shell">
      <div className="container-width">
        <p className="section-kicker">Client Confidence</p>
        <h1 className="text-3xl font-bold text-white md:text-4xl">Client Reviews</h1>
        <p className="mt-3 max-w-3xl text-slate-300">High-trust feedback from weddings, private events, and corporate experiences.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-200">Verified inquiries</span>
          <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-200">5-star service focus</span>
          <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-200">Charleston area events</span>
        </div>

        <article className="luxury-stack mt-6">
          <figure className="gallery-shell relative mb-4">
            <Image
              src={reviewBannerImage.image}
              alt={reviewBannerImage.alt}
              width={1100}
              height={620}
              className="h-[230px] w-full object-cover md:h-[280px]"
              style={{ objectPosition: "center 20%" }}
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#05070f]/95 to-transparent p-3 text-xs font-semibold uppercase tracking-wider text-white">
              Verified Live Event Performance
            </figcaption>
          </figure>
          <p className="text-xs font-extrabold uppercase tracking-wider text-luxeGold">Featured Client Quote</p>
          <h2 className="mt-2 text-2xl text-white">{featured.eventType}</h2>
          <p className="mt-2 text-sm text-slate-300">&ldquo;{featured.quote}&rdquo;</p>
          <p className="mt-2 text-xs uppercase tracking-wider text-slate-400">{featured.trustLabel}</p>
        </article>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {testimonials.map((review) => (
            <article className="quote-card" key={review.id}>
              <p className="text-luxeGold">{"★".repeat(review.rating)}</p>
              <h2 className="mt-2 text-xl text-white">{review.eventType}</h2>
              <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">{review.trustLabel}</p>
              <p className="mt-3 text-sm text-slate-300">&ldquo;{review.quote}&rdquo;</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {review.tags.map((tag) => (
                  <span className="review-tag" key={tag}>{tag}</span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="cta-rhythm luxury-stack">
          <div>
            <p className="section-kicker">Book With Confidence</p>
            <p className="mt-2 text-sm text-slate-300">Ready to create your own 5-star event outcome? Start your booking plan now.</p>
          </div>
          <Link href="/booking" className="btn-primary">Start Your Booking</Link>
          <Link href="/packages" className="btn-secondary">See Package Options</Link>
        </div>
      </div>
    </main>
  );
}
