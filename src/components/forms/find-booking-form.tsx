"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface LookupResponse {
  message?: string;
  redirectUrl?: string;
  historyUrl?: string;
  requireEmailDelivery?: boolean;
}

async function parseResponse(response: Response): Promise<LookupResponse> {
  const payload = (await response.json().catch(() => null)) as LookupResponse | null;
  if (!response.ok) {
    throw new Error(payload?.message || "Lookup failed");
  }
  return payload || {};
}

export function FindBookingForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [bookingIdOrPhone, setBookingIdOrPhone] = useState("");
  const [loadingAction, setLoadingAction] = useState<"email" | "open" | null>(null);
  const [status, setStatus] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);

  const performLookup = async (action: "email" | "open") => {
    setStatus(null);
    setLoadingAction(action);

    try {
      const response = await fetch("/api/bookings/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          bookingIdOrPhone,
          action
        })
      });

      const payload = await parseResponse(response);
      if (action === "open" && payload.redirectUrl) {
        router.push(payload.redirectUrl);
        return;
      }

      setStatus({ kind: "ok", text: payload.message || "Request completed." });
    } catch (error) {
      setStatus({ kind: "bad", text: error instanceof Error ? error.message : "Unable to complete request." });
    } finally {
      setLoadingAction(null);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await performLookup("email");
  };

  return (
    <form className="glass-panel p-5 md:p-6" onSubmit={(event) => void submit(event)}>
      <h1 className="text-3xl font-bold text-white">Find My Booking</h1>
      <p className="mt-2 text-slate-300">Enter your booking email and booking ID or phone number to securely access your booking conversation.</p>
      <p className="mt-2 text-sm text-slate-300">Use Booking History to reopen your booking, read updates, and reply to the booking team.</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="field">
          <span className="field-label">Booking Email</span>
          <input
            type="email"
            className="field-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Booking ID or Phone</span>
          <input
            type="text"
            className="field-input"
            value={bookingIdOrPhone}
            onChange={(event) => setBookingIdOrPhone(event.target.value)}
            placeholder="Booking ID or phone number"
            required
          />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button type="submit" className="btn-primary" disabled={loadingAction !== null}>
          {loadingAction === "email" ? "Sending..." : "Email My Access Link"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={loadingAction !== null}
          onClick={() => void performLookup("open")}
        >
          {loadingAction === "open" ? "Opening..." : "Open Chat Now"}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-400">Open Chat Now is only available with booking ID verification. Phone lookups require secure email delivery.</p>

      {status?.kind === "ok" ? <p className="status-ok mt-4">{status.text}</p> : null}
      {status?.kind === "bad" ? <p className="status-bad mt-4">{status.text}</p> : null}
    </form>
  );
}
