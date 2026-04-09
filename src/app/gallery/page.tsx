import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { galleryItems } from "../../data/catalog";

export const metadata: Metadata = {
  title: "Gallery Experience",
  description: "Visual highlights from wedding, club, private, Caribbean, and Afrobeat events."
};

export default function GalleryPage() {
  const categories = Array.from(new Set(galleryItems.map((item) => item.category)));
  const featured = galleryItems.slice(0, 2);
  const supporting = galleryItems.slice(2);

  return (
    <main className="section-shell">
      <div className="container-width">
        <p className="section-kicker">Visual Showcase</p>
        <h1 className="text-3xl font-bold text-white md:text-4xl">Gallery Experience</h1>
        <p className="mt-3 max-w-3xl text-slate-300">A premium visual snapshot of sound, lighting, and crowd energy across event styles.</p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="gallery-filter-chip">All</span>
          {categories.map((category) => (
            <span key={category} className="gallery-filter-chip">
              {category}
            </span>
          ))}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {featured.map((item) => (
            <figure key={item.id} className="gallery-shell relative gallery-featured-shell">
              <Image src={item.image} alt={item.alt} width={1100} height={760} className="gallery-featured-image" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#05070f]/96 to-transparent p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-luxeBlue">{item.category}</p>
                <p className="mt-1 text-lg font-semibold text-white">{item.title}</p>
                <p className="mt-1 text-sm text-slate-300">{item.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {supporting.map((item) => (
            <figure key={item.id} className="gallery-shell relative">
              <Image src={item.image} alt={item.alt} width={920} height={680} className="h-[220px] w-full object-cover" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#05070f]/95 to-transparent p-3">
                <p className="text-[10px] uppercase tracking-wider text-luxeBlue">{item.category}</p>
                <p className="mt-1 text-sm font-semibold text-white">{item.title}</p>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="cta-rhythm">
          <Link href="/booking" className="btn-primary">Book This Experience</Link>
          <Link href="/contact" className="btn-secondary">Discuss Event Vision</Link>
        </div>
      </div>
    </main>
  );
}
