import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { serviceTypes } from "../../data/catalog";

export const metadata: Metadata = {
  title: "Services and Event Types",
  description: "Explore premium DJ services for weddings, clubs, corporate events, private parties, and more."
};

export default function ServicesPage() {
  return (
    <main className="section-shell">
      <div className="container-width">
        <p className="section-kicker">Event Services</p>
        <h1 className="text-3xl font-bold text-white md:text-4xl">Services & Event Types</h1>
        <p className="mt-3 max-w-3xl text-slate-300">Each event receives custom curation, technical planning, and premium execution.</p>
        <div className="service-grid">
          {serviceTypes.map((service, index) => (
            <article className="premium-card" key={service.title}>
              {service.image && index < 4 ? (
                <Image src={service.image} alt={service.title} width={760} height={500} className="service-thumb" />
              ) : null}
              <h2 className="text-xl text-white">{service.title}</h2>
              <p className="mt-2 text-sm text-slate-300">{service.description}</p>
            </article>
          ))}
        </div>

        <div className="cta-rhythm">
          <Link href="/booking" className="btn-primary">Book This Event Type</Link>
          <Link href="/packages" className="btn-secondary">Compare Packages</Link>
        </div>
      </div>
    </main>
  );
}
