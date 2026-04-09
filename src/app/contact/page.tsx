import { Metadata } from "next";
import { ContactForm } from "../../components/forms/contact-form";
import { siteContact } from "../../data/catalog";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact DJ Press International for booking and event consultation."
};

export default function ContactPage() {
  return (
    <main className="section-shell">
      <div className="container-width grid gap-6 md:grid-cols-2">
        <section className="premium-card">
          <p className="section-kicker">Direct Support</p>
          <h1 className="text-3xl font-bold text-white md:text-4xl">Contact DJ Press International</h1>
          <p className="mt-3 text-slate-300">Questions before booking? Send your details and receive a response {siteContact.responseWindow.toLowerCase()}.</p>
          <p className="mt-4 text-sm text-slate-200">
            Email: <a href={`mailto:${siteContact.email}`} className="font-bold text-luxeGold">{siteContact.email}</a>
          </p>
          <p className="mt-2 text-sm text-slate-300">Service Area: {siteContact.serviceArea}</p>
        </section>
        <ContactForm />
      </div>
    </main>
  );
}
