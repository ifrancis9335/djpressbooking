import Image from "next/image";
import { Reveal } from "../../../components/ui/reveal";
import type { HomeFeaturedExperienceData } from "../types";

interface HomeFeaturedExperienceSectionProps {
  featuredExperience: HomeFeaturedExperienceData;
}

export function HomeFeaturedExperienceSection({ featuredExperience }: HomeFeaturedExperienceSectionProps) {
  return (
    <section className="section-shell">
      <Reveal className="container-width">
        <p className="section-kicker">{featuredExperience.kicker}</p>
        <h2 className="text-3xl font-bold text-white md:text-4xl">{featuredExperience.title}</h2>
        <p className="mt-3 max-w-3xl text-slate-300">{featuredExperience.description}</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="experience-grid mt-0">
            {featuredExperience.pillars.map((pillar) => (
              <article className="premium-card" key={pillar.title}>
                <h3 className="text-xl text-white">{pillar.title}</h3>
                <p className="mt-2 text-slate-300">{pillar.description}</p>
              </article>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {featuredExperience.mediaCards.map((item) => (
              <figure key={item.id} className={`gallery-shell relative ${item.isLogo ? "booth-brand-shell" : ""}`}>
                <Image
                  src={item.image}
                  alt={item.alt}
                  width={900}
                  height={560}
                  className={item.isLogo ? "booth-brand-image" : "h-[210px] w-full object-cover"}
                  style={item.isLogo ? undefined : { objectPosition: item.imagePosition }}
                />
                {item.isLogo ? (
                  <figcaption className="brand-card-label">{item.title}</figcaption>
                ) : (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#05070f]/95 to-transparent p-3">
                    <p className="text-xs uppercase tracking-wider text-luxeBlue">{item.category}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{item.title}</p>
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
