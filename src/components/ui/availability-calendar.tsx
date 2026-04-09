"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { AvailabilityDate } from "../../types/availability";
import { cn } from "../../utils/cn";
import { firebaseDb, isFirebaseClientConfigured } from "../../lib/firebase/client";

const week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface FirestoreBookingDate {
  date: string;
  status: AvailabilityDate["status"];
  note?: string;
  bookingId?: string;
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function AvailabilityCalendar() {
  const router = useRouter();
  const [monthDate, setMonthDate] = useState(new Date());
  const [availability, setAvailability] = useState<AvailabilityDate[]>([]);
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseClientConfigured || !firebaseDb) {
      setLoadError("Calendar is not configured yet. Please set Firebase environment variables.");
      setLoading(false);
      return;
    }

    const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
    const start = formatIsoDate(firstDay);
    const end = formatIsoDate(lastDay);

    setLoading(true);

    const bookingsQuery = query(
      collection(firebaseDb, "availability"),
      where("date", ">=", start),
      where("date", "<=", end),
      orderBy("date", "asc")
    );
    const unsubscribe = onSnapshot(
      bookingsQuery,
      (snapshot) => {
        const next = snapshot.docs
          .map((doc) => doc.data() as FirestoreBookingDate)
          .filter((entry) => Boolean(entry.date) && Boolean(entry.status))
          .map((entry) => ({
            date: entry.date,
            status: entry.status,
            note: entry.note
          }));

        setAvailability(next);
        setLoadError(null);
        setLoading(false);
      },
      () => {
        setLoadError("Unable to load calendar data.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [monthDate]);

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

  const cells: Array<{ day?: number; iso?: string; status?: AvailabilityDate["status"]; note?: string; today?: boolean }> = [];

  for (let i = 0; i < offset; i += 1) cells.push({});
  for (let day = 1; day <= count; day += 1) {
    const date = new Date(year, month, day);
    const iso = formatIsoDate(date);
    const entry = availabilityMap.get(iso);
    const today = new Date();
    const isToday = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
    cells.push({ day, iso, status: entry?.status ?? "available", note: entry?.note, today: isToday });
  }

  const onDateClick = (cell: (typeof cells)[number]) => {
    if (!cell.iso) return;
    setSelectedIso(cell.iso);

    if (cell.status === "available") {
      setStatusMessage("Opening booking form...");
      router.push(`/booking?date=${cell.iso}`);
      return;
    }

    if (cell.status === "pending") {
      setStatusMessage("Awaiting confirmation");
      return;
    }

    if (cell.status === "booked" || cell.status === "blocked") {
      setStatusMessage("Unavailable");
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
              cell.status === "available" && "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
              cell.status === "pending" && "border-amber-300/40 bg-amber-500/10 text-amber-100",
              cell.status === "booked" && "border-rose-400/40 bg-rose-500/10 text-rose-100",
              cell.status === "blocked" && "border-slate-500/40 bg-slate-700/30 text-slate-300"
            )}
            title={cell.note || cell.iso}
            aria-label={cell.iso ? `${cell.iso} ${cell.status}` : "empty"}
            disabled={!cell.day}
          >
            <div className="pt-4">{cell.day || ""}</div>
          </button>
        ))}
      </div>

      {loading ? <p className="mt-4 text-sm text-slate-300">Loading calendar...</p> : null}
      {loadError ? <p className="status-bad mt-4">{loadError}</p> : null}
      {!loading && !loadError && availability.length === 0 ? (
        <p className="mt-4 text-sm text-slate-300">No bookings yet. All upcoming dates are currently available.</p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wide text-slate-300">
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" />Available</span>
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-amber-300" />Pending</span>
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-rose-400" />Booked</span>
        <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-slate-400" />Blocked</span>
      </div>

      {selectedIso ? (
        <div className="mt-5 rounded-xl border border-white/15 bg-white/5 p-3 text-sm">
          <p className="font-bold text-white">Selected Date: {selectedIso}</p>
          <p className="mt-1 text-slate-300">
            Status: {availabilityMap.get(selectedIso)?.status ?? "available"}
            {availabilityMap.get(selectedIso)?.note ? ` - ${availabilityMap.get(selectedIso)?.note}` : ""}
          </p>
          {statusMessage ? <p className="mt-1 text-slate-200">{statusMessage}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
