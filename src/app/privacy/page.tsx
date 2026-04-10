import { Metadata } from "next";
import { getPublicSiteData } from "../../lib/site-settings";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for DJ Press International booking and contact platform."
};

export default async function PrivacyPage() {
  const { siteContact } = await getPublicSiteData();

  return (
    <main className="section-shell">
      <div className="container-width">
        <section className="premium-card">
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          <p className="mt-3 text-sm text-slate-400">Effective date: April 8, 2026</p>
          <p className="mt-3 text-slate-300">
            DJ Press International collects inquiry details only to coordinate event communication, scheduling, and service delivery.
          </p>
          <p className="mt-3 text-slate-300">
            Data is never sold and is only accessed for event operations and client support.
          </p>
          <p className="mt-3 text-slate-300">
            Contact and booking records may be retained for scheduling history, accounting support, and customer service follow-up.
          </p>
          <p className="mt-3 text-slate-300">
            You may request correction or deletion of your personal information, subject to contractual and recordkeeping obligations.
          </p>
          <p className="mt-3 text-slate-300">
            Privacy questions can be sent to {siteContact.email}.
          </p>
        </section>
      </div>
    </main>
  );
}
