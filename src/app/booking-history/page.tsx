import Link from "next/link";
import { Metadata } from "next";
import { getPublicSiteData } from "../../lib/site-settings";
import { listCustomerBookingHistory, verifyCustomerHistoryToken } from "../../lib/customer-access";
import { buildBookingReplyToken } from "../../lib/booking-threads";

export const metadata: Metadata = {
  title: "Booking History",
  description: "Verified customer booking history and private chat access for DJ Press bookings."
};

function getStatusLabel(status: string) {
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

interface BookingHistoryPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function BookingHistoryPage({ searchParams }: BookingHistoryPageProps) {
  const params = await searchParams;
  const token = params.token?.trim() || "";

  if (!token) {
    return (
      <main className="section-shell">
        <div className="container-width">
          <section className="glass-panel p-5 md:p-6">
            <h1 className="text-2xl font-bold text-white">History Link Required</h1>
            <p className="mt-3 text-slate-300">Use a valid secure history link from your booking email.</p>
          </section>
        </div>
      </main>
    );
  }

  try {
    const verified = verifyCustomerHistoryToken(token);
    const [{ packageTiers }, items] = await Promise.all([
      getPublicSiteData(),
      listCustomerBookingHistory(verified.email)
    ]);

    const packageMap = new Map(packageTiers.map((tier) => [tier.id.toLowerCase(), tier.name]));

    return (
      <main className="section-shell">
        <div className="container-width grid gap-5">
          <section className="glass-panel p-5 md:p-6">
            <p className="inline-flex rounded-full border border-luxeBlue/40 bg-luxeBlue/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-luxeBlue">
              Verified Customer Access
            </p>
            <h1 className="mt-4 text-3xl font-bold text-white">Your Booking History</h1>
            <p className="mt-2 text-slate-300">Email verified: {verified.email}</p>
            <p className="mt-2 text-sm text-slate-300">Use Booking History to reopen your booking, read updates, and reply to the booking team.</p>
          </section>

          <section className="grid gap-4">
            {items.length === 0 ? (
              <article className="glass-panel p-5 md:p-6">
                <p className="text-slate-300">No bookings were found for this verified email.</p>
                <Link href="/find-booking" className="btn-secondary mt-4 inline-flex">Find My Booking</Link>
              </article>
            ) : (
              items.map((item) => {
                const packageLabel = item.booking.packageId
                  ? packageMap.get(item.booking.packageId.toLowerCase()) || item.booking.packageId
                  : "Not selected";
                const chatToken = buildBookingReplyToken(item.booking);
                const chatHref = `/booking-reply?token=${encodeURIComponent(chatToken)}`;

                return (
                  <article key={item.booking.id} className="glass-panel p-5 md:p-6">
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      <p className="text-slate-300"><span className="font-semibold text-white">Booking ID:</span> {item.booking.id}</p>
                      <p className="text-slate-300"><span className="font-semibold text-white">Event Date:</span> {item.booking.eventDate}</p>
                      <p className="text-slate-300"><span className="font-semibold text-white">Event Type:</span> {item.booking.eventType}</p>
                      <p className="text-slate-300"><span className="font-semibold text-white">Status:</span> {getStatusLabel(item.booking.status)}</p>
                      <p className="text-slate-300"><span className="font-semibold text-white">Package:</span> {packageLabel}</p>
                      <p className="text-slate-300"><span className="font-semibold text-white">Last Message:</span> {item.latestMessageSender === "admin" ? "DJ Press" : item.latestMessageSender === "customer" ? "You" : "System"}</p>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{item.latestMessageBody}</p>
                    <div className="mt-4">
                      <Link href={chatHref} className="btn-primary inline-flex">Open Chat</Link>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        </div>
      </main>
    );
  } catch (error) {
    return (
      <main className="section-shell">
        <div className="container-width">
          <section className="glass-panel p-5 md:p-6">
            <h1 className="text-2xl font-bold text-white">History Link Invalid</h1>
            <p className="mt-3 text-slate-300">{error instanceof Error ? error.message : "Unable to verify this history link."}</p>
          </section>
        </div>
      </main>
    );
  }
}
