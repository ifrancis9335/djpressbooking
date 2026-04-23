"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { BookingRequest } from "../../types/booking";
import { PublicSiteData } from "../../types/site-settings";
import { usePublicSiteData } from "../../hooks/use-public-site-data";
import { initialState, normalizePackageId, parseIsoDate, toIsoDateLocal } from "./booking/helpers";
import { useBookingAvailability } from "./booking/useBookingAvailability";
import { useBookingSubmission } from "./booking/useBookingSubmission";
import { BookingCalendarStep } from "./booking/BookingCalendarStep";
import { BookingAvailabilityStep } from "./booking/BookingAvailabilityStep";
import { BookingInquiryStep } from "./booking/BookingInquiryStep";
import { BookingReviewStep } from "./booking/BookingReviewStep";
import { BookingSummarySidebar } from "./booking/BookingSummarySidebar";
import { CHAT_BOOKING_PREFILL_STORAGE_KEY } from "../../utils/chat-api";

interface BookingFormProps {
  initialPublicData: PublicSiteData;
}

export function BookingForm({ initialPublicData }: BookingFormProps) {
  const [form, setForm] = useState<BookingRequest>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [monthDate, setMonthDate] = useState(() => new Date());
  const [selectedIso, setSelectedIso] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: publicData } = usePublicSiteData(initialPublicData);

  const siteContact = publicData?.siteContact ?? initialPublicData.siteContact;
  const bookingSettings = publicData?.bookingSettings ?? initialPublicData.bookingSettings;
  const packageTiers = publicData?.packageTiers ?? initialPublicData.packageTiers;
  const allowedPackageIds = useMemo(() => new Set(packageTiers.map((tier) => tier.id.toLowerCase())), [packageTiers]);

  const debugInfo = useCallback((..._args: unknown[]) => {}, []);
  const debugError = useCallback((..._args: unknown[]) => {}, []);

  useEffect(() => {
    const selectedDate = searchParams.get("date");
    const packageFromQuery = searchParams.get("package");
    const assistantFlow = searchParams.get("assistant") === "1";
    const normalizedPackageId = normalizePackageId(packageFromQuery, allowedPackageIds);
    const queryEventType = searchParams.get("eventType")?.trim() || "";
    const queryGuestCount = searchParams.get("guestCount")?.trim() || "";
    const queryVenueName = searchParams.get("venue")?.trim() || "";
    const queryNotes = searchParams.get("notes")?.trim() || "";

    let storagePrefill: Partial<BookingRequest> = {};
    if (typeof window !== "undefined") {
      const raw = window.sessionStorage.getItem(CHAT_BOOKING_PREFILL_STORAGE_KEY);
      if (raw) {
        try {
          storagePrefill = JSON.parse(raw) as Partial<BookingRequest>;
        } catch {
          window.sessionStorage.removeItem(CHAT_BOOKING_PREFILL_STORAGE_KEY);
        }
      }
    }

    const nextDate = selectedDate || storagePrefill.eventDate || "";
    const nextEventType = queryEventType || storagePrefill.eventType || "";
    const nextVenueName = queryVenueName || storagePrefill.venueName || "";
    const nextGuestCount = queryGuestCount ? Number(queryGuestCount) : storagePrefill.guestCount;
    const nextNotes = storagePrefill.specialNotes || queryNotes || "";

    setForm((prev) => ({
      ...prev,
      packageId: normalizedPackageId ?? prev.packageId,
      eventDate: prev.eventDate || nextDate,
      eventType: prev.eventType || nextEventType,
      venueName: prev.venueName || nextVenueName,
      guestCount: prev.guestCount || nextGuestCount,
      specialNotes: prev.specialNotes || nextNotes
    }));

    if (!nextDate) {
      return;
    }

    const parsed = parseIsoDate(nextDate);
    if (!parsed) {
      return;
    }

    setSelectedIso((prev) => (prev ? prev : nextDate));
    setMonthDate(new Date(parsed.getFullYear(), parsed.getMonth(), 1));

    if (assistantFlow) {
      setStep((prev) => (prev < 3 ? 3 : prev));
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(CHAT_BOOKING_PREFILL_STORAGE_KEY);
      }
    }
  }, [allowedPackageIds, searchParams]);

  const todayIso = useMemo(() => toIsoDateLocal(new Date()), []);

  const setFormEventDate = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, eventDate: value }));
  }, []);

  const setEventDateError = useCallback((value: string) => {
    setErrors((prev) => ({ ...prev, eventDate: value }));
  }, []);

  const {
    availabilityChecking,
    dateStatus,
    monthLoading,
    monthError,
    calendarCells,
    chooseDate
  } = useBookingAvailability({
    monthDate,
    selectedIso,
    setStep,
    setSelectedIso,
    setFormEventDate,
    setEventDateError,
    setStatus,
    debugInfo,
    debugError
  });

  const update = (key: keyof BookingRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setStatus(null);
  };


  const { continueToReview, submit } = useBookingSubmission({
    bookingEnabled: bookingSettings.enabled,
    bookingNotice: bookingSettings.notice,
    todayIso,
    form,
    setErrors: (updater) => setErrors(updater),
    setStatus,
    setLoading,
    routerPush: (url) => router.push(url),
    isDev: false,
    debugInfo
  });

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
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
      className="grid gap-5 md:grid-cols-[minmax(0,1fr)_320px]"
      noValidate
    >
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
          <BookingCalendarStep
            monthDate={monthDate}
            setMonthDate={(updater) => setMonthDate(updater)}
            calendarCells={calendarCells}
            selectedIso={selectedIso}
            chooseDate={chooseDate}
            monthLoading={monthLoading}
            monthError={monthError}
            fieldError={fieldError("eventDate")}
          />
        ) : null}

        {step === 2 ? (
          <BookingAvailabilityStep selectedIso={selectedIso} availabilityChecking={availabilityChecking} dateStatus={dateStatus} />
        ) : null}

        {step >= 3 ? (
          <BookingInquiryStep form={form} update={update} inputClass={inputClass} fieldError={fieldError} />
        ) : null}

        {step === 4 ? (
          <BookingReviewStep eventDate={form.eventDate} />
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
              <button type="button" className="btn-primary" onClick={() => continueToReview((next) => setStep(next))}>Continue to Review</button>
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

      <BookingSummarySidebar sitePhone={siteContact.phone} sitePhoneHref={siteContact.phoneHref} summaryRows={summaryRows} />
    </form>
  );
}
