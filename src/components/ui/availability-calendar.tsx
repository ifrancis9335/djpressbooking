"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AvailabilityDate } from "../../types/availability";
import { cn } from "../../utils/cn";

const week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as T | { message?: string } | null;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "message" in payload ? payload.message : undefined;
    throw new Error(message || "Unable to load availability data.");
  }
  return payload as T;
}

export function AvailabilityCalendar() {
  const router = useRouter();
  const [monthDate, setMonthDate] = useState(new Date());
  const [availability, setAvailability] = useState<AvailabilityDate[]>([]);
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshAvailability = useCallback(async () => {
    const month = formatMonthIso(monthDate);
    const availabilityPayload = await fetch(`/api/availability?month=${month}`, { cache: "no-store" }).then((response) =>
      parseResponse<{ availability?: AvailabilityDate[] }>(response)
    );

    setAvailability(availabilityPayload.availability ?? []);
  }, [monthDate]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    refreshAvailability()
      .then(() => {
        if (!active) return;
        setLoadError(null);
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(error instanceof Error ? error.message : "Unable to load calendar data.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshAvailability]);

  const availabilityMap = useMemo(() => {
    const map = new Map<string, AvailabilityDate>();
    availability.forEach((entry) => map.set(entry.date, entry));
    return map;
  }, [availability]);

  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const offset = firstDay.getDay();
  const count = new Date(year, month + 1, 0).getDate();

  const todayIso = formatIsoDate(new Date());
  const cells: Array<{ day?: number; iso?: string; status?: "available" | "blocked"; note?: string; today?: boolean; past?: boolean }> = [];

  for (let i = 0; i < offset; i += 1) cells.push({});
  for (let day = 1; day <= count; day += 1) {
    const date = new Date(year, month, day);
    const iso = formatIsoDate(date);
    const entry = availabilityMap.get(iso);
    const today = new Date();
    const isToday = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
    const status = entry?.status === "blocked" ? "blocked" : "available";
    cells.push({ day, iso, status, note: entry?.note, today: isToday, past: iso < todayIso });
  }

  const onDateClick = (cell: (typeof cells)[number]) => {
    if (!cell.iso) return;
    setSelectedIso(cell.iso);

    if (cell.past) {
      setStatusMessage("Past date");
      return;
    }

    if (cell.status === "available") {
      setStatusMessage("Opening booking form...");
      router.push(`/booking?date=${cell.iso}`);
      return;
    }

    if (cell.status === "blocked") {
      setStatusMessage("Date not available");
    }
  };

  return (
    <div className="glass-panel p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button onClick={() => setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="btn-secondary" type="button">
          Previous
        </button>
        <h3 className="text-xl font-bold text-white">
          {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(monthDate)}
        </h3>
        <button onClick={() => setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="btn-secondary" type="button">
          Next
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {week.map((d) => (
          <div key={d} className="rounded-lg bg-white/5 py-2 text-center text-xs font-bold uppercase tracking-wider text-slate-300">
            {d}
          </div>
        ))}
        {cells.map((cell, idx) => (
          <button
            key={`${cell.iso || "pad"}-${idx}`}
            type="button"
            onClick={() => onDateClick(cell)}
            className={cn(
              "min-h-[62px] rounded-lg border text-center text-sm font-bold transition duration-200",
              !cell.day && "border-transparent bg-transparent",
              cell.today && "ring-1 ring-luxeGold/70",
              selectedIso && cell.iso === selectedIso && "ring-2 ring-luxeBlue",
              cell.status === "available" && !cell.past && "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
              cell.status === "blocked" && "border-slate-500/60 bg-slate-800/75 text-slate-300 line-through",
              cell.past && "border-white/10 bg-slate-900/70 text-slate-500 line-through"
            )}
            title={cell.status === "blocked" ? "Not available" : cell.iso}
            aria-label={cell.iso ? `${cell.iso} ${cell.past ? "past" : cell.status}` : "empty"}
            disabled={!cell.day || Boolean(cell.past) || cell.status === "blocked"}
          >
            <div className="pt-4">{cell.day || ""}</div>
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-400">Only admin-blocked dates are unavailable.</p>

      {loading ? <p className="mt-4 text-sm text-slate-300">Loading calendar...</p> : null}
      {loadError ? <p className="status-bad mt-4">{loadError}</p> : null}
      {!loading && !loadError && availability.length === 0 ? (
        <p className="mt-4 text-sm text-slate-300">No bookings yet. All upcoming dates are currently available.</p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wide text-slate-300">
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" />Available</span>
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-slate-400" />Blocked</span>
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-slate-600" />Past Date</span>
      </div>

      {selectedIso ? (
        <div className="mt-5 rounded-xl border border-white/15 bg-white/5 p-3 text-sm">
          <p className="font-bold text-white">Selected Date: {selectedIso}</p>
          <p className="mt-1 text-slate-300">
            Status: {selectedIso < todayIso ? "past" : availabilityMap.get(selectedIso)?.status === "blocked" ? "blocked" : "available"}
          </p>
          {statusMessage ? <p className="mt-1 text-slate-200">{statusMessage}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
