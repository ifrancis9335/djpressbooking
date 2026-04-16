import { useEffect, useMemo, useState } from "react";
import { parseJson } from "../../../utils/api";
import { toIsoDateLocal, toMonthIso } from "./helpers";
import { AvailabilityEntry, CalendarCell } from "./types";

interface UseBookingAvailabilityArgs {
  monthDate: Date;
  selectedIso: string;
  setStep: (next: 1 | 2 | 3 | 4) => void;
  setSelectedIso: (value: string) => void;
  setFormEventDate: (value: string) => void;
  setEventDateError: (value: string) => void;
  setStatus: (next: { kind: "ok" | "bad"; text: string } | null) => void;
  debugInfo: (...args: unknown[]) => void;
  debugError: (...args: unknown[]) => void;
}

export function useBookingAvailability({
  monthDate,
  selectedIso,
  setStep,
  setSelectedIso,
  setFormEventDate,
  setEventDateError,
  setStatus,
  debugInfo,
  debugError
}: UseBookingAvailabilityArgs) {
  const [availabilityChecking, setAvailabilityChecking] = useState(false);
  const [dateStatus, setDateStatus] = useState<{ status: AvailabilityEntry["status"]; note?: string } | null>(null);
  const [monthAvailability, setMonthAvailability] = useState<AvailabilityEntry[]>([]);
  const [monthLoading, setMonthLoading] = useState(false);
  const [monthError, setMonthError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    setMonthLoading(true);
    setMonthError(null);
    const monthIso = toMonthIso(monthDate);
    fetch(`/api/availability?month=${monthIso}&t=${Date.now()}`, { cache: "no-store" })
      .then((response) => parseJson<{ availability?: AvailabilityEntry[] }>(response))
      .then((payload) => {
        if (!active) return;
        setMonthAvailability(payload.availability ?? []);
      })
      .catch((error) => {
        if (!active) return;
        setMonthError(error instanceof Error ? error.message : "Unable to load calendar");
        setMonthAvailability([]);
      })
      .finally(() => {
        if (!active) return;
        setMonthLoading(false);
      });

    return () => {
      active = false;
    };
  }, [monthDate]);

  useEffect(() => {
    let active = true;

    if (!selectedIso) {
      setDateStatus(null);
      return;
    }

    setStep(2);
    setAvailabilityChecking(true);
    debugInfo("[booking-flow] availability check request", { date: selectedIso });
    fetch(`/api/availability?date=${encodeURIComponent(selectedIso)}&t=${Date.now()}`, { cache: "no-store" })
      .then((response) => parseJson<{ status?: AvailabilityEntry["status"]; blockedDate?: { note?: string | null } }>(response))
      .then((payload) => {
        if (!active) return;
        const statusValue = payload.status ?? "available";
        const note = payload.blockedDate?.note ?? undefined;
        setDateStatus({ status: statusValue, note: note || undefined });
        debugInfo("[booking-flow] availability check response", { date: selectedIso, status: statusValue });

        if (statusValue === "available") {
          setFormEventDate(selectedIso);
          setEventDateError("");
          setStep(3);
          setStatus({ kind: "ok", text: "Date is available. Complete the short inquiry form." });
          return;
        }

        setFormEventDate("");
        setEventDateError("Date not available");
        setStep(1);
        setStatus({ kind: "bad", text: note ? `Date not available: ${note}` : "Date not available. Please select another date." });
      })
      .catch((error) => {
        if (!active) return;
        debugError("[booking-flow] availability check failed", error);
        setDateStatus(null);
        setStep(1);
        setStatus({ kind: "bad", text: "Unable to verify availability right now." });
      })
      .finally(() => {
        if (!active) return;
        setAvailabilityChecking(false);
      });

    return () => {
      active = false;
    };
  }, [debugError, debugInfo, selectedIso, setEventDateError, setFormEventDate, setStatus, setStep]);

  const availabilityMap = useMemo(() => {
    const map = new Map<string, AvailabilityEntry>();
    monthAvailability.forEach((entry) => {
      map.set(entry.date, entry);
    });
    return map;
  }, [monthAvailability]);

  const todayIso = useMemo(() => toIsoDateLocal(new Date()), []);

  const calendarCells = useMemo(() => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const offset = firstDay.getDay();
    const count = new Date(year, month + 1, 0).getDate();
    const cells: CalendarCell[] = [];

    for (let i = 0; i < offset; i += 1) {
      cells.push({});
    }

    const today = new Date();
    for (let day = 1; day <= count; day += 1) {
      const date = new Date(year, month, day);
      const iso = toIsoDateLocal(date);
      const status = availabilityMap.get(iso)?.status ?? "available";
      const note = availabilityMap.get(iso)?.note;
      const isToday =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();

      cells.push({
        day,
        iso,
        status,
        note,
        isToday,
        isPast: iso < todayIso
      });
    }

    return cells;
  }, [availabilityMap, monthDate, todayIso]);

  const chooseDate = (cell: CalendarCell) => {
    if (!cell.iso || !cell.day) return;

    const effectiveStatus = cell.status ?? "available";
    if (cell.isPast || effectiveStatus !== "available") {
      setStatus({ kind: "bad", text: "Date not available. Please pick a green available date." });
      return;
    }

    setStatus(null);
    setSelectedIso(cell.iso);
  };

  return {
    availabilityChecking,
    dateStatus,
    monthLoading,
    monthError,
    calendarCells,
    chooseDate
  };
}
