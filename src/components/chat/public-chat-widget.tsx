"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { ChatBookingSessionState, ChatConversationTurn } from "../../lib/chat/types";
import type { PublicSiteData } from "../../types/site-settings";
import {
  CHAT_BOOKING_SESSION_STORAGE_KEY,
  fetchChatStatus,
  sendChatMessage,
  type ChatReplyEnvelope,
  type ChatStatusResponse
} from "../../utils/chat-api";
import { PublicChatLauncher } from "./public-chat-launcher";
import { PublicChatPanel } from "./public-chat-panel";
import type { PublicChatUiMessage } from "./public-chat-message-list";

interface PublicChatWidgetProps {
  siteName: string;
  packageTiers: PublicSiteData["packageTiers"];
}

function shouldHideWidget(pathname: string) {
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/booking-reply")) return true;
  if (pathname.startsWith("/booking-history")) return true;

  return pathname === "/booking" || pathname === "/contact" || pathname === "/availability" || pathname === "/find-booking";
}

function buildConversation(messages: PublicChatUiMessage[]): ChatConversationTurn[] {
  return messages.slice(-8).map((message) => ({
    role: message.role,
    content: message.content
  }));
}

function createAssistantMessage(envelope: ChatReplyEnvelope): PublicChatUiMessage {
  return {
    id: `${envelope.requestId}-assistant`,
    role: "assistant",
    content: envelope.reply.message,
    reply: envelope.reply
  };
}

export function PublicChatWidget({ siteName, packageTiers }: PublicChatWidgetProps) {
  const pathname = usePathname();
  const hidden = shouldHideWidget(pathname);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<ChatStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [messages, setMessages] = useState<PublicChatUiMessage[]>([]);
  const [pendingMessage, setPendingMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [lastAttempt, setLastAttempt] = useState<string | null>(null);
  const [bookingSession, setBookingSession] = useState<ChatBookingSessionState>({});

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.sessionStorage.getItem(CHAT_BOOKING_SESSION_STORAGE_KEY);
    if (!stored) {
      return;
    }

    try {
      const parsed = JSON.parse(stored) as ChatBookingSessionState;
      setBookingSession(parsed);
    } catch {
      window.sessionStorage.removeItem(CHAT_BOOKING_SESSION_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (!Object.keys(bookingSession).length) {
      window.sessionStorage.removeItem(CHAT_BOOKING_SESSION_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(CHAT_BOOKING_SESSION_STORAGE_KEY, JSON.stringify(bookingSession));
  }, [bookingSession]);

  useEffect(() => {
    if (hidden) {
      setOpen(false);
      return;
    }

    let active = true;
    setStatusLoading(true);
    setStatusError(null);

    fetchChatStatus()
      .then((payload) => {
        if (!active) return;
        setStatus(payload);
      })
      .catch((error) => {
        if (!active) return;
        setStatusError(error instanceof Error ? error.message : "Unable to connect to the assistant.");
      })
      .finally(() => {
        if (!active) return;
        setStatusLoading(false);
      });

    return () => {
      active = false;
    };
  }, [hidden, pathname]);

  const submitMessage = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || sending) {
      return;
    }

    const userMessage: PublicChatUiMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content: trimmed
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setPendingMessage("");
    setSending(true);
    setSendError(null);
    setLastAttempt(trimmed);

    try {
      const envelope = await sendChatMessage({
        message: trimmed,
        conversation: buildConversation(nextMessages),
        context: {
          page: pathname,
          eventDate: bookingSession.date,
          packageId: bookingSession.packageId,
          bookingFlow: bookingSession
        }
      });

      setBookingSession(envelope.reply.bookingAssistant?.collected || {});
      setMessages((current) => [...current, createAssistantMessage(envelope)]);
    } catch (error) {
      setMessages((current) => current.filter((item) => item.id !== userMessage.id));
      setPendingMessage(trimmed);
      setSendError(error instanceof Error ? error.message : "Unable to reach the assistant right now.");
    } finally {
      setSending(false);
    }
  };

  const retry = () => {
    if (sendError && lastAttempt?.trim()) {
      void submitMessage(lastAttempt);
      return;
    }

    setStatusLoading(true);
    setStatusError(null);
    fetchChatStatus()
      .then((payload) => setStatus(payload))
      .catch((error) => setStatusError(error instanceof Error ? error.message : "Unable to connect to the assistant."))
      .finally(() => setStatusLoading(false));
  };

  const handlePromptSelect = (message: string) => {
    setOpen(true);
    void submitMessage(message);
  };

  const activeBookingReply = useMemo(() => {
    return [...messages]
      .reverse()
      .find((message) => message.role === "assistant" && message.reply?.bookingAssistant)?.reply?.bookingAssistant;
  }, [messages]);

  const composerPlaceholder = useMemo(() => {
    switch (activeBookingReply?.nextField) {
      case "eventType":
        return "Wedding, birthday, corporate event...";
      case "date":
        return "2026-10-12 or 10/12/2026";
      case "location":
        return "City, venue, or area";
      case "guestCount":
        return "Approximate guest count";
      default:
        return "Ask about dates, packages, pricing, or the booking process...";
    }
  }, [activeBookingReply?.nextField]);

  const composerHelperText = activeBookingReply?.readyForBooking
    ? "Your booking details are ready. You can still add context or use the booking button below."
    : activeBookingReply?.nextQuestion
      ? "Answer this step, then press Enter to continue."
      : "Enter sends. Shift+Enter adds a line.";

  const shellRef = useRef<HTMLDivElement>(null);

  // Visual Viewport API: keep sheet/composer above iOS keyboard and toolbar changes
  useEffect(() => {
    const shell = shellRef.current;
    const vv = typeof window !== "undefined" ? (window.visualViewport ?? null) : null;
    if (!shell || !vv || !open) {
      if (shell) {
        shell.style.removeProperty("--keyboard-height");
        shell.style.removeProperty("--vp-height");
      }
      return;
    }

    const update = () => {
      const keyboardOffset = Math.max(0, window.innerHeight - (vv.height + vv.offsetTop));
      shell.style.setProperty("--keyboard-height", `${keyboardOffset}px`);
      shell.style.setProperty("--vp-height", `${vv.height}px`);
    };

    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    update();

    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      shell.style.removeProperty("--keyboard-height");
      shell.style.removeProperty("--vp-height");
    };
  }, [open]);

  if (hidden) {
    return null;
  }

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close assistant"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[9998] bg-[rgba(0,0,0,0.6)] backdrop-blur-[3px] md:hidden"
        />
      ) : null}
      <div ref={shellRef} className={`chat-widget-shell fixed z-50 flex flex-col items-end gap-3 ${open ? "is-open" : ""}`}>
        {open ? (
          <PublicChatPanel
            siteName={siteName}
            packageTiers={packageTiers}
            status={status}
            statusLoading={statusLoading}
            statusError={statusError}
            messages={messages}
            pendingMessage={pendingMessage}
            sending={sending}
            sendError={sendError}
            hasAttempt={Boolean(lastAttempt?.trim())}
            composerPlaceholder={composerPlaceholder}
            composerHelperText={composerHelperText}
            bookingStepQuestion={activeBookingReply?.nextQuestion || null}
            onChangeMessage={setPendingMessage}
            onSubmitMessage={() => void submitMessage(pendingMessage)}
            onPromptSelect={handlePromptSelect}
            onRetry={retry}
            onClose={() => setOpen(false)}
          />
        ) : null}
        {!open ? <PublicChatLauncher open={open} onClick={() => setOpen(true)} className="mobile-utility-ai" /> : null}
      </div>
    </>
  );
}