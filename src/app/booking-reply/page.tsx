import { Metadata } from "next";
import { verifyBookingReplyToken, listCustomerBookingMessages } from "../../lib/booking-threads";
import { getPublicSiteData } from "../../lib/site-settings";
import { BookingReplyChat } from "../../components/forms/booking-reply-chat";

export const metadata: Metadata = {
  title: "Booking Reply",
  description: "Secure customer reply page for DJ Press booking conversations."
};

function maskBookingId(id: string) {
  const trimmed = id.trim();
  if (trimmed.length <= 8) {
    return trimmed;
  }

  return `${trimmed.slice(0, 4)}...${trimmed.slice(-4)}`;
}

interface BookingReplyPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function BookingReplyPage({ searchParams }: BookingReplyPageProps) {
  const { siteContact } = await getPublicSiteData();
  const params = await searchParams;
  const token = params.token?.trim() || "";

  if (!token) {
    return (
      <main className="section-shell">
        <div className="container-width">
          <section className="glass-panel p-5 md:p-6">
            <h1 className="text-2xl font-bold text-white">Reply Link Required</h1>
            <p className="mt-3 text-slate-300">A valid secure reply link is required to access this booking conversation.</p>
          </section>
        </div>
      </main>
    );
  }

  try {
    const { booking } = await verifyBookingReplyToken(token);
    const messages = await listCustomerBookingMessages(booking.id);

    return (
      <main className="section-shell">
        <div className="container-width grid gap-5">
          <section className="glass-panel p-5 md:p-6">
            <p className="inline-flex rounded-full border border-luxeBlue/40 bg-luxeBlue/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-luxeBlue">
              Secure Booking Thread
            </p>
            <h1 className="mt-4 text-3xl font-bold text-white">Reply About Your Booking</h1>
            <p className="mt-2 text-slate-300">Booking reference: {maskBookingId(booking.id)}</p>
            <p className="mt-1 text-slate-300">Event date: {booking.eventDate}</p>
            <p className="mt-1 text-slate-300">Need direct help? <a className="font-semibold text-luxeGold" href={siteContact.phoneHref}>{siteContact.phone}</a></p>
          </section>

          <BookingReplyChat token={token} initialMessages={messages} />
        </div>
      </main>
    );
  } catch (error) {
    return (
      <main className="section-shell">
        <div className="container-width">
          <section className="glass-panel p-5 md:p-6">
            <h1 className="text-2xl font-bold text-white">Reply Link Invalid</h1>
            <p className="mt-3 text-slate-300">{error instanceof Error ? error.message : "Unable to verify this reply link."}</p>
          </section>
        </div>
      </main>
    );
  }
}