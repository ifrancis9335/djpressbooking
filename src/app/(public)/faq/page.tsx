import { Metadata } from "next";
import Link from "next/link";
import { faqs } from "../../../data/catalog";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Booking FAQs covering deposits, travel, setup, requests, policies, and equipment."
};

export default function FaqPage() {
  return (
    <div className="page-container">
      <div className="container-width">
        <p className="section-kicker">Booking Questions</p>
        <h1 className="text-3xl font-bold text-white md:text-4xl">FAQ</h1>
        <p className="mt-3 max-w-3xl text-slate-300">Answers to common booking questions for smooth event planning.</p>
        <div className="mt-6 space-y-3">
          {faqs.map((item) => (
            <details key={item.question} className="glass-panel p-4">
              <summary className="cursor-pointer text-base font-bold text-white">{item.question}</summary>
              <p className="mt-3 text-sm text-slate-300">{item.answer}</p>
            </details>
          ))}
        </div>
        <div className="cta-rhythm">
          <Link href="/booking" className="btn-primary">Start Booking Inquiry</Link>
          <Link href="/contact" className="btn-secondary">Contact Team</Link>
        </div>
      </div>
    </div>
  );
}
