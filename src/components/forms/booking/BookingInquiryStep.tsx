import { ReactNode } from "react";
import { BookingRequest } from "../../../types/booking";

interface BookingInquiryStepProps {
  form: BookingRequest;
  update: (key: keyof BookingRequest, value: string | number) => void;
  inputClass: (name: keyof BookingRequest) => string;
  fieldError: (name: keyof BookingRequest) => ReactNode;
}

export function BookingInquiryStep({ form, update, inputClass, fieldError }: BookingInquiryStepProps) {
  return (
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
  );
}
