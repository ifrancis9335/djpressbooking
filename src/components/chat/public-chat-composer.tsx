"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef } from "react";

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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const resizeTextarea = () => {
    const element = textareaRef.current;
    if (!element) {
      return;
    }

    element.style.height = "auto";
    const nextHeight = Math.min(element.scrollHeight, 140);
    element.style.height = `${Math.max(nextHeight, 52)}px`;
  };

  useEffect(() => {
    resizeTextarea();
  }, [value]);

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
    <form
      onSubmit={submit}
      autoComplete="off"
      className="border-t border-white/10 pt-2"
      style={{ transform: "translateZ(0)" }}
    >
      <input type="text" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />
      <input type="password" style={{ display: "none" }} tabIndex={-1} aria-hidden="true" />
      <label className="sr-only" htmlFor="djpress-ai-input">Ask DJ Press AI assistant</label>
      <textarea
        ref={textareaRef}
        id="djpress-ai-input"
        name="chat_message_input_unique"
        autoFocus={autoFocus && !disabled && !sending}
        rows={1}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          resizeTextarea();
        }}
        onKeyDown={handleKeyDown}
        className="field-input min-h-[52px] max-h-[140px] resize-none overflow-y-auto px-4 py-[14px] text-sm leading-5 [overflow-wrap:anywhere]"
        placeholder={placeholder}
        maxLength={1200}
        disabled={disabled || sending}
        autoComplete="new-password"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        inputMode="none"
        data-form-type="other"
        data-lpignore="true"
        data-1p-ignore="true"
      />
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="min-w-0 flex-1 text-[10px] leading-4 text-slate-400">{helperText}</p>
        <button
          type="submit"
          className="btn-primary h-[52px] min-w-[80px] shrink-0 self-end w-auto px-4 py-2 text-[11px]"
          disabled={disabled || sending || !value.trim()}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </form>
  );
}