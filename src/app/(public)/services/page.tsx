import Link from "next/link";
import { Metadata } from "next";
import { FallbackImage } from "../../../components/ui/fallback-image";
import { getPublicSiteData } from "../../../lib/site-settings";
import { getServiceItems } from "../../../lib/content-items";

export const metadata: Metadata = {
  title: "Services and Event Types",
  description: "Explore premium DJ services for weddings, clubs, corporate events, private parties, and more."
};

export default async function ServicesPage() {
  const { siteContent } = await getPublicSiteData();
  const serviceItems = getServiceItems(siteContent);

  return (
    <div className="page-container">
      <div className="container-width">
        <p className="section-kicker">{siteContent.servicesIntro.kicker}</p>
        <h1 className="text-3xl font-bold text-white md:text-4xl">{siteContent.servicesIntro.title}</h1>
        <p className="mt-3 max-w-3xl text-slate-300">{siteContent.servicesIntro.description}</p>
        <div className="service-grid">
          {serviceItems.map((service, index) => (
            <article className="premium-card" key={service.title}>
              {service.image && index < 4 ? (
                <FallbackImage
                  src={service.image}
                  fallbackSrc="/images/dj/dj-press-live-performance.jpg"
                  alt={service.title}
                  width={760}
                  height={500}
                  className="service-thumb"
                />
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
    </div>
  );
}
