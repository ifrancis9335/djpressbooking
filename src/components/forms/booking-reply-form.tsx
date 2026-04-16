"use client";

import { useState } from "react";

interface BookingReplyFormProps {
  token: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as T | { message?: string } | null;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "message" in payload ? payload.message : undefined;
    throw new Error(message || "Request failed");
  }
  return payload as T;
}

export function BookingReplyForm({ token }: BookingReplyFormProps) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSending(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch("/api/bookings/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, body })
      });
      const payload = await parseResponse<{ message: string }>(response);
      setSuccess(payload.message);
      setBody("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass-panel p-5 md:p-6">
      <h2 className="text-xl font-bold text-white">Reply to DJ Press</h2>
      <p className="mt-2 text-sm text-slate-300">Your reply will be added directly to your booking conversation thread.</p>
      <label className="field mt-4">
        <span className="field-label">Message</span>
        <textarea
          className="field-input min-h-[140px]"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Write your reply here."
        />
      </label>
      <button type="button" className="btn-primary mt-4 md:w-auto" disabled={sending} onClick={() => void submit()}>
        {sending ? "Sending..." : "Send Reply"}
      </button>
      {success ? <p className="status-ok mt-3">{success}</p> : null}
      {error ? <p className="status-bad mt-3">{error}</p> : null}
    </div>
  );
}