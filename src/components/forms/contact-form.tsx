"use client";

import { useState } from "react";
import { parseJson } from "../../utils/api";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [status, setStatus] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  function validateClient() {
    const nextErrors: { name?: string; email?: string; message?: string } = {};
    if (!form.name.trim()) nextErrors.name = "Name is required";
    if (!form.email.trim()) nextErrors.email = "Email is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = "Enter a valid email";
    if (!form.message.trim()) nextErrors.message = "Message is required";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateClient()) {
      setStatus({ kind: "bad", text: "Please fix highlighted fields." });
      return;
    }
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });

      await parseJson(response);
      setStatus({ kind: "ok", text: "Message sent successfully. We will respond within 24 hours." });
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      setStatus({ kind: "bad", text: error instanceof Error ? error.message : "Unable to send message." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass-panel p-5 md:p-7">
      <div className="field">
        <label className="field-label" htmlFor="name">Name</label>
        <input id="name" autoComplete="name" aria-invalid={Boolean(errors.name)} className={`field-input ${errors.name ? "field-input-invalid" : ""}`} value={form.name} onChange={(e) => { setForm((p) => ({ ...p, name: e.target.value })); setErrors((prev) => ({ ...prev, name: undefined })); }} required />
        <p className="error-text">{errors.name ?? ""}</p>
      </div>
      <div className="field mt-4">
        <label className="field-label" htmlFor="email">Email</label>
        <input id="email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} className={`field-input ${errors.email ? "field-input-invalid" : ""}`} value={form.email} onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); setErrors((prev) => ({ ...prev, email: undefined })); }} required />
        <p className="error-text">{errors.email ?? ""}</p>
      </div>
      <div className="field mt-4">
        <label className="field-label" htmlFor="message">Message</label>
        <textarea id="message" rows={6} aria-invalid={Boolean(errors.message)} className={`field-input ${errors.message ? "field-input-invalid" : ""}`} value={form.message} onChange={(e) => { setForm((p) => ({ ...p, message: e.target.value })); setErrors((prev) => ({ ...prev, message: undefined })); }} required />
        <p className="error-text">{errors.message ?? ""}</p>
      </div>
      {status ? <p className={`mt-4 ${status.kind === "ok" ? "status-ok" : "status-bad"}`}>{status.text}</p> : null}
      <button type="submit" className="btn-primary mt-5 disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>
        {loading ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
