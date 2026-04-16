import { week } from "./utils";
import { BlockedDateEntry } from "./types";

interface CalendarCell {
  day?: number;
  iso?: string;
  blocked?: boolean;
}

interface BlockedDatesManagerProps {
  blockedDates: BlockedDateEntry[];
  blockedLoading: boolean;
  blockedMessage: string | null;
  blockedError: string | null;
  calendarMonth: Date;
  setCalendarMonth: (updater: (prev: Date) => Date) => void;
  calendarCells: CalendarCell[];
  newBlockedDate: string;
  setNewBlockedDate: (value: string) => void;
  newBlockedNote: string;
  setNewBlockedNote: (value: string) => void;
  addBlockedDate: () => void;
  removeBlockedDate: (date: string) => void;
  toggleCalendarDate: (iso: string, blocked: boolean) => Promise<void>;
}

export function BlockedDatesManager({
  blockedDates,
  blockedLoading,
  blockedMessage,
  blockedError,
  calendarMonth,
  setCalendarMonth,
  calendarCells,
  newBlockedDate,
  setNewBlockedDate,
  newBlockedNote,
  setNewBlockedNote,
  addBlockedDate,
  removeBlockedDate,
  toggleCalendarDate
}: BlockedDatesManagerProps) {
  return (
    <section id="blocked-dates" className="glass-panel p-5 md:p-6">
      <h3 className="text-xl font-bold text-white">Blocked Dates Manager</h3>
      <p className="mt-1 text-sm text-slate-300">Manage live blocked dates stored in Firestore.</p>
      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 md:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            className="btn-secondary md:w-auto"
            onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
          >
            Previous
          </button>
          <h4 className="text-base font-bold text-white">
            {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(calendarMonth)}
          </h4>
          <button
            type="button"
            className="btn-secondary md:w-auto"
            onClick={() => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
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
          {calendarCells.map((cell, index) => (
            <button
              key={`${cell.iso || "pad"}-${index}`}
              type="button"
              disabled={!cell.iso || blockedLoading}
              onClick={() => {
                if (!cell.iso) return;
                void toggleCalendarDate(cell.iso, Boolean(cell.blocked));
              }}
              className={`min-h-[58px] rounded-lg border text-center text-sm font-semibold transition ${!cell.day ? "border-transparent bg-transparent" : cell.blocked ? "border-rose-400/50 bg-rose-500/20 text-rose-100" : "border-emerald-400/50 bg-emerald-500/15 text-emerald-100"}`}
              title={cell.iso ? `${cell.iso} (${cell.blocked ? "blocked" : "available"})` : ""}
            >
              {cell.day ? (
                <span className="flex h-full flex-col items-center justify-center gap-1 py-2">
                  <span>{cell.day}</span>
                  {cell.blocked ? <span className="rounded-full bg-rose-500/30 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-rose-50">Blocked</span> : null}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-slate-300">Click a date to toggle block/unblock instantly.</p>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-[260px_1fr_auto]">
        <input type="date" className="field-input" value={newBlockedDate} onChange={(event) => setNewBlockedDate(event.target.value)} />
        <input
          type="text"
          className="field-input"
          value={newBlockedNote}
          onChange={(event) => setNewBlockedNote(event.target.value)}
          placeholder="Optional note"
          maxLength={160}
        />
        <button type="button" className="btn-primary md:w-auto" onClick={addBlockedDate} disabled={blockedLoading}>
          {blockedLoading ? "Saving..." : "Add Blocked Date"}
        </button>
      </div>
      <div className="mt-4 grid gap-2">
        {blockedDates.length === 0 ? <p className="text-sm text-slate-400">No blocked dates configured.</p> : null}
        {blockedDates.map((blocked) => (
          <div key={blocked.id} className="flex flex-col gap-2 rounded-xl border border-slate-500/35 bg-slate-800/40 p-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-100">{blocked.eventDate}</p>
              <p className="text-xs text-slate-400">{blocked.note || "No note"}</p>
            </div>
            <button
              type="button"
              className="btn-secondary md:w-auto"
              onClick={() => removeBlockedDate(blocked.eventDate)}
              disabled={blockedLoading}
            >
              {blockedLoading ? "Saving..." : "Mark Available"}
            </button>
          </div>
        ))}
      </div>
      {blockedMessage ? <p className="status-ok mt-3">{blockedMessage}</p> : null}
      {blockedError ? <p className="status-bad mt-3">{blockedError}</p> : null}
    </section>
  );
}
