"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminNavItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/chat-monitor", label: "Chat Monitor" },
  { href: "/admin/trash", label: "Trash" },
  { href: "/admin/blocked-dates", label: "Blocked Dates" },
  { href: "/admin/packages", label: "Packages Manager" },
  { href: "/admin/gallery", label: "Gallery Manager" },
  { href: "/admin/reviews", label: "Reviews Manager" },
  { href: "/admin/site-settings", label: "Site Settings" }
];

export function AdminWorkspaceNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin workspace navigation" className="mt-4 grid gap-2">
      {adminNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${pathname === item.href ? "border-luxeGold/60 bg-luxeGold/15 text-white shadow-[0_0_0_1px_rgba(244,194,80,0.2)]" : "border-white/12 bg-white/5 text-slate-200 hover:border-luxeGold/45 hover:bg-luxeGold/10 hover:text-white"}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
