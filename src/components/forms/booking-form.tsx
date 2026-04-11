"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { BookingRequest } from "../../types/booking";
import { parseJson } from "../../utils/api";
import { PublicSiteData } from "../../types/site-settings";
import { usePublicSiteData } from "../../hooks/use-public-site-data";
import { cn } from "../../utils/cn";

const week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const initialState: BookingRequest = {
  fullName: "",
  email: "",
  phone: "",
  eventType: "",
  eventDate: "",
  preferredContactMethod: "email",
  specialNotes: ""
};

interface BookingFormProps {
  initialPublicData: PublicSiteData;
}

interface BlockedDateEntry {
  id: number;
  eventDate: string;
  status: "blocked" | "available";
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AvailabilityEntry {
  date: string;
  status: "available" | "pending" | "booked" | "blocked";
  note?: string;
}

interface CalendarCell {
  day?: number;
  iso?: string;
  status?: AvailabilityEntry["status"];
  note?: string;
  isToday?: boolean;
  isPast?: boolean;
}

function toIsoDateLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toMonthIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function parseIsoDate(value: string) {
  const parts = value.split("-");
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return new Date(year, month - 1, day);
}

export function BookingForm({ initialPublicData }: BookingFormProps) {
  const [form, setForm] = useState<BookingRequest>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [availabilityChecking, setAvailabilityChecking] = useState(false);
  const [dateStatus, setDateStatus] = useState<{ status: AvailabilityEntry["status"]; note?: string } | null>(null);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedIso, setSelectedIso] = useState("");
  const [monthAvailability, setMonthAvailability] = useState<AvailabilityEntry[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDateEntry[]>([]);
  const [monthLoading, setMonthLoading] = useState(false);
  const [monthError, setMonthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: publicData } = usePublicSiteData(initialPublicData);

  const siteContact = publicData?.siteContact ?? initialPublicData.siteContact;
  const bookingSettings = publicData?.bookingSettings ?? initialPublicData.bookingSettings;

  useEffect(() => {
    const selectedDate = searchParams.get("date");
    if (!selectedDate) return;
    const parsed = parseIsoDate(selectedDate);
    if (!parsed) return;
    setSelectedIso((prev) => (prev ? prev : selectedDate));
    setForm((prev) => (prev.eventDate ? prev : { ...prev, eventDate: selectedDate }));
    setMonthDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    console.info("[booking-flow] fetching blocked dates", { request: "/api/availability?list=blocked" });
    fetch(`/api/availability?list=blocked&t=${Date.now()}`, { cache: "no-store" })
      .then((response) => parseJson<{ blockedDates?: BlockedDateEntry[] }>(response))
      .then((payload) => {
        if (!active) return;
        console.info("[booking-flow] blocked dates response", { count: payload.blockedDates?.length ?? 0 });
        setBlockedDates(payload.blockedDates ?? []);
      })
      .catch((error) => {
        if (!active) return;
        console.error("[booking-flow] blocked dates fetch failed", error);
        setBlockedDates([]);
      });

    return () => {
      active = false;
    };
  }, []);

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
    console.info("[booking-flow] availability check request", { date: selectedIso });
    fetch(`/api/availability?date=${encodeURIComponent(selectedIso)}&t=${Date.now()}`, { cache: "no-store" })
      .then((response) => parseJson<{ status?: AvailabilityEntry["status"]; blockedDate?: { note?: string | null } }>(response))
      .then((payload) => {
        if (!active) return;
        const statusValue = payload.status ?? "available";
        const note = payload.blockedDate?.note ?? undefined;
        setDateStatus({ status: statusValue, note: note || undefined });
        console.info("[booking-flow] availability check response", { date: selectedIso, status: statusValue });

        if (statusValue === "available") {
          setForm((prev) => ({ ...prev, eventDate: selectedIso }));
          setErrors((prev) => ({ ...prev, eventDate: "" }));
          setStep(3);
          setStatus({ kind: "ok", text: "Date is available. Complete the short inquiry form." });
          return;
        }

        setForm((prev) => ({ ...prev, eventDate: "" }));
        setErrors((prev) => ({ ...prev, eventDate: "Date not available" }));
        setStep(1);
        setStatus({ kind: "bad", text: note ? `Date not available: ${note}` : "Date not available. Please select another date." });
      })
      .catch((error) => {
        if (!active) return;
        console.error("[booking-flow] availability check failed", error);
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
  }, [selectedIso]);

  const blockedDateSet = useMemo(() => new Set(blockedDates.map((item) => item.eventDate)), [blockedDates]);

  const availabilityMap = useMemo(() => {
    const map = new Map<string, AvailabilityEntry>();
    monthAvailability.forEach((entry) => {
      map.set(entry.date, entry);
    });
    blockedDates.forEach((entry) => {
      map.set(entry.eventDate, {
        date: entry.eventDate,
        status: "blocked",
        note: entry.note || "Blocked by admin"
      });
    });
    return map;
  }, [monthAvailability, blockedDates]);

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
      const status = blockedDateSet.has(iso) ? "blocked" : availabilityMap.get(iso)?.status ?? "available";
      const note = blockedDateSet.has(iso)
        ? blockedDates.find((entry) => entry.eventDate === iso)?.note || "Blocked by admin"
        : availabilityMap.get(iso)?.note;
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
  }, [availabilityMap, blockedDateSet, blockedDates, monthDate, todayIso]);

  const update = (key: keyof BookingRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setStatus(null);
  };

  const validateInquiry = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.fullName?.trim()) nextErrors.fullName = "Full name is required";
    if (!form.email?.trim()) nextErrors.email = "Email is required";
    if (!form.phone?.trim()) nextErrors.phone = "Phone is required";
    if (!form.eventType?.trim()) nextErrors.eventType = "Event type is required";
    if (!form.eventDate?.trim()) nextErrors.eventDate = "Choose an available date first";

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }

    if (form.phone && form.phone.replace(/\D/g, "").length < 10) {
      nextErrors.phone = "Enter a valid phone number";
    }

    if (form.eventDate && form.eventDate < todayIso) {
      nextErrors.eventDate = "Event date cannot be in the past";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

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

  const continueToReview = () => {
    if (!validateInquiry()) {
      setStatus({ kind: "bad", text: "Please complete all required fields in the inquiry form." });
      return;
    }
    setStatus(null);
    setStep(4);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateInquiry()) {
      setStatus({ kind: "bad", text: "Please review highlighted fields." });
      return;
    }

    if (!bookingSettings.enabled) {
      setStatus({
        kind: "bad",
        text: bookingSettings.notice || "Bookings are temporarily paused. Please contact us directly."
      });
      return;
    }

    setLoading(true);
    try {
      const hardBlocked = blockedDateSet.has(form.eventDate);
      if (hardBlocked) {
        setStatus({ kind: "bad", text: "Date not available" });
        return;
      }

      console.info("[booking-flow] submit availability request", { date: form.eventDate });
      const availabilityResponse = await fetch(`/api/availability?date=${encodeURIComponent(form.eventDate)}`, {
        cache: "no-store"
      });
      const availabilityPayload = await parseJson<{ available?: boolean; status?: string }>(availabilityResponse);
      const selectedStatus = availabilityPayload.status ?? "available";
      const isAvailable = availabilityPayload.available ?? selectedStatus === "available";
      console.info("[booking-flow] submit availability response", { date: form.eventDate, status: selectedStatus });

      if (!isAvailable) {
        setStatus({
          kind: "bad",
          text: selectedStatus === "pending" ? "Date not available: awaiting confirmation." : "Date not available"
        });
        return;
      }

      const requestPayload: BookingRequest = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        eventType: form.eventType.trim(),
        eventDate: form.eventDate,
        preferredContactMethod: form.preferredContactMethod ?? "email",
        specialNotes: form.specialNotes?.trim() ?? ""
      };

      console.info("[booking-flow] booking submit request", {
        eventDate: requestPayload.eventDate,
        eventType: requestPayload.eventType
      });
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload)
      });

      const responsePayload = await parseJson<{ booking: { id: string } }>(response);
      console.info("[booking-flow] booking submit response", { bookingId: responsePayload.booking.id });
      setStatus({ kind: "ok", text: "Inquiry submitted successfully." });
      const summary = new URLSearchParams({
        bookingId: responsePayload.booking.id,
        date: form.eventDate,
        package: ""
      });
      router.push(`/thank-you?${summary.toString()}`);
    } catch (error) {
      setStatus({ kind: "bad", text: error instanceof Error ? error.message : "Submission failed" });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (name: keyof BookingRequest) =>
    `field-input ${errors[name] ? "field-input-invalid" : ""}`;

  const fieldError = (name: keyof BookingRequest) => (
    <p id={`${name}-error`} className="error-text">
      {errors[name] ?? ""}
    </p>
  );

  const summaryRows = useMemo(() => {
    const rows: Array<{ label: string; value: string }> = [];

    if (form.eventDate) rows.push({ label: "Date", value: form.eventDate });
    if (form.fullName?.trim()) rows.push({ label: "Name", value: form.fullName.trim() });
    if (form.email?.trim()) rows.push({ label: "Email", value: form.email.trim() });
    if (form.phone?.trim()) rows.push({ label: "Phone", value: form.phone.trim() });
    if (form.eventType?.trim()) rows.push({ label: "Event", value: form.eventType.trim() });
    if (form.preferredContactMethod?.trim()) {
      rows.push({ label: "Contact Method", value: form.preferredContactMethod.trim() });
    }
    if (form.specialNotes?.trim()) rows.push({ label: "Notes", value: form.specialNotes.trim() });

    return rows;
  }, [form]);

  return (
    <form onSubmit={submit} className="grid gap-5 md:grid-cols-[minmax(0,1fr)_320px]" noValidate>
      <div className="glass-panel p-5 md:p-7">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
            <span>Step {step} of 4</span>
            <span>
              {step === 1 ? "Choose Date" : null}
              {step === 2 ? "Checking Availability" : null}
              {step === 3 ? "Inquiry Form" : null}
              {step === 4 ? "Submit Inquiry" : null}
            </span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-luxeBlue to-luxePurple transition-all duration-300" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
          <p className="mt-3 text-sm text-slate-300">
            {step === 1 ? "Step 1: choose your date from the live calendar." : null}
            {step === 2 ? "Step 2: we automatically verify the selected date." : null}
            {step === 3 ? "Step 3: complete a short booking inquiry." : null}
            {step === 4 ? "Step 4: review and submit your inquiry." : null}
          </p>
        </div>

        {step === 1 ? (
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
                    title={cell.note || cell.iso || ""}
                    className={cn(
                      "min-h-[62px] rounded-lg border text-center text-sm font-bold transition duration-200",
                      !cell.day && "border-transparent bg-transparent",
                      cell.isToday && "ring-1 ring-luxeGold/70",
                      selected && "ring-2 ring-luxeBlue",
                      effectiveStatus === "available" && !cell.isPast && "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
                      effectiveStatus === "pending" && "border-amber-300/40 bg-amber-500/10 text-amber-100 line-through",
                      effectiveStatus === "booked" && "border-rose-400/40 bg-rose-500/10 text-rose-100 line-through",
                      effectiveStatus === "blocked" && "border-slate-400/60 bg-slate-800/70 text-slate-300 line-through",
                      cell.isPast && "border-white/10 bg-slate-900/70 text-slate-500 line-through"
                    )}
                  >
                    <div className="pt-4">{cell.day || ""}</div>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-300">Blocked, booked, pending, and past dates are disabled.</p>
            {monthLoading ? <p className="mt-3 text-sm text-slate-300">Loading month availability...</p> : null}
            {monthError ? <p className="status-bad mt-3">{monthError}</p> : null}
            {fieldError("eventDate")}
          </>
        ) : null}

        {step === 2 ? (
          <div className="rounded-xl border border-white/15 bg-white/5 p-4">
            <p className="text-sm text-slate-300">Checking availability for:</p>
            <p className="mt-1 text-lg font-bold text-white">{selectedIso}</p>
            {availabilityChecking ? <p className="mt-2 text-sm text-slate-300">Checking now...</p> : null}
            {!availabilityChecking && dateStatus?.status === "available" ? (
              <p className="status-ok mt-3">Date is available.</p>
            ) : null}
            {!availabilityChecking && dateStatus && dateStatus.status !== "available" ? (
              <p className="status-bad mt-3">Date not available{dateStatus.note ? `: ${dateStatus.note}` : ""}</p>
            ) : null}
          </div>
        ) : null}

        {step >= 3 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="field">
              <label className="field-label" htmlFor="fullName">Full Name</label>
              <input id="fullName" autoComplete="name" className={inputClass("fullName")} value={form.fullName} onChange={(event) => update("fullName", event.target.value)} />
              {fieldError("fullName")}
            </div>
            <div className="field">
              <label className="field-label" htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" className={inputClass("email")} value={form.email} onChange={(event) => update("email", event.target.value)} />
              {fieldError("email")}
            </div>
            <div className="field">
              <label className="field-label" htmlFor="phone">Phone</label>
              <input id="phone" autoComplete="tel" className={inputClass("phone")} value={form.phone} onChange={(event) => update("phone", event.target.value)} />
              {fieldError("phone")}
            </div>
            <div className="field">
              <label className="field-label" htmlFor="eventType">Event Type</label>
              <select id="eventType" className={inputClass("eventType")} value={form.eventType} onChange={(event) => update("eventType", event.target.value)}>
                <option value="">Select event type</option>
                <option>Wedding</option>
                <option>Birthday</option>
                <option>Private Party</option>
                <option>Corporate Event</option>
                <option>Club / Lounge</option>
                <option>Holiday Party</option>
              </select>
              {fieldError("eventType")}
            </div>
            <div className="field">
              <label className="field-label" htmlFor="preferredContactMethod">Preferred Contact</label>
              <select id="preferredContactMethod" className={inputClass("preferredContactMethod")} value={form.preferredContactMethod} onChange={(event) => update("preferredContactMethod", event.target.value as BookingRequest["preferredContactMethod"])}>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="text">Text</option>
              </select>
              {fieldError("preferredContactMethod")}
            </div>
            <div className="field md:col-span-2">
              <label className="field-label" htmlFor="specialNotes">Quick Notes (optional)</label>
              <textarea id="specialNotes" rows={4} className={inputClass("specialNotes")} value={form.specialNotes || ""} onChange={(event) => update("specialNotes", event.target.value)} />
              {fieldError("specialNotes")}
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mt-4 rounded-xl border border-white/15 bg-white/5 p-4 text-sm text-slate-200">
            <p className="font-semibold text-white">Ready to submit inquiry for {form.eventDate}.</p>
            <p className="mt-1 text-slate-300">We will confirm availability and next steps after submission.</p>
          </div>
        ) : null}

        {!bookingSettings.enabled ? (
          <p className="status-bad mt-4">{bookingSettings.notice || "Bookings are temporarily paused. Please check back soon."}</p>
        ) : null}

        {status ? <p className={`mt-4 ${status.kind === "ok" ? "status-ok" : "status-bad"}`}>{status.text}</p> : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            {step > 1 ? (
              <button type="button" className="btn-secondary" onClick={() => setStep((prev) => (prev === 4 ? 3 : 1))}>Back</button>
            ) : null}
            {step === 3 ? (
              <button type="button" className="btn-primary" onClick={continueToReview}>Continue to Review</button>
            ) : null}
            {step === 4 ? (
              <button disabled={loading || !bookingSettings.enabled} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60" type="submit">
                {!bookingSettings.enabled ? "Booking Paused" : loading ? "Submitting..." : "Submit Booking Inquiry"}
              </button>
            ) : null}
          </div>
          <a href="/availability" className="btn-secondary">
            Check Availability
          </a>
        </div>
      </div>

      <aside className="glass-panel h-fit p-5 md:sticky md:top-24">
        <h3 className="text-lg font-bold text-white">Booking Summary</h3>
        <p className="mt-1 text-sm text-slate-300">Live snapshot of your inquiry details.</p>
        <p className="mt-2 text-sm text-slate-300">
          Need quick help? <a className="font-semibold text-luxeGold" href={siteContact.phoneHref}>{siteContact.phone}</a>
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
    </form>
  );
}
