"use client";

import { cn } from "../../utils/cn";

interface PublicChatLauncherProps {
  open: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function PublicChatLauncher({ open, onClick, disabled = false }: PublicChatLauncherProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-expanded={open}
      aria-controls="public-chat-panel"
      className={cn(
        "focusable inline-flex h-[3.65rem] w-[3.65rem] items-center justify-center self-end rounded-full border border-luxeBlue/45 bg-[#08111f]/97 text-white shadow-glow transition duration-200 hover:-translate-y-0.5 hover:border-luxeGold/55 hover:bg-[#0d1a2f] disabled:cursor-not-allowed disabled:opacity-60",
        open && "border-luxeGold/55 bg-[#10203d]"
      )}
    >
      <span className="sr-only">{open ? "Close assistant" : "Open assistant"}</span>
      <span className="text-xs font-extrabold uppercase tracking-[0.18em]">{open ? "×" : "AI"}</span>
    </button>
  );
}