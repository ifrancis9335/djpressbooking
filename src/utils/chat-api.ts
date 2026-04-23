import type { ChatBookingSessionState, ChatConversationTurn, ChatSupportResponse } from "../lib/chat/types";

export const CHAT_BOOKING_SESSION_STORAGE_KEY = "public-chat-booking-session";
export const CHAT_BOOKING_PREFILL_STORAGE_KEY = "public-chat-booking-prefill";

export interface ChatStatusResponse {
  enabled: boolean;
  provider: string;
  providerConfigured: boolean;
  bookingEnabled: boolean;
}

export interface ChatReplyEnvelope {
  reply: ChatSupportResponse;
  requestId: string;
}

interface SendChatMessageInput {
  message: string;
  conversation?: ChatConversationTurn[];
  context?: {
    page?: string;
    eventDate?: string;
    packageId?: string;
    bookingFlow?: ChatBookingSessionState;
  };
}

const CHAT_TIMEOUT_MS = 15000;

function createTimeoutController(timeoutMs: number) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  return {
    controller,
    dispose: () => window.clearTimeout(timeoutId)
  };
}

async function parseSafeJson<T>(response: Response): Promise<T | null> {
  return (await response.json().catch(() => null)) as T | null;
}

function mapChatError(response: Response, payload?: { message?: string } | null) {
  if (response.status === 400) {
    return "Please enter a valid message before sending.";
  }

  if (response.status === 429) {
    return payload?.message || "Too many chat requests right now. Please wait a moment and try again.";
  }

  if (response.status === 503) {
    return payload?.message || "The assistant is temporarily unavailable.";
  }

  return "The assistant could not respond right now. Please try again shortly.";
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit, timeoutMs = CHAT_TIMEOUT_MS): Promise<T> {
  const { controller, dispose } = createTimeoutController(timeoutMs);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
      cache: "no-store"
    });
    const payload = await parseSafeJson<T & { message?: string }>(response);

    if (!response.ok) {
      throw new Error(mapChatError(response, payload));
    }

    if (!payload) {
      throw new Error("The assistant returned an empty response.");
    }

    return payload;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The assistant took too long to respond. Please try again.");
    }

    throw error instanceof Error ? error : new Error("Unable to reach the assistant right now.");
  } finally {
    dispose();
  }
}

export async function fetchChatStatus() {
  return fetchJson<ChatStatusResponse>("/api/chat", { method: "GET" }, 8000);
}

export async function sendChatMessage(input: SendChatMessageInput) {
  return fetchJson<ChatReplyEnvelope>(
    "/api/chat",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: input.message.trim(),
        conversation: input.conversation ?? [],
        context: input.context
      })
    },
    CHAT_TIMEOUT_MS
  );
}