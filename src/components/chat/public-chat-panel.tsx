"use client";

import type { PublicSiteData } from "../../types/site-settings";
import type { ChatStatusResponse } from "../../utils/chat-api";
import { cn } from "../../utils/cn";
import { PublicChatComposer } from "./public-chat-composer";
import { PublicChatMessageList, type PublicChatUiMessage } from "./public-chat-message-list";

interface PublicChatPanelProps {
  siteName: string;
  packageTiers: PublicSiteData["packageTiers"];
  status: ChatStatusResponse | null;
  statusLoading: boolean;
  statusError: string | null;
  messages: PublicChatUiMessage[];
  pendingMessage: string;
  sending: boolean;
  sendError: string | null;
  hasAttempt: boolean;
  composerPlaceholder?: string;
  composerHelperText?: string;
  bookingStepQuestion?: string | null;
  onChangeMessage: (value: string) => void;
  onSubmitMessage: () => void;
  onPromptSelect: (message: string) => void;
  onRetry: () => void;
  onClose: () => void;
}

export function PublicChatPanel({
  siteName,
  packageTiers,
  status,
  statusLoading,
  statusError,
  messages,
  pendingMessage,
  sending,
  sendError,
  hasAttempt,
  composerPlaceholder,
  composerHelperText,
  bookingStepQuestion,
  onChangeMessage,
  onSubmitMessage,
  onPromptSelect,
  onRetry,
  onClose
}: PublicChatPanelProps) {
  const packageNames = packageTiers.slice(0, 3).map((tier) => tier.name).join(" · ");
  const chatUnavailable = Boolean(status && !status.enabled);
  const currentError = statusError || sendError || (chatUnavailable ? "The assistant is currently disabled. Use the contact or booking pages for direct help." : null);
  const retryLabel = sendError && hasAttempt ? "Retry Last Message" : "Retry Connection";
  const statusLabel = statusLoading ? "Connecting" : chatUnavailable ? "Disabled" : statusError ? "Unavailable" : "Ready";

  return (
    <section
      id="public-chat-panel"
      aria-label="DJ Press AI assistant"
      className="glass-panel chat-panel-shell relative w-[min(calc(100vw-1.25rem),24rem)] p-2.5 md:w-[23.5rem] md:p-3"
    >
      <button
        type="button"
        onClick={onClose}
        className="focusable absolute right-2.5 top-2.5 z-50 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#0a1424]/92 text-base text-white transition hover:border-luxeBlue/45 hover:bg-luxeBlue/10 md:right-3 md:top-3"
        aria-label="Close assistant"
      >
        ×
      </button>

      <header className="shrink-0 pr-10 md:pr-11">
        <div className="flex items-center gap-2">
          <p className="section-kicker px-2.5 py-0.5 text-[10px]">AI Assistant</p>
          <span
            className={cn(
              "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]",
              chatUnavailable || statusError
                ? "border-rose-400/25 bg-rose-500/10 text-rose-100"
                : statusLoading
                  ? "border-white/15 bg-white/5 text-slate-200"
                  : "border-emerald-400/25 bg-emerald-500/10 text-emerald-100"
            )}
          >
            {statusLabel}
          </span>
        </div>
        <h2 className="mt-1 text-[15px] font-bold text-white md:text-base">Ask {siteName}</h2>
        <p className="mt-0.5 text-xs leading-5 text-slate-300">Booking, dates, packages, and next steps.</p>
        <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-400">{packageNames || "Custom recommendations available"}</p>
      </header>

      {bookingStepQuestion ? (
        <div className="mt-2 shrink-0 rounded-xl border border-luxeBlue/25 bg-luxeBlue/10 px-2.5 py-2">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-sky-200">Current booking step</p>
          <p className="mt-1 text-xs leading-5 text-slate-100">{bookingStepQuestion}</p>
        </div>
      ) : null}

      <div className="mt-2 min-h-0 flex-1 overflow-hidden">
        <PublicChatMessageList messages={messages} sending={sending} onPromptSelect={onPromptSelect} />
      </div>

      {currentError ? (
        <div className="status-bad mt-2 shrink-0 rounded-xl px-2.5 py-2">
          <p className="break-words text-xs leading-5">{currentError}</p>
          {!chatUnavailable ? (
            <button type="button" onClick={onRetry} className="btn-secondary mt-2 w-full text-xs md:w-auto md:px-4">
              {retryLabel}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="mt-2 shrink-0 sticky bottom-0 z-40 bg-slate-950/90 pb-[max(0.25rem,env(safe-area-inset-bottom,0px))]">
        <PublicChatComposer
          value={pendingMessage}
          autoFocus
          disabled={Boolean(statusError) || chatUnavailable}
          sending={sending}
          placeholder={composerPlaceholder}
          helperText={composerHelperText}
          onChange={onChangeMessage}
          onSubmit={onSubmitMessage}
        />
      </div>
    </section>
  );
}