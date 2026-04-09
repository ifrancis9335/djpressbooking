"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { BookingRequest } from "../../types/booking";
import { parseJson } from "../../utils/api";
import { packageAddOns, packageTiers } from "../../data/catalog";

const initialState: BookingRequest = {
  fullName: "",
  email: "",
  phone: "",
  eventType: "",
  eventDate: "",
  startTime: "",
  endTime: "",
  venueName: "",
  venueAddress: "",
  city: "",
  settingType: "indoor",
  guestCount: 1,
  genres: "",
  cleanMusic: "yes",
  mcService: "no",
  lights: "no",
  packageId: "",
  selectedAddOns: [],
  budgetRange: "",
  preferredContactMethod: "email",
  specialNotes: ""
};

export function BookingForm() {
  const [form, setForm] = useState<BookingRequest>(initialState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const formRef = useRef<HTMLFormElement | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedPackage = useMemo(
    () => packageTiers.find((tier) => tier.id === form.packageId),
    [form.packageId]
  );

  const steps = useMemo(
    () => [
      {
        title: "Event Basics",
        description: "Tell us what event you are planning and when it takes place.",
        fields: ["fullName", "email", "phone", "eventType", "eventDate", "startTime", "endTime"] as Array<keyof BookingRequest>
      },
      {
        title: "Venue & Services",
        description: "Share venue details, package fit, and service preferences.",
        fields: ["venueName", "venueAddress", "city", "settingType", "guestCount", "genres", "cleanMusic", "mcService", "lights", "packageId", "selectedAddOns"] as Array<keyof BookingRequest>
      },
      {
        title: "Budget & Final Details",
        description: "Add budget, contact preference, and any notes for planning.",
        fields: ["budgetRange", "preferredContactMethod", "specialNotes"] as Array<keyof BookingRequest>
      }
    ],
    []
  );

  useEffect(() => {
    const preselected = searchParams.get("package");
    if (!preselected) return;
    const exists = packageTiers.some((tier) => tier.id === preselected);
    if (!exists) return;
    setForm((prev) => (prev.packageId ? prev : { ...prev, packageId: preselected }));
  }, [searchParams]);

  useEffect(() => {
    const selectedDate = searchParams.get("date");
    if (!selectedDate) return;
    setForm((prev) => (prev.eventDate ? prev : { ...prev, eventDate: selectedDate }));
  }, [searchParams]);

  const update = (key: keyof BookingRequest, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
    setStatus(null);
  };

  const toggleAddOn = (id: string) => {
    setForm((prev) => {
      const current = prev.selectedAddOns ?? [];
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      return { ...prev, selectedAddOns: next };
    });
  };

  const validate = (targetFields?: Array<keyof BookingRequest>) => {
    const fieldSet = targetFields ? new Set(targetFields) : null;
    const nextErrors: Record<string, string> = {};
    const required: Array<keyof BookingRequest> = [
      "fullName",
      "email",
      "phone",
      "eventType",
      "eventDate",
      "startTime",
      "endTime",
      "venueName",
      "venueAddress",
      "city",
      "genres",
      "budgetRange"
    ];

    required.forEach((field) => {
      if (fieldSet && !fieldSet.has(field)) return;
      const value = String(form[field] ?? "").trim();
      if (!value) nextErrors[field] = "This field is required";
    });

    if ((!fieldSet || fieldSet.has("startTime") || fieldSet.has("endTime")) && form.startTime && form.endTime && form.startTime >= form.endTime) {
      nextErrors.endTime = "End time must be after start time";
    }

    if ((!fieldSet || fieldSet.has("email")) && form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address";
    }

    if ((!fieldSet || fieldSet.has("phone")) && form.phone && form.phone.replace(/\D/g, "").length < 10) {
      nextErrors.phone = "Enter a valid phone number";
    }

    if ((!fieldSet || fieldSet.has("eventDate")) && form.eventDate) {
      const eventDate = new Date(`${form.eventDate}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (eventDate < today) {
        nextErrors.eventDate = "Event date cannot be in the past";
      }
    }

    setErrors((prev) => {
      const updated = { ...prev };
      if (targetFields) {
        targetFields.forEach((field) => {
          delete updated[field];
        });
      } else {
        Object.keys(updated).forEach((key) => delete updated[key]);
      }
      Object.assign(updated, nextErrors);
      return updated;
    });

    if (Object.keys(nextErrors).length > 0 && formRef.current) {
      const firstInvalid = Object.keys(nextErrors)[0];
      const target = formRef.current.querySelector<HTMLElement>(`#${firstInvalid}`);
      target?.focus();
    }

    return Object.keys(nextErrors).length === 0;
  };

  const nextStep = () => {
    if (!validate(steps[step].fields)) {
      setStatus({ kind: "bad", text: "Please complete required fields before continuing." });
      return;
    }
    setStatus(null);
    setStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => {
    setStatus(null);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      setStatus({ kind: "bad", text: "Please review highlighted fields." });
      return;
    }

    setLoading(true);
    try {
      const availabilityResponse = await fetch(`/api/availability?date=${encodeURIComponent(form.eventDate)}`, {
        cache: "no-store"
      });
      const availabilityPayload = await parseJson<{ record?: { status?: string } }>(availabilityResponse);
      const selectedStatus = availabilityPayload.record?.status ?? "available";

      if (selectedStatus !== "available") {
        setStatus({
          kind: "bad",
          text: selectedStatus === "pending" ? "Selected date is awaiting confirmation." : "Selected date is unavailable."
        });
        return;
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      const payload = await parseJson<{ booking: { id: string } }>(response);
      setStatus({ kind: "ok", text: "Inquiry submitted successfully." });
      const summary = new URLSearchParams({
        bookingId: payload.booking.id,
        date: form.eventDate,
        package: form.packageId || ""
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

  return (
    <form ref={formRef} onSubmit={submit} className="grid gap-5 md:grid-cols-[minmax(0,1fr)_300px]" noValidate>
      <div className="glass-panel p-5 md:p-7">
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
            <span>Step {step + 1} of {steps.length}</span>
            <span>{steps[step].title}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-luxeBlue to-luxePurple transition-all duration-300" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
          </div>
          <p className="mt-3 text-sm text-slate-300">{steps[step].description}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {step === 0 ? (
            <>
              <div className="field">
                <label className="field-label" htmlFor="fullName">Full Name</label>
                <input id="fullName" autoComplete="name" aria-invalid={Boolean(errors.fullName)} aria-describedby="fullName-error" className={inputClass("fullName")} value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
                {fieldError("fullName")}
              </div>
              <div className="field">
                <label className="field-label" htmlFor="email">Email</label>
                <input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby="email-error" className={inputClass("email")} value={form.email} onChange={(e) => update("email", e.target.value)} />
                {fieldError("email")}
              </div>
              <div className="field">
                <label className="field-label" htmlFor="phone">Phone</label>
                <input id="phone" inputMode="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} aria-describedby="phone-error" className={inputClass("phone")} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                {fieldError("phone")}
              </div>
              <div className="field">
                <label className="field-label" htmlFor="eventType">Event Type</label>
                <select id="eventType" aria-invalid={Boolean(errors.eventType)} aria-describedby="eventType-error" className={inputClass("eventType")} value={form.eventType} onChange={(e) => update("eventType", e.target.value)}>
                  <option value="">Select event type</option><option>Wedding</option><option>Birthday</option><option>Private Party</option><option>Corporate Event</option><option>Club / Lounge</option><option>Reunion</option><option>School Event</option><option>Cookout / Day Party</option><option>Holiday Party</option><option>Caribbean / Reggae Event</option><option>Afrobeat Event</option>
                </select>
                {fieldError("eventType")}
              </div>
              <div className="field">
                <label className="field-label" htmlFor="eventDate">Event Date</label>
                <input id="eventDate" type="date" aria-invalid={Boolean(errors.eventDate)} aria-describedby="eventDate-error" className={inputClass("eventDate")} value={form.eventDate} onChange={(e) => update("eventDate", e.target.value)} />
                {fieldError("eventDate")}
              </div>
              <div className="field">
                <label className="field-label" htmlFor="startTime">Start Time</label>
                <input id="startTime" type="time" aria-invalid={Boolean(errors.startTime)} aria-describedby="startTime-error" className={inputClass("startTime")} value={form.startTime} onChange={(e) => update("startTime", e.target.value)} />
                {fieldError("startTime")}
              </div>
              <div className="field md:col-span-2">
                <label className="field-label" htmlFor="endTime">End Time</label>
                <input id="endTime" type="time" aria-invalid={Boolean(errors.endTime)} aria-describedby="endTime-error" className={inputClass("endTime")} value={form.endTime} onChange={(e) => update("endTime", e.target.value)} />
                {fieldError("endTime")}
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="field">
                <label className="field-label" htmlFor="venueName">Venue Name</label>
                <input id="venueName" aria-invalid={Boolean(errors.venueName)} aria-describedby="venueName-error" className={inputClass("venueName")} value={form.venueName} onChange={(e) => update("venueName", e.target.value)} />
                {fieldError("venueName")}
              </div>
              <div className="field">
                <label className="field-label" htmlFor="city">City</label>
                <input id="city" autoComplete="address-level2" aria-invalid={Boolean(errors.city)} aria-describedby="city-error" className={inputClass("city")} value={form.city} onChange={(e) => update("city", e.target.value)} />
                {fieldError("city")}
              </div>
              <div className="field md:col-span-2">
                <label className="field-label" htmlFor="venueAddress">Venue Address</label>
                <input id="venueAddress" aria-invalid={Boolean(errors.venueAddress)} aria-describedby="venueAddress-error" className={inputClass("venueAddress")} value={form.venueAddress} onChange={(e) => update("venueAddress", e.target.value)} />
                {fieldError("venueAddress")}
              </div>
              <div className="field">
                <label className="field-label" htmlFor="settingType">Indoor / Outdoor</label>
                <select id="settingType" className={inputClass("settingType")} value={form.settingType} onChange={(e) => update("settingType", e.target.value as BookingRequest["settingType"])}><option value="indoor">Indoor</option><option value="outdoor">Outdoor</option><option value="hybrid">Hybrid</option></select>
                {fieldError("settingType")}
              </div>
              <div className="field">
                <label className="field-label" htmlFor="guestCount">Guest Count</label>
                <input id="guestCount" type="number" min={1} className={inputClass("guestCount")} value={form.guestCount} onChange={(e) => update("guestCount", Number(e.target.value))} />
                {fieldError("guestCount")}
              </div>
              <div className="field md:col-span-2">
                <label className="field-label" htmlFor="genres">Music Genres</label>
                <input id="genres" aria-invalid={Boolean(errors.genres)} aria-describedby="genres-error" className={inputClass("genres")} value={form.genres} onChange={(e) => update("genres", e.target.value)} />
                {fieldError("genres")}
              </div>
              <div className="field md:col-span-2">
                <label className="field-label" htmlFor="packageId">Preferred Package</label>
                <select id="packageId" className={inputClass("packageId")} value={form.packageId || ""} onChange={(e) => update("packageId", e.target.value)}>
                  <option value="">Not sure yet</option>
                  {packageTiers.map((tier) => (
                    <option key={tier.id} value={tier.id}>{tier.name} - Starting at {tier.startingAt}</option>
                  ))}
                </select>
                {fieldError("packageId")}
              </div>
              <div className="field md:col-span-2">
                <span className="field-label">Optional Add-ons</span>
                <div className="grid gap-2 md:grid-cols-2">
                  {packageAddOns.map((addon) => {
                    const checked = (form.selectedAddOns ?? []).includes(addon.id);
                    return (
                      <label key={addon.id} className={`addon-chip cursor-pointer ${checked ? "border-luxeBlue/45" : ""}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-white">{addon.name}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleAddOn(addon.id)}
                            className="h-4 w-4 accent-sky-400"
                          />
                        </div>
                        <p className="text-xs text-slate-300">{addon.priceHint} - {addon.description}</p>
                      </label>
                    );
                  })}
                </div>
                {fieldError("selectedAddOns")}
              </div>
              <div className="field">
                <label className="field-label" htmlFor="cleanMusic">Clean Music</label>
                <select id="cleanMusic" className={inputClass("cleanMusic")} value={form.cleanMusic} onChange={(e) => update("cleanMusic", e.target.value as BookingRequest["cleanMusic"])}><option value="yes">Yes</option><option value="no">No</option></select>
                {fieldError("cleanMusic")}
              </div>
              <div className="field">
                <label className="field-label" htmlFor="mcService">MC Service</label>
                <select id="mcService" className={inputClass("mcService")} value={form.mcService} onChange={(e) => update("mcService", e.target.value as BookingRequest["mcService"])}><option value="yes">Yes</option><option value="no">No</option></select>
                {fieldError("mcService")}
              </div>
              <div className="field md:col-span-2">
                <label className="field-label" htmlFor="lights">Lighting Package</label>
                <select id="lights" className={inputClass("lights")} value={form.lights} onChange={(e) => update("lights", e.target.value as BookingRequest["lights"])}><option value="yes">Yes</option><option value="no">No</option></select>
                {fieldError("lights")}
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="field">
                <label className="field-label" htmlFor="budgetRange">Budget Range</label>
                <select id="budgetRange" aria-invalid={Boolean(errors.budgetRange)} aria-describedby="budgetRange-error" className={inputClass("budgetRange")} value={form.budgetRange} onChange={(e) => update("budgetRange", e.target.value)}><option value="">Select range</option><option>$500 - $900</option><option>$900 - $1,500</option><option>$1,500 - $2,500</option><option>$2,500+</option></select>
                {fieldError("budgetRange")}
              </div>
              <div className="field">
                <label className="field-label" htmlFor="preferredContactMethod">Preferred Contact Method</label>
                <select id="preferredContactMethod" className={inputClass("preferredContactMethod")} value={form.preferredContactMethod} onChange={(e) => update("preferredContactMethod", e.target.value as BookingRequest["preferredContactMethod"])}><option value="email">Email</option><option value="phone">Phone</option><option value="text">Text</option></select>
                {fieldError("preferredContactMethod")}
              </div>
              <div className="field md:col-span-2">
                <label className="field-label" htmlFor="specialNotes">Special Notes</label>
                <textarea id="specialNotes" className={inputClass("specialNotes")} rows={6} value={form.specialNotes} onChange={(e) => update("specialNotes", e.target.value)} />
                {fieldError("specialNotes")}
              </div>
            </>
          ) : null}
        </div>

        {status ? <p className={`mt-4 ${status.kind === "ok" ? "status-ok" : "status-bad"}`}>{status.text}</p> : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            {step > 0 ? (
              <button type="button" className="btn-secondary" onClick={prevStep}>Back</button>
            ) : null}
            {step < steps.length - 1 ? (
              <button type="button" className="btn-primary" onClick={nextStep}>Continue</button>
            ) : null}
            {step === steps.length - 1 ? (
              <button disabled={loading} className="btn-primary disabled:cursor-not-allowed disabled:opacity-60" type="submit">
                {loading ? "Submitting..." : "Submit Booking Inquiry"}
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
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
          <dt className="text-slate-400">Name</dt><dd className="text-slate-100">{form.fullName || "-"}</dd>
          <dt className="text-slate-400">Event</dt><dd className="text-slate-100">{form.eventType || "-"}</dd>
          <dt className="text-slate-400">Date</dt><dd className="text-slate-100">{form.eventDate || "-"}</dd>
          <dt className="text-slate-400">Time</dt><dd className="text-slate-100">{form.startTime && form.endTime ? `${form.startTime} - ${form.endTime}` : "-"}</dd>
          <dt className="text-slate-400">Venue</dt><dd className="text-slate-100">{form.venueName || "-"}</dd>
          <dt className="text-slate-400">Guests</dt><dd className="text-slate-100">{form.guestCount || "-"}</dd>
          <dt className="text-slate-400">Package</dt><dd className="text-slate-100">{selectedPackage ? `${selectedPackage.name} (${selectedPackage.startingAt})` : "Not selected"}</dd>
          <dt className="text-slate-400">Add-ons</dt><dd className="text-slate-100">{(form.selectedAddOns ?? []).length ? `${(form.selectedAddOns ?? []).length} selected` : "None"}</dd>
          <dt className="text-slate-400">Budget</dt><dd className="text-slate-100">{form.budgetRange || "-"}</dd>
        </dl>
      </aside>
    </form>
  );
}
