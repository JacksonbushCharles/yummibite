import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { getDatabase, getDb } from "@/lib/db";
import { menuCategories } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/admin-auth";
import {
  MenuManager,
  OpeningHoursForm,
  ReservationStatusControl,
  SignOutButton,
  TableManager,
} from "@/components/admin-controls";

export const metadata: Metadata = {
  title: "Restaurant dashboard",
  robots: { index: false, follow: false },
};

type AdminReservation = {
  id: string;
  reference: string;
  full_name: string;
  email: string;
  phone: string;
  starts_at: string;
  party_size: number;
  status: string;
};

export default async function AdminPage() {
  const session = await requireAdmin();
  const database = getDatabase();
  const reservations = database.prepare(
    `SELECT id, reference, full_name, email, phone, starts_at, party_size, status
     FROM reservations
     WHERE julianday(starts_at) >= julianday('now', '-1 day')
     ORDER BY starts_at ASC LIMIT 100`,
  ).all() as AdminReservation[];
  const hours = (database.prepare(
    `SELECT day_of_week AS dayOfWeek, open_time AS openTime,
            close_time AS closeTime, is_closed AS isClosed
     FROM restaurant_hours ORDER BY day_of_week`,
  ).all() as Array<{
    dayOfWeek: number;
    openTime: string | null;
    closeTime: string | null;
    isClosed: number;
  }>).map((day) => ({ ...day, isClosed: Boolean(day.isClosed) }));
  const tables = (database.prepare(
    `SELECT name, capacity, section, is_active AS isActive
     FROM restaurant_tables ORDER BY name`,
  ).all() as Array<{
    name: string;
    capacity: number;
    section: string | null;
    isActive: number;
  }>).map((table) => ({ ...table, isActive: Boolean(table.isActive) }));
  const stats = database.prepare(
    `SELECT
       sum(CASE WHEN substr(starts_at, 1, 10) = date('now') THEN 1 ELSE 0 END) AS today,
       sum(CASE WHEN julianday(starts_at) >= julianday('now') AND status = 'pending' THEN 1 ELSE 0 END) AS pending,
       sum(CASE WHEN julianday(starts_at) >= julianday('now') AND status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed
     FROM reservations
     WHERE julianday(starts_at) >= julianday('now', '-1 day')`,
  ).get() as { today: number | null; pending: number | null; confirmed: number | null };
  const categories = await getDb().select({ id: menuCategories.id, name: menuCategories.name })
    .from(menuCategories)
    .orderBy(desc(menuCategories.sortOrder));

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-16">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow text-accent">Yummibite / Restaurant admin</p>
          <h1 className="mt-3 font-serif text-5xl">Welcome, {session.user.name}.</h1>
          <p className="mt-3 text-sm text-foreground/65">
            Reservation requests, seating, menu and restaurant setup.
          </p>
        </div>
        <SignOutButton />
      </header>

      <section aria-label="Reservation overview" className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ["Today’s bookings", stats.today ?? 0],
          ["Awaiting confirmation", stats.pending ?? 0],
          ["Confirmed", stats.confirmed ?? 0],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-border bg-card p-6">
            <p className="eyebrow text-foreground/55">{label}</p>
            <p className="mt-4 font-serif text-4xl">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-accent">Bookings</p>
            <h2 className="mt-2 font-serif text-3xl">Reservation requests</h2>
          </div>
          <span className="text-sm text-foreground/55">{reservations.length} shown</span>
        </div>
        <div className="mt-5 overflow-x-auto rounded-3xl border border-border bg-card">
          {reservations.length === 0 ? (
            <p className="p-8 text-sm text-foreground/65">No reservations have been received yet.</p>
          ) : (
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase tracking-wider text-foreground/55">
                <tr>
                  <th className="px-5 py-4">Date and time</th>
                  <th className="px-5 py-4">Guest</th>
                  <th className="px-5 py-4">Party</th>
                  <th className="px-5 py-4">Reference</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td className="px-5 py-4">
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: process.env.RESTAURANT_TIME_ZONE || "UTC",
                      }).format(new Date(reservation.starts_at))}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium">{reservation.full_name}</p>
                      <p className="mt-1 text-xs text-foreground/55">{reservation.email}</p>
                      <p className="text-xs text-foreground/55">{reservation.phone}</p>
                    </td>
                    <td className="px-5 py-4">{reservation.party_size}</td>
                    <td className="px-5 py-4 font-mono text-xs">{reservation.reference}</td>
                    <td className="px-5 py-4">
                      <ReservationStatusControl
                        reservation={{
                          id: reservation.id,
                          reference: reservation.reference,
                          fullName: reservation.full_name,
                          email: reservation.email,
                          startsAt: new Date(reservation.starts_at).toISOString(),
                          partySize: reservation.party_size,
                          status: reservation.status,
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <OpeningHoursForm initialHours={hours} />
        <div className="space-y-5">
          <TableManager />
          <div className="rounded-3xl border border-border bg-card p-6">
            <p className="eyebrow text-accent">Current tables</p>
            <ul className="mt-4 divide-y divide-border">
              {tables.map((table) => (
                <li key={table.name} className="flex justify-between gap-4 py-3 text-sm">
                  <span>{table.name}{table.section ? ` · ${table.section}` : ""}</span>
                  <span>{table.capacity} seats{table.isActive ? "" : " · unavailable"}</span>
                </li>
              ))}
              {tables.length === 0 && <li className="py-3 text-sm text-foreground/60">No tables configured.</li>}
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <p className="eyebrow text-accent">Menu</p>
        <h2 className="mt-2 font-serif text-3xl">Manage menu content</h2>
        <p className="mb-5 mt-2 text-sm text-foreground/65">
          Only publish real dishes and prices supplied by the restaurant.
        </p>
        <MenuManager categories={categories} />
      </section>
    </main>
  );
}
