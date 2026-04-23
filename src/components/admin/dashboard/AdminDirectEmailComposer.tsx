"use client";

import { useMemo, useState } from "react";
import { Booking } from "../../../types/booking";
import { sendAdminDirectEmail } from "../../../lib/admin/communications-admin";

interface AdminDirectEmailComposerProps {
  booking: Booking;
}

function defaultSubject(eventDate: string) {
  return `Update for your DJ Press booking on ${eventDate}`;
}

export function AdminDirectEmailComposer({ booking }: AdminDirectEmailComposerProps) {
  const [recipient, setRecipient] = useState(booking.email || "");
  const [subject, setSubject] = useState(defaultSubject(booking.eventDate));
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmedBody = useMemo(() => body.trim(), [body]);

  const sendEmail = async () => {
    setSending(true);
    setSuccess(null);
    setError(null);

    try {
      const result = await sendAdminDirectEmail(booking.id, {
        to: recipient,
        subject,
        message: body
      });
      setSuccess(result.message + (result.id ? ` (ID: ${result.id})` : ""));
      setBody("");
    } catch (sendError) {
      const msg = sendError instanceof Error ? sendError.message : "Unable to send email.";
      setError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
      <h4 className="text-sm font-semibold text-white">Send Direct Email</h4>
      <p className="mt-1 text-xs text-slate-400">Customer: {booking.fullName}</p>
      <p className="text-xs text-slate-400">Booking ID: {booking.id}</p>

      <div className="mt-3 grid gap-3">
        <label className="field">
          <span className="field-label">To</span>
          <input
            className="field-input"
            type="email"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder="customer@email.com"
          />
        </label>

        <label className="field">
          <span className="field-label">Subject</span>
          <input
            className="field-input"
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder={defaultSubject(booking.eventDate)}
          />
        </label>

        <label className="field">
          <span className="field-label">Message</span>
          <textarea
            className="field-input min-h-[120px]"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Write your email to the customer..."
          />
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary md:w-auto"
            disabled={sending || !recipient.trim() || !subject.trim() || !trimmedBody}
            onClick={() => void sendEmail()}
          >
            {sending ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>

      {success ? <p className="status-ok mt-3">{success}</p> : null}
      {error ? <p className="status-bad mt-3">{error}</p> : null}
    </div>
  );
}
