import { Reveal } from "../../../components/ui/reveal";
import type { HomeTrustData } from "../types";

interface HomeTrustSectionProps {
  trust: HomeTrustData;
}

export function HomeTrustSection({ trust }: HomeTrustSectionProps) {
  return (
    <section className="section-shell">
      <Reveal className="container-width">
        <p className="section-kicker">{trust.kicker}</p>
        <h2 className="text-3xl font-bold text-white md:text-4xl">{trust.title}</h2>
        <p className="mt-3 max-w-3xl text-slate-300">{trust.description}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <article className="premium-card border-t-2 border-t-luxeBlue/70">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-luxeBlue/80">Performance</p>
            <h3 className="text-xl font-extrabold text-white">Energy + Control</h3>
            <p className="mt-2 text-slate-300">Dynamic crowd engagement without sacrificing timeline precision.</p>
          </article>
          <article className="premium-card border-t-2 border-t-violet-400/70">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-violet-400/80">Music</p>
            <h3 className="text-xl font-extrabold text-white">Genre Versatility</h3>
            <p className="mt-2 text-slate-300">Hip-Hop, R&B, Afrobeat, Reggae, Classics, and event-specific blends.</p>
          </article>
          <article className="premium-card border-t-2 border-t-luxeGold/70">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-widest text-luxeGold/80">Process</p>
            <h3 className="text-xl font-extrabold text-white">Booking Confidence</h3>
            <p className="mt-2 text-slate-300">Strong process from inquiry to confirmation with premium communication.</p>
          </article>
        </div>
      </Reveal>
    </section>
  );
}
