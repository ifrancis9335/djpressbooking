"use client";

import type { ChatIntent } from "../../lib/chat/types";
import { cn } from "../../utils/cn";

interface PublicChatMessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  intent?: ChatIntent;
}

function formatIntent(intent?: ChatIntent) {
  if (!intent) return "Assistant";
  return intent.replace(/_/g, " ");
}

export function PublicChatMessageBubble({ role, content, intent }: PublicChatMessageBubbleProps) {
  const assistant = role === "assistant";

  return (
    <article className={cn("flex", assistant ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[92%] min-w-0 rounded-2xl border px-3 py-2.5 text-sm shadow-panel",
          assistant
            ? "border-luxeBlue/25 bg-gradient-to-br from-[#0b1526] to-[#122642] text-slate-50"
            : "border-luxeBlue/40 bg-gradient-to-br from-[#15345d] to-[#0d1b33] text-white"
        )}
      >
        <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-300">{assistant ? formatIntent(intent) : "You"}</p>
        <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-[13px] leading-5 text-inherit">{content}</p>
      </div>
    </article>
  );
}