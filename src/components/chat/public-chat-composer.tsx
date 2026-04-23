"use client";

import { FormEvent, KeyboardEvent } from "react";

interface PublicChatComposerProps {
  value: string;
  disabled?: boolean;
  sending?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  helperText?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function PublicChatComposer({
  value,
  disabled = false,
  sending = false,
  autoFocus = false,
  placeholder = "Ask about dates, packages, or the booking process...",
  helperText = "Enter sends. Shift+Enter adds a line.",
  onChange,
  onSubmit
}: PublicChatComposerProps) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <form onSubmit={submit} className="border-t border-white/10 pt-2">
      <label className="sr-only" htmlFor="public-chat-message">Ask DJ Press AI assistant</label>
      <textarea
        id="public-chat-message"
        autoFocus={autoFocus && !disabled && !sending}
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        className="field-input min-h-[42px] max-h-28 resize-none py-2.5 text-sm leading-5"
        placeholder={placeholder}
        maxLength={1200}
        disabled={disabled || sending}
      />
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="min-w-0 text-[10px] text-slate-400">{helperText}</p>
        <button
          type="submit"
          className="btn-primary h-9 shrink-0 w-auto px-3 py-1.5 text-[11px]"
          disabled={disabled || sending || !value.trim()}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </form>
  );
}