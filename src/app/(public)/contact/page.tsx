import Link from "next/link";
import { Metadata } from "next";
import { ContactForm } from "../../../components/forms/contact-form";
import { getPublicSiteData } from "../../../lib/site-settings";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact DJ Press International for booking and event consultation."
};

export default async function ContactPage() {
  const { siteContact } = await getPublicSiteData();

  return (
    <div className="page-container">
      <div className="container-width grid gap-5 md:grid-cols-2 md:gap-6">
        <section className="premium-card p-5 md:p-7">
          <p className="section-kicker">Direct Support</p>
          <h1 className="text-3xl font-bold text-white md:text-4xl">Contact DJ Press International</h1>
          <p className="mt-3 text-slate-300">Questions before booking? Send your details and receive a response {siteContact.responseWindow.toLowerCase()}.</p>
          <div className="mt-4 grid gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            <p>
              Email: <a href={`mailto:${siteContact.email}`} className="font-bold text-luxeGold">{siteContact.email}</a>
            </p>
            <p>
              Phone: <a href={siteContact.phoneHref} className="font-bold text-luxeGold">{siteContact.phone}</a>
            </p>
            <p className="text-slate-300">Service Area: {siteContact.serviceArea}</p>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <a href={siteContact.phoneHref} className="btn-secondary">Call Now</a>
            <Link href="/booking" className="btn-primary">Start Booking Inquiry</Link>
          </div>
        </section>
        <ContactForm />
      </div>
    </div>
  );
}
