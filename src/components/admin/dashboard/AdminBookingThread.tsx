"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Booking } from "../../../types/booking";
import { BookingMessage } from "../../../types/booking-thread";
import { createAdminBookingMessage, fetchAdminBookingMessages } from "../../../lib/admin/communications-admin";

interface AdminBookingThreadProps {
  booking: Booking;
  refreshToken?: number;
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

export function AdminBookingThread({ booking, refreshToken = 0 }: AdminBookingThreadProps) {
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const threadContainerRef = useRef<HTMLDivElement | null>(null);

  const fetchMessages = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (silent) {
      setPolling(true);
    } else {
      setLoading(true);
    }

    try {
      const payload = await fetchAdminBookingMessages(booking.id);
      setMessages(payload.messages || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load thread messages");
    } finally {
      setLoading(false);
      setPolling(false);
    }
  }, [booking.id]);

  const unreadCustomerCount = useMemo(
    () => messages.filter((message) => message.senderType === "customer" && !message.read).length,
    [messages]
  );

  const latestMessage = useMemo(() => {
    if (messages.length === 0) {
      return null;
    }

    return messages[messages.length - 1];
  }, [messages]);

  useEffect(() => {
    setError(null);
    void fetchMessages();
  }, [fetchMessages, refreshToken]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchMessages({ silent: true });
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchMessages]);

  useEffect(() => {
    const container = threadContainerRef.current;
    if (!container) {
      return;
    }

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distanceFromBottom <= 64) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length]);

  const sendMessage = async (visibility: "customer" | "internal") => {
    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = await createAdminBookingMessage(booking.id, { body: draft, visibility });
      setMessages((current) => [...current, payload.threadMessage]);
      setDraft("");
      setSuccess(payload.message);
      void fetchMessages({ silent: true });
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Unable to send thread message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-5 rounded-xl border border-white/10 bg-slate-950/35 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-white">Conversation Thread</p>
          <p className="text-xs text-slate-400">Reply directly to this booking without leaving the admin dashboard.</p>
          <p className="mt-1 text-xs text-slate-400">Customer can reopen this booking from the secure booking portal or the email access link.</p>
          <p className="mt-1 text-xs text-slate-500">
            {latestMessage ? `Latest: ${latestMessage.body.slice(0, 72)}${latestMessage.body.length > 72 ? "..." : ""}` : "No messages yet."}
          </p>
        </div>
        <div className="text-right text-xs text-slate-400">
          <p>Unread customer messages: {unreadCustomerCount}</p>
          <p>{polling ? "Live sync..." : "Live updates every 4s"}</p>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/20">
        <div ref={threadContainerRef} className="max-h-[360px] min-h-[240px] overflow-y-auto p-3">
          {loading ? <p className="text-sm text-slate-300">Loading thread...</p> : null}
          {!loading && messages.length === 0 ? <p className="text-sm text-slate-400">No messages yet.</p> : null}
          <div className="grid gap-2">
            {messages.map((message) => {
              const isAdmin = message.senderType === "admin";
              const isCustomer = message.senderType === "customer";
              const isInternal = message.senderType === "internal";
              return (
                <article key={message.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow ${
                      isAdmin
                        ? "bg-luxeBlue/80 text-white"
                        : isInternal
                          ? "border border-amber-500/25 bg-amber-500/10 text-amber-100"
                        : isCustomer
                          ? "bg-emerald-600/75 text-white"
                          : "bg-white/10 text-slate-100"
                    }`}
                  >
                    {isInternal ? <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">Internal note</p> : null}
                    <p className="whitespace-pre-wrap">{message.body}</p>
                    <div className="mt-1 flex items-center justify-between gap-3 text-[10px] uppercase tracking-wider text-white/80">
                      <span>{formatTimestamp(message.timestamp)}</span>
                      <span>{message.read ? "Read" : "Unread"}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-white/10 bg-slate-950/95 p-3">
          <label className="field">
            <span className="field-label">Customer Message or Internal Note</span>
            <textarea
              className="field-input min-h-[84px]"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a customer update or save a private admin note..."
            />
          </label>
          <p className="mt-2 text-xs text-slate-500">Customer messages trigger the normal reply flow. Internal notes stay visible only inside admin.</p>
          <div className="mt-2 flex flex-wrap gap-3">
            <button type="button" className="btn-primary md:w-auto" disabled={sending || !draft.trim()} onClick={() => void sendMessage("customer")}>
              {sending ? "Sending..." : "Send to Customer"}
            </button>
            <button type="button" className="btn-secondary md:w-auto" disabled={sending || !draft.trim()} onClick={() => void sendMessage("internal")}>
              {sending ? "Saving..." : "Save Internal Note"}
            </button>
          </div>
        </div>
      </div>

      {success ? <p className="status-ok mt-3">{success}</p> : null}
      {error ? <p className="status-bad mt-3">{error}</p> : null}
    </div>
  );
}