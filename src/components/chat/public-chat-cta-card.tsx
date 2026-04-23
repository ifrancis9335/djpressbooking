"use client";

import Link from "next/link";
import type { ChatBookingPrefill, ChatSupportResponse } from "../../lib/chat/types";
import { CHAT_BOOKING_PREFILL_STORAGE_KEY } from "../../utils/chat-api";

interface PublicChatCtaCardProps {
  reply: ChatSupportResponse;
}

function resolveAction(reply: ChatSupportResponse) {
  if (reply.bookingAssistant?.readyForBooking) {
    const params = new URLSearchParams();
    const prefill = reply.bookingAssistant.prefill;

    params.set("assistant", "1");
    if (prefill.date) params.set("date", prefill.date);
    if (prefill.packageId) params.set("package", prefill.packageId);
    if (prefill.eventType) params.set("eventType", prefill.eventType);

    return {
      href: `/booking?${params.toString()}`,
      label: "Secure Your Date",
      copy: "You're ready to book — click below to secure your date"
    };
  }

  switch (reply.recommendedAction) {
    case "book_now":
      return {
        href: "/booking",
        label: "Book Now",
        copy: "Start a real booking inquiry with your preferred date and event details."
      };
    case "view_packages":
      return {
        href: "/packages",
        label: "View Packages",
        copy: "Compare package levels and pricing before starting your inquiry."
      };
    case "check_availability":
      return {
        href: "/availability",
        label: "Check Availability",
        copy: "Open the live availability calendar to review your event date."
      };
    case "contact_admin":
      return {
        href: "/contact",
        label: "Contact Team",
        copy: "Use the contact page if you need a direct follow-up from the booking team."
      };
    default:
      return null;
  }
}

function persistBookingPrefill(prefill: ChatBookingPrefill) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(CHAT_BOOKING_PREFILL_STORAGE_KEY, JSON.stringify(prefill));
}

export function PublicChatCtaCard({ reply }: PublicChatCtaCardProps) {
  const action = resolveAction(reply);
  const bookingAssistant = reply.bookingAssistant;

  if (!action) {
    return null;
  }

  const handleClick = () => {
    if (bookingAssistant?.readyForBooking) {
      persistBookingPrefill(bookingAssistant.prefill);
    }
  };

  return (
    <div className="rounded-2xl border border-luxeBlue/30 bg-luxeBlue/10 p-2.5">
      <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-sky-200">Recommended Next Step</p>
      <p className="mt-1 text-xs leading-5 text-slate-100">{action.copy}</p>
      {bookingAssistant?.summary.length ? (
        <ul className="mt-1.5 space-y-1 text-[11px] text-slate-200">
          {bookingAssistant.summary.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      <Link href={action.href} onClick={handleClick} className="btn-secondary mt-2 h-9 w-full px-3 py-1.5 text-[11px] md:w-auto md:px-4">
        {action.label}
      </Link>
    </div>
  );
}