"use client";

import { type FormEvent, useEffect, useState } from "react";
import { restaurantConfig } from "@/lib/restaurant-config";

type Availability = { slots: string[] };
type BookingConfirmation = {
  reference: string;
  status: string;
  startsAt: string;
};

function localDate(offsetDays: number) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ReservationForm() {
  const [date, setDate] = useState(localDate(2));
  const [partySize, setPartySize] = useState(2);
  const [slots, setSlots] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/reservations/availability?date=${encodeURIComponent(date)}&partySize=${partySize}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not check availability.");
        setSlots((result as Availability).slots);
      })
      .catch((availabilityError: unknown) => {
        if (availabilityError instanceof Error && availabilityError.name !== "AbortError") {
          setError(availabilityError.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingSlots(false);
      });
    return () => controller.abort();
  }, [date, partySize]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData);
    payload.date = date;
    payload.time = time;
    payload.partySize = String(partySize);

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, partySize }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Your reservation could not be completed.");
      setConfirmation(result as BookingConfirmation);
      form.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Your reservation could not be completed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div role="status" className="rounded-3xl border border-border bg-card p-8 sm:p-12">
        <p className="eyebrow text-accent">Request received</p>
        <h2 className="mt-4 font-serif text-4xl">Thank you. We’ll be in touch.</h2>
        <p className="mt-4 leading-7 text-foreground/70">
          Your request for {date} at {time} is pending restaurant confirmation.
          Keep this booking reference for your records:
        </p>
        <p className="mt-5 inline-block rounded-xl bg-muted px-5 py-3 font-mono text-lg font-semibold tracking-wider">
          {confirmation.reference}
        </p>
        <p className="mt-5 text-sm text-foreground/60">
          This is a request, not a confirmed booking. Contact details and
          confirmation emails will be enabled once the restaurant configures them.
        </p>
        <button onClick={() => setConfirmation(null)} className="mt-7 text-sm font-semibold text-accent underline underline-offset-4">
          Make another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl border border-border bg-card p-6 sm:p-9">
      <div>
        <p className="eyebrow text-accent">Your visit</p>
        <h2 className="mt-3 font-serif text-3xl">Request a table</h2>
        <p className="mt-3 text-sm leading-6 text-foreground/65">
          Choose a date and party size to see times configured by the restaurant.
        </p>
      </div>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <label className="block text-sm">
          Date
          <input
            name="date"
            type="date"
            min={localDate(1)}
            max={localDate(restaurantConfig.reservation.maximumAdvanceDays)}
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
              setLoadingSlots(true);
              setSlots([]);
              setTime("");
              setError("");
            }}
            required
            className="form-input mt-2"
          />
        </label>
        <label className="block text-sm">
          Guests
          <select
            value={partySize}
            onChange={(event) => {
              setPartySize(Number(event.target.value));
              setLoadingSlots(true);
              setSlots([]);
              setTime("");
              setError("");
            }}
            className="form-input mt-2"
          >
            {Array.from({ length: restaurantConfig.reservation.maxPartySize }, (_, index) => index + 1).map((count) => (
              <option key={count} value={count}>{count} {count === 1 ? "guest" : "guests"}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          Available time
          <select
            value={time}
            onChange={(event) => setTime(event.target.value)}
            required
            disabled={loadingSlots || slots.length === 0}
            className="form-input mt-2"
          >
            <option value="">
              {loadingSlots ? "Checking times…" : slots.length ? "Select a time" : "No available times"}
            </option>
            {slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
          </select>
          {!loadingSlots && slots.length === 0 && (
            <span className="mt-2 block text-xs text-foreground/55">
              No times are configured for this date yet. Please check back or
              contact the restaurant.
            </span>
          )}
        </label>
        <label className="block text-sm">
          Full name
          <input name="fullName" autoComplete="name" required maxLength={100} className="form-input mt-2" />
        </label>
        <label className="block text-sm">
          Phone
          <input name="phone" type="tel" autoComplete="tel" required maxLength={24} className="form-input mt-2" />
        </label>
        <label className="block text-sm sm:col-span-2">
          Email
          <input name="email" type="email" autoComplete="email" required maxLength={254} className="form-input mt-2" />
        </label>
        <label className="block text-sm">
          Occasion <span className="text-foreground/50">(optional)</span>
          <input name="occasion" maxLength={80} className="form-input mt-2" />
        </label>
        <label className="block text-sm">
          Special requests <span className="text-foreground/50">(optional)</span>
          <input name="specialRequests" maxLength={1000} className="form-input mt-2" />
        </label>
      </div>
      {error && <p role="alert" className="mt-5 text-sm text-red-800">{error}</p>}
      <button
        type="submit"
        disabled={submitting || loadingSlots || !time}
        className="mt-7 rounded-full bg-accent px-7 py-4 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Sending request…" : "Request this table"}
      </button>
    </form>
  );
}
