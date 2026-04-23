import Link from "next/link";
import { Reveal } from "../../../components/ui/reveal";
import type { HomeServicesPreviewData } from "../types";

interface HomeServicesSectionProps {
  services: HomeServicesPreviewData;
}

export function HomeServicesSection({ services }: HomeServicesSectionProps) {
  return (
    <section className="section-shell">
      <Reveal className="container-width">
        <p className="section-kicker">{services.kicker}</p>
        <h2 className="text-3xl font-bold text-white">{services.title}</h2>
        <p className="mt-3 max-w-3xl text-slate-300">{services.description}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {services.items.map((service, i) => (
            <article key={service.id} className="premium-card relative">
              <span className="home-service-index">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-lg font-extrabold text-white">{service.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{service.description}</p>
            </article>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link href="/services" className="btn-secondary">View All Services</Link>
          <Link href="/booking" className="btn-primary">Book Your Event</Link>
        </div>
      </Reveal>
    </section>
  );
}
