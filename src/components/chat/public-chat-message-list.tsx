"use client";

import { useEffect, useRef } from "react";
import type { ChatSupportResponse } from "../../lib/chat/types";
import { PublicChatCtaCard } from "./public-chat-cta-card";
import { PublicChatMessageBubble } from "./public-chat-message-bubble";

export interface PublicChatUiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  reply?: ChatSupportResponse;
}

interface PublicChatMessageListProps {
  messages: PublicChatUiMessage[];
  sending: boolean;
  onPromptSelect: (message: string) => void;
}

const starterPrompts = [
  "I need a DJ for my wedding.",
  "Can you help me book my event date?",
  "How much do DJ packages cost?"
];

export function PublicChatMessageList({ messages, sending, onPromptSelect }: PublicChatMessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    if (isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, sending]);

  return (
    <div ref={containerRef} className="chat-scroll-area flex h-full min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1 pb-[80px]">
      {messages.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-2.5">
          <p className="text-sm font-semibold text-white">Ask about packages, pricing, availability, or start your booking.</p>
          <p className="mt-1 text-sm leading-5 text-slate-300">The assistant can collect event details one step at a time, then send you to booking.</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => onPromptSelect(prompt)}
                className="focusable rounded-full border border-white/15 bg-white/5 px-2 py-1 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-slate-200 transition hover:border-luxeBlue/45 hover:bg-luxeBlue/10"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {messages.map((message, index) => {
        const isLast = index === messages.length - 1;
        return (
          <div key={message.id} className="flex flex-col gap-2.5">
            <PublicChatMessageBubble
              role={message.role}
              content={message.content}
              intent={message.reply?.intent}
            />
            {isLast && message.role === "assistant" && message.reply ? <PublicChatCtaCard reply={message.reply} /> : null}
          </div>
        );
      })}

      {sending ? (
        <div className="flex justify-start">
          <div className="rounded-2xl border border-white/10 bg-slate-900/90 px-3 py-2 text-sm text-slate-300 shadow-panel">
            Assistant is thinking...
          </div>
        </div>
      ) : null}

      <div ref={bottomAnchorRef} className="h-px w-full" aria-hidden="true" />
    </div>
  );
}