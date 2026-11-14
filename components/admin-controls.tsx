"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Reservation = {
  id: string;
  reference: string;
  fullName: string;
  email: string;
  startsAt: string;
  partySize: number;
  status: string;
};

type OpeningHours = {
  dayOfWeek: number;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
};

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function useAdminMessage() {
  const [message, setMessage] = useState("");
  return { message, setMessage };
}

export function ReservationStatusControl({ reservation }: { reservation: Reservation }) {
  const [status, setStatus] = useState(reservation.status);
  const [message, setMessage] = useState("");

  async function update(nextStatus: string) {
    setMessage("");
    try {
      const response = await fetch(`/api/admin/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update reservation.");
      setStatus(nextStatus);
      setMessage("Saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update reservation.");
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <select value={status} onChange={(event) => void update(event.target.value)} className="form-input min-w-36 py-2 text-xs">
        {["pending", "confirmed", "seated", "completed", "cancelled", "no_show"].map((item) => (
          <option key={item} value={item}>{item.replace("_", " ")}</option>
        ))}
      </select>
      <span aria-live="polite" className="text-[0.68rem] text-foreground/60">{message}</span>
    </div>
  );
}

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function signOut() {
    setPending(true);
    setMessage("");
    try {
      await authClient.signOut();
      router.replace("/sign-in");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not sign out.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={() => void signOut()}
        disabled={pending}
        className="rounded-full border border-border px-5 py-3 text-sm disabled:opacity-50"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {message && <p role="alert" className="mt-2 text-xs text-red-800">{message}</p>}
    </div>
  );
}

export function OpeningHoursForm({ initialHours }: { initialHours: OpeningHours[] }) {
  const normalized = Array.from({ length: 7 }, (_, dayOfWeek) =>
    initialHours.find((item) => item.dayOfWeek === dayOfWeek) ?? {
      dayOfWeek,
      openTime: "17:00",
      closeTime: "22:00",
      isClosed: true,
    },
  );
  const [hours, setHours] = useState(normalized);
  const { message, setMessage } = useAdminMessage();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await fetch("/api/admin/hours", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save hours.");
      setMessage("Opening hours saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save hours.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border bg-card p-6">
      <div>
        <p className="eyebrow text-accent">Restaurant settings</p>
        <h2 className="mt-2 font-serif text-2xl">Opening hours</h2>
        <p className="mt-2 text-xs text-foreground/60">
          Demonstration times are shown until you save the restaurant’s actual hours.
        </p>
      </div>
      <div className="space-y-3">
        {hours.map((day) => (
          <div key={day.dayOfWeek} className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr_1fr]">
            <label className="text-sm">{days[day.dayOfWeek]}</label>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={day.isClosed}
                onChange={(event) => setHours((current) => current.map((item) => item.dayOfWeek === day.dayOfWeek ? { ...item, isClosed: event.target.checked } : item))}
              />
              Closed
            </label>
            <input
              type="time"
              aria-label={`${days[day.dayOfWeek]} opening time`}
              disabled={day.isClosed}
              value={day.openTime ?? ""}
              onChange={(event) => setHours((current) => current.map((item) => item.dayOfWeek === day.dayOfWeek ? { ...item, openTime: event.target.value } : item))}
              className="form-input py-2 text-sm disabled:opacity-40"
            />
            <input
              type="time"
              aria-label={`${days[day.dayOfWeek]} closing time`}
              disabled={day.isClosed}
              value={day.closeTime ?? ""}
              onChange={(event) => setHours((current) => current.map((item) => item.dayOfWeek === day.dayOfWeek ? { ...item, closeTime: event.target.value } : item))}
              className="form-input py-2 text-sm disabled:opacity-40"
            />
          </div>
        ))}
      </div>
      <button className="rounded-full bg-olive px-5 py-3 text-sm font-semibold text-cream">Save hours</button>
      <p aria-live="polite" className="text-sm text-foreground/65">{message}</p>
    </form>
  );
}

export function TableManager() {
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = event.currentTarget;
    const values = new FormData(form);
    try {
      const response = await fetch("/api/admin/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.get("name"),
          capacity: Number(values.get("capacity")),
          section: values.get("section"),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not add table.");
      form.reset();
      setMessage("Table added. Refresh to see the updated list.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add table.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border bg-card p-6">
      <div>
        <p className="eyebrow text-accent">Seating</p>
        <h2 className="mt-2 font-serif text-2xl">Add a table</h2>
      </div>
      <label className="block text-sm">Table name or number<input name="name" required maxLength={40} className="form-input mt-2" /></label>
      <label className="block text-sm">Seats<input name="capacity" type="number" min="1" max="30" required className="form-input mt-2" /></label>
      <label className="block text-sm">Section (optional)<input name="section" maxLength={80} className="form-input mt-2" /></label>
      <button className="rounded-full bg-olive px-5 py-3 text-sm font-semibold text-cream">Add table</button>
      <p aria-live="polite" className="text-sm text-foreground/65">{message}</p>
    </form>
  );
}

export function MenuManager({ categories }: { categories: Array<{ id: string; name: string }> }) {
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>, kind: "category" | "item") {
    event.preventDefault();
    setMessage("");
    const element = event.currentTarget;
    const form = new FormData(element);
    const body = kind === "category"
      ? { name: form.get("categoryName"), sortOrder: 0 }
      : {
          categoryId: form.get("categoryId"),
          name: form.get("itemName"),
          description: form.get("description"),
          priceMinor: Math.round(Number(form.get("price")) * 100),
          currency: String(form.get("currency")).toUpperCase(),
        };
    try {
      const response = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save menu data.");
      setMessage("Saved. Refresh to see the updated menu.");
      element.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save menu data.");
    }
  }

  return (
    <div className="grid gap-5 rounded-3xl border border-border bg-muted p-5 md:grid-cols-2">
      <form onSubmit={(event) => void submit(event, "category")} className="space-y-3 rounded-2xl bg-card p-5">
        <h3 className="font-serif text-xl">Add menu category</h3>
        <input name="categoryName" required maxLength={80} placeholder="Category name" className="form-input" />
        <button className="rounded-full bg-olive px-4 py-2 text-sm font-semibold text-cream">Add category</button>
      </form>
      <form onSubmit={(event) => void submit(event, "item")} className="space-y-3 rounded-2xl bg-card p-5">
        <h3 className="font-serif text-xl">Add menu item</h3>
        <select name="categoryId" required disabled={categories.length === 0} className="form-input">
          <option value="">Choose category</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <input name="itemName" required maxLength={120} placeholder="Dish name" className="form-input" />
        <textarea name="description" required maxLength={1000} placeholder="Description" className="form-input" />
        <div className="grid grid-cols-2 gap-3">
          <input name="price" type="number" step="0.01" min="0" required placeholder="Price" className="form-input" />
          <input name="currency" defaultValue="USD" maxLength={3} required aria-label="Currency code" className="form-input" />
        </div>
        <button disabled={categories.length === 0} className="rounded-full bg-olive px-4 py-2 text-sm font-semibold text-cream disabled:opacity-50">Add item</button>
      </form>
      <p aria-live="polite" className="text-sm text-foreground/65 md:col-span-2">{message}</p>
    </div>
  );
}
