import Link from "next/link";
import { Metadata } from "next";
import { getPublicSiteData } from "../../lib/site-settings";
import { verifyBookingReplyToken } from "../../lib/booking-threads";

function getBookingStatusLabel(status: string) {
  switch (status) {
    case "awaiting_response":
      return "Awaiting Response";
    case "pending_deposit":
      return "Reviewed - Deposit Pending";
    case "confirmed":
      return "Confirmed";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Declined / Cancelled";
    case "new":
      return "New";
    default:
      return "In Review";
  }
}

export const metadata: Metadata = {
  title: "Thank You",
  description: "Booking inquiry success confirmation for DJ Press International."
};

export default async function ThankYouPage({
  searchParams
}: {
  searchParams: Promise<{ bookingId?: string; date?: string; package?: string; token?: string }>;
}) {
  const { packageTiers } = await getPublicSiteData();
  const params = await searchParams;
  const token = params.token?.trim() || "";

  let verifiedBooking:
    | {
      id: string;
      eventDate: string;
      packageId?: string;
      status: string;
    }
    | null = null;

  if (token) {
    try {
      const { booking } = await verifyBookingReplyToken(token);
      verifiedBooking = {
        id: booking.id,
        eventDate: booking.eventDate,
        packageId: booking.packageId,
        status: booking.status
      };
    } catch {
      verifiedBooking = null;
    }
  }

  const bookingId = verifiedBooking?.id || params.bookingId || "Pending Assignment";
  const selectedDate = verifiedBooking?.eventDate || params.date || "Date pending confirmation";
  const packageId = verifiedBooking?.packageId || params.package;
  const selectedPackage = packageId
    ? packageTiers.find((tier) => tier.id === packageId)?.name || packageId
    : "Not selected";
  const bookingStatus = verifiedBooking?.status ? getBookingStatusLabel(verifiedBooking.status) : "Awaiting Response";
  const bookingChatHref = token ? `/booking-reply?token=${encodeURIComponent(token)}` : null;

  return (
    <main className="section-shell">
      <div className="container-width">
        <section className="cta-cinematic">
          <p className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300">
            Inquiry Received
          </p>
          <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">Thank You for Booking DJ Press International</h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Your inquiry has been received and is under review. Expect a response with availability details and next steps within 24 hours.
          </p>
          <p className="mt-4 text-sm font-semibold text-luxeBlue">Reference ID: {bookingId}</p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <article className="stat-pill">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Selected Date</h2>
              <p className="mt-1 text-sm text-slate-200">{selectedDate}</p>
            </article>
            <article className="stat-pill">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Selected Package</h2>
              <p className="mt-1 text-sm text-slate-200">{selectedPackage}</p>
            </article>
            <article className="stat-pill md:col-span-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Booking Status</h2>
              <p className="mt-1 text-sm text-slate-200">{bookingStatus}</p>
            </article>
          </div>

          <p className="mt-4 text-sm text-slate-300">Messages from the booking team will appear in your private booking chat.</p>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <article className="stat-pill"><h2 className="text-sm font-bold uppercase tracking-wider text-white">Step 1</h2><p>Inquiry reviewed by the booking team.</p></article>
            <article className="stat-pill"><h2 className="text-sm font-bold uppercase tracking-wider text-white">Step 2</h2><p>Availability and package recommendation delivered.</p></article>
            <article className="stat-pill"><h2 className="text-sm font-bold uppercase tracking-wider text-white">Step 3</h2><p>Date secured with finalized booking confirmation.</p></article>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {bookingChatHref ? <Link href={bookingChatHref} className="btn-primary">Open Booking Chat</Link> : null}
            <Link href="/" className="btn-primary">Return Home</Link>
            <Link href="/contact" className="btn-secondary">Contact Team</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
