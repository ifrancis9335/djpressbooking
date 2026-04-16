import { ReactNode } from "react";
import { week } from "./helpers";
import { CalendarCell } from "./types";
import { cn } from "../../../utils/cn";

function formatA11yDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(
    new Date(year, (month || 1) - 1, day || 1)
  );
}

interface BookingCalendarStepProps {
  monthDate: Date;
  setMonthDate: (updater: (prev: Date) => Date) => void;
  calendarCells: CalendarCell[];
  selectedIso: string;
  chooseDate: (cell: CalendarCell) => void;
  monthLoading: boolean;
  monthError: string | null;
  fieldError: ReactNode;
}

export function BookingCalendarStep({
  monthDate,
  setMonthDate,
  calendarCells,
  selectedIso,
  chooseDate,
  monthLoading,
  monthError,
  fieldError
}: BookingCalendarStepProps) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          className="btn-secondary md:w-auto"
          onClick={() => setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
        >
          Previous
        </button>
        <h3 className="text-lg font-bold text-white">
          {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(monthDate)}
        </h3>
        <button
          type="button"
          className="btn-secondary md:w-auto"
          onClick={() => setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
        >
          Next
        </button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {week.map((day) => (
          <div key={day} className="rounded-lg bg-white/5 py-2 text-center text-xs font-bold uppercase tracking-wider text-slate-300">
            {day}
          </div>
        ))}
        {calendarCells.map((cell, index) => {
          const effectiveStatus = cell.status ?? "available";
          const disabled = !cell.day || Boolean(cell.isPast) || effectiveStatus !== "available";
          const selected = cell.iso === selectedIso;

          return (
            <button
              key={`${cell.iso || "pad"}-${index}`}
              type="button"
              disabled={disabled}
              onClick={() => chooseDate(cell)}
              className={cn(
                "min-h-[62px] rounded-lg border text-center text-sm font-bold transition duration-200",
                !cell.day && "border-transparent bg-transparent",
                cell.isToday && "ring-1 ring-luxeGold/70",
                selected && "ring-2 ring-luxeBlue",
                effectiveStatus === "available" && !cell.isPast && "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
                effectiveStatus === "blocked" && !cell.isPast && "border-rose-400/45 bg-rose-500/10 text-rose-50 shadow-[0_0_18px_rgba(248,113,113,0.14)]",
                cell.isPast && "border-white/10 bg-slate-900/70 text-slate-500 line-through"
              )}
              title={cell.iso || ""}
              aria-label={cell.iso ? `${formatA11yDate(cell.iso)} ${cell.isPast ? "past date" : effectiveStatus === "blocked" ? "unavailable" : "available"}` : "empty"}
            >
              <div className="flex h-full flex-col items-center justify-center gap-1 py-2">
                <span>{cell.day || ""}</span>
                {effectiveStatus === "blocked" && !cell.isPast ? (
                  <span aria-hidden="true" className="mt-1 h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(248,113,113,0.65)]" />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
      {monthLoading ? <p className="mt-3 text-sm text-slate-300">Loading month availability...</p> : null}
      {monthError ? <p className="status-bad mt-3">{monthError}</p> : null}
      {fieldError}
    </>
  );
}
