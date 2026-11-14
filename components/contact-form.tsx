"use client";

import { FormEvent, useState } from "react";

export function ContactForm() {
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your message could not be sent.");
      form.reset();
      setMessage("Your message has been sent. We’ll be in touch.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your message could not be sent.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div>
        <p className="eyebrow text-accent">Send a message</p>
        <h2 className="mt-3 font-serif text-3xl">How can we help?</h2>
      </div>
      <label className="block text-sm">
        Your name
        <input name="name" required maxLength={100} className="form-input mt-2" />
      </label>
      <label className="block text-sm">
        Email address
        <input name="email" type="email" required maxLength={254} className="form-input mt-2" />
      </label>
      <label className="block text-sm">
        Message
        <textarea name="message" required maxLength={3000} rows={5} className="form-input mt-2" />
      </label>
      <button type="submit" disabled={pending} className="rounded-full bg-olive px-6 py-3 text-sm font-semibold text-cream disabled:opacity-50">
        {pending ? "Sending…" : "Send message"}
      </button>
      <p aria-live="polite" className="min-h-5 text-sm text-foreground/65">{message}</p>
    </form>
  );
}
