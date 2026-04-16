interface BookingSummarySidebarProps {
  sitePhone: string;
  sitePhoneHref: string;
  summaryRows: Array<{ label: string; value: string }>;
}

export function BookingSummarySidebar({ sitePhone, sitePhoneHref, summaryRows }: BookingSummarySidebarProps) {
  return (
    <aside className="glass-panel h-fit p-5 md:sticky md:top-24">
      <h3 className="text-lg font-bold text-white">Booking Summary</h3>
      <p className="mt-1 text-sm text-slate-300">Live snapshot of your inquiry details.</p>
      <p className="mt-2 text-sm text-slate-300">
        Need quick help? <a className="font-semibold text-luxeGold" href={sitePhoneHref}>{sitePhone}</a>
      </p>
      {summaryRows.length > 0 ? (
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
          {summaryRows.map((row) => (
            <div key={row.label} className="contents">
              <dt className="text-slate-400">{row.label}</dt>
              <dd className="text-slate-100">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300">
          Your summary will appear here once you pick a date and begin the inquiry.
        </p>
      )}
    </aside>
  );
}
