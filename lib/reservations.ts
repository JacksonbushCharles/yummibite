import { randomBytes, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { restaurantConfig } from "@/lib/restaurant-config";
import { getDatabase } from "@/lib/db";

type RestaurantTable = {
  id: string;
  capacity: number;
};

type ExistingReservation = {
  startsAt: string;
  durationMinutes: number;
  tableId: string;
};

function assertDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Choose a valid reservation date.");
  }
  const parsed = new Date(`${date}T12:00:00.000Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error("Choose a valid reservation date.");
  }
  return parsed;
}

function toRestaurantTime(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  const timeZone = process.env.RESTAURANT_TIME_ZONE || "UTC";
  let timestamp = target;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(timestamp));
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const represented = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
    );
    timestamp = target - (represented - timestamp);
  }

  return new Date(timestamp);
}

function findTableCombination(tables: RestaurantTable[], partySize: number) {
  const maxCapacity = Math.max(0, ...tables.map((table) => table.capacity));
  const capacityLimit = partySize + maxCapacity;
  const combinations = new Map<number, RestaurantTable[]>([[0, []]]);

  for (const table of tables) {
    for (const [capacity, combination] of [...combinations.entries()].reverse()) {
      const nextCapacity = capacity + table.capacity;
      if (nextCapacity > capacityLimit) continue;
      const nextCombination = [...combination, table];
      const existing = combinations.get(nextCapacity);
      if (!existing || nextCombination.length < existing.length) {
        combinations.set(nextCapacity, nextCombination);
      }
    }
  }

  const best = [...combinations.entries()]
    .filter(([capacity]) => capacity >= partySize)
    .sort(([capacityA, combinationA], [capacityB, combinationB]) =>
      combinationA.length - combinationB.length || capacityA - capacityB,
    )[0];
  return best?.[1];
}

function getDateAvailability(
  database: Database.Database,
  date: string,
  partySize: number,
) {
  const day = assertDate(date);
  const timeZone = process.env.RESTAURANT_TIME_ZONE || "UTC";
  const todayParts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date())
      .map(({ type, value }) => [type, value]),
  );
  const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;
  const dayOffset = Math.floor(
    (day.getTime() - new Date(`${today}T12:00:00.000Z`).getTime()) / 86_400_000,
  );
  if (
    dayOffset < 0 ||
    dayOffset > restaurantConfig.reservation.maximumAdvanceDays
  ) {
    return { slots: [], tables: [] as RestaurantTable[] };
  }

  const dayOfWeek = day.getUTCDay();
  const hours = database.prepare(
    `SELECT open_time, close_time, is_closed
     FROM restaurant_hours WHERE day_of_week = ?`,
  ).get(dayOfWeek) as
    | { open_time: string | null; close_time: string | null; is_closed: number }
    | undefined;
  if (!hours || hours.is_closed || !hours.open_time || !hours.close_time) {
    return { slots: [], tables: [] as RestaurantTable[] };
  }

  const tables = database.prepare(
    `SELECT id, capacity FROM restaurant_tables
     WHERE is_active = 1 ORDER BY capacity`,
  ).all() as RestaurantTable[];
  if (tables.length === 0) return { slots: [], tables };

  const nextDate = new Date(day.getTime() + 86_400_000).toISOString().slice(0, 10);
  const dayStart = toRestaurantTime(date, "00:00");
  const dayEnd = toRestaurantTime(nextDate, "00:00");
  const existing = database.prepare(
    `SELECT r.starts_at AS startsAt, r.duration_minutes AS durationMinutes,
            rt.table_id AS tableId
     FROM reservations r
     JOIN reservation_tables rt ON rt.reservation_id = r.id
     WHERE r.starts_at < ?
       AND julianday(r.starts_at) + ((r.duration_minutes + ?) / 1440.0) >= julianday(?)
       AND r.status IN ('pending', 'confirmed', 'seated')`,
  ).all(
    dayEnd.toISOString(),
    restaurantConfig.reservation.bufferMinutes,
    dayStart.toISOString(),
  ) as ExistingReservation[];

  const toMinutes = (value: string) => {
    const [hour, minute] = value.split(":").map(Number);
    return hour * 60 + minute;
  };
  const open = toMinutes(hours.open_time);
  const close = toMinutes(hours.close_time);
  const slots: string[] = [];

  for (
    let minute = open;
    minute + restaurantConfig.reservation.durationMinutes <= close;
    minute += restaurantConfig.reservation.intervalMinutes
  ) {
    const slot = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
    const startsAt = toRestaurantTime(date, slot);
    if (
      startsAt.getTime() <
      Date.now() + restaurantConfig.reservation.minimumAdvanceMinutes * 60_000
    ) {
      continue;
    }
    const endsAt = startsAt.getTime() +
      (restaurantConfig.reservation.durationMinutes + restaurantConfig.reservation.bufferMinutes) * 60_000;
    const occupiedIds = new Set(
      existing
        .filter((reservation) => {
          const reservationStart = new Date(reservation.startsAt).getTime();
          const reservationEnd = reservationStart +
            (reservation.durationMinutes + restaurantConfig.reservation.bufferMinutes) * 60_000;
          return startsAt.getTime() < reservationEnd && reservationStart < endsAt;
        })
        .map((reservation) => reservation.tableId),
    );
    const availableTables = tables.filter((table) => !occupiedIds.has(table.id));
    if (findTableCombination(availableTables, partySize)) slots.push(slot);
  }

  return { slots, tables };
}

export async function getAvailableReservationSlots(date: string, partySize: number) {
  return getDateAvailability(getDatabase(), date, partySize).slots;
}

export async function createReservation(input: {
  fullName: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  partySize: number;
  specialRequests?: string;
  occasion?: string;
}) {
  assertDate(input.date);
  const database = getDatabase();
  const create = database.transaction(() => {
    const { slots, tables } = getDateAvailability(database, input.date, input.partySize);
    if (!slots.includes(input.time)) return null;

    const startsAt = toRestaurantTime(input.date, input.time);
    const slotEnd = startsAt.getTime() +
      (restaurantConfig.reservation.durationMinutes + restaurantConfig.reservation.bufferMinutes) * 60_000;
    const occupiedRows = database.prepare(
      `SELECT rt.table_id AS tableId
       FROM reservations r
       JOIN reservation_tables rt ON rt.reservation_id = r.id
       WHERE r.starts_at < ?
         AND julianday(r.starts_at) + ((r.duration_minutes + ?) / 1440.0) > julianday(?)
         AND r.status IN ('pending', 'confirmed', 'seated')`,
    ).all(
      new Date(slotEnd).toISOString(),
      restaurantConfig.reservation.bufferMinutes,
      startsAt.toISOString(),
    ) as Array<{ tableId: string }>;
    const occupied = new Set(occupiedRows.map(({ tableId }) => tableId));
    const allocation = findTableCombination(
      tables.filter((table) => !occupied.has(table.id)),
      input.partySize,
    );
    if (!allocation) return null;

    const reference = randomBytes(8).toString("hex").toUpperCase();
    const reservationId = randomUUID();
    database.prepare(
      `INSERT INTO reservations
         (id, reference, full_name, phone, email, starts_at, party_size, duration_minutes,
          special_requests, occasion, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    ).run(
      reservationId,
      reference,
      input.fullName,
      input.phone,
      input.email,
      startsAt.toISOString(),
      input.partySize,
      restaurantConfig.reservation.durationMinutes,
      input.specialRequests || null,
      input.occasion || null,
    );

    const assignTable = database.prepare(
      `INSERT INTO reservation_tables (reservation_id, table_id) VALUES (?, ?)`,
    );
    for (const table of allocation) assignTable.run(reservationId, table.id);

    return { reference, startsAt };
  });
  return create.immediate();
}
