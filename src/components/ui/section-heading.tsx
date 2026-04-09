interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

export function SectionHeading({ title, subtitle, badge }: SectionHeadingProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold text-white md:text-4xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-3xl text-slate-300">{subtitle}</p> : null}
      </div>
      {badge ? <span className="rounded-full border border-luxeBlue/40 bg-luxeBlue/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-luxeBlue">{badge}</span> : null}
    </div>
  );
}
