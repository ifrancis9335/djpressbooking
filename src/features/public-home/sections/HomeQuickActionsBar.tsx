import Link from "next/link";

const QUICK_ACTIONS = [
  { label: "Book Now", href: "/booking", primary: true },
  { label: "Services", href: "/services", primary: false },
  { label: "Packages", href: "/packages", primary: false },
  { label: "Gallery", href: "/gallery", primary: false },
  { label: "Contact", href: "/contact", primary: false }
] as const;

export function HomeQuickActionsBar() {
  return (
    <nav aria-label="Quick navigation" className="border-y border-white/8 bg-slate-950/60 backdrop-blur-sm">
      <div className="container-width flex items-center gap-2 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="mr-1 flex-shrink-0 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
          Quick:
        </span>
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={action.primary ? "home-quick-action-primary" : "home-quick-action"}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
