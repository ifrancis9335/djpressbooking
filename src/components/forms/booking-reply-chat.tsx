"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookingMessage } from "../../types/booking-thread";

type PublicBookingMessage = Omit<BookingMessage, "bookingId">;

interface BookingReplyChatProps {
  token: string;
  initialMessages: PublicBookingMessage[];
}

interface ThreadPayload {
  messages: PublicBookingMessage[];
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as T | { message?: string } | null;
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "message" in payload ? payload.message : undefined;
    throw new Error(message || "Request failed");
  }
  return payload as T;
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

export function BookingReplyChat({ token, initialMessages }: BookingReplyChatProps) {
  const [messages, setMessages] = useState<PublicBookingMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const latestMessagePreview = useMemo(() => {
    if (messages.length === 0) {
      return "No messages yet.";
    }

    const latest = messages[messages.length - 1];
    return `${latest.senderType === "admin" ? "DJ Press" : "You"}: ${latest.body.slice(0, 72)}${latest.body.length > 72 ? "..." : ""}`;
  }, [messages]);

  const loadMessages = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (silent) {
      setPolling(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(`/api/bookings/reply?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      const payload = await parseResponse<ThreadPayload>(response);
      setMessages(payload.messages || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load conversation");
    } finally {
      setLoading(false);
      setPolling(false);
    }
  }, [token]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void loadMessages({ silent: true });
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadMessages]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages.length]);

  const sendReply = async () => {
    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/bookings/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, body: draft })
      });
      await parseResponse<{ message: string }>(response);
      setDraft("");
      setSuccess("Reply sent");
      await loadMessages({ silent: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to send reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="glass-panel p-5 md:p-6">
      <h2 className="text-xl font-bold text-white">Conversation</h2>
      <p className="mt-2 text-sm text-slate-300">{latestMessagePreview}</p>
      <p className="mt-1 text-xs text-slate-500">{polling ? "Checking for new messages..." : "Auto-refreshing every 5s"}</p>

      <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/20">
        <div ref={scrollContainerRef} className="max-h-[380px] min-h-[260px] overflow-y-auto p-3">
          {loading ? <p className="text-sm text-slate-300">Loading conversation...</p> : null}
          {!loading && messages.length === 0 ? <p className="text-sm text-slate-400">No messages yet.</p> : null}
          <div className="grid gap-2">
            {messages.map((message) => {
              const isCustomer = message.senderType === "customer";
              const isAdmin = message.senderType === "admin";
              return (
                <article key={message.id} className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow ${
                      isCustomer
                        ? "bg-emerald-600/80 text-white"
                        : isAdmin
                          ? "bg-luxeBlue/80 text-white"
                          : "bg-white/10 text-slate-100"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.body}</p>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-white/80">{formatTimestamp(message.timestamp)}</div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-white/10 bg-slate-950/95 p-3">
          <label className="field">
            <span className="field-label">Send Reply</span>
            <textarea
              className="field-input min-h-[84px]"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type your message..."
            />
          </label>
          <button type="button" className="btn-primary mt-2 md:w-auto" disabled={sending} onClick={() => void sendReply()}>
            {sending ? "Sending..." : "Send Reply"}
          </button>
        </div>
      </div>

      {success ? <p className="status-ok mt-3">{success}</p> : null}
      {error ? <p className="status-bad mt-3">{error}</p> : null}
    </section>
  );
}
