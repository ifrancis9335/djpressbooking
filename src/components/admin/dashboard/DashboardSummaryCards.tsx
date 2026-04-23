"use client";

import { useRouter } from "next/navigation";
import { DashboardSummary } from "./types";

interface DashboardSummaryCardsProps {
  summary: DashboardSummary | null;
}

export function DashboardSummaryCards({ summary }: DashboardSummaryCardsProps) {
  const router = useRouter();

  const cards = [
    {
      label: "Total Bookings",
      value: summary?.totalBookings ?? "-",
      onClick: () => router.push("/admin/bookings")
    },
    {
      label: "Needs Response",
      value: summary?.bookingsAwaitingResponse ?? "-",
      onClick: () => router.push("/admin/bookings")
    },
    {
      label: "Upcoming Confirmed",
      value: summary?.upcomingConfirmedBookings ?? "-",
      onClick: () => router.push("/admin/bookings")
    },
    {
      label: "Audit Activity",
      value: summary?.recentActivityCount ?? "-",
      onClick: () => router.push("/admin/site-settings")
    },
    {
      label: "Blocked Dates",
      value: summary?.totalBlockedDates ?? "-",
      onClick: () => router.push("/admin/blocked-dates")
    },
    {
      label: "Next Blocked Date",
      value: summary?.nextBlockedDate || "None",
      isClickable: false
    },
    {
      label: "Public Phone",
      value: summary?.publicPhoneNumber || "-",
      isClickable: false
    },
    {
      label: "Public Email",
      value: summary?.publicEmail || "-",
      isClickable: false
    },
    {
      label: "Booking Status",
      value: summary?.bookingEnabled ? "Enabled" : "Disabled",
      isClickable: false
    }
  ];

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article
          key={card.label}
          onClick={card.onClick}
          className={`premium-card p-4 ${
            card.onClick ? "cursor-pointer transition-all hover:shadow-lg hover:shadow-amber-500/20" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-wider text-slate-400">{card.label}</p>
          <p className="mt-2 text-xl font-bold text-white">{card.value}</p>
        </article>
      ))}
    </div>
  );
}

