import { randomUUID } from "node:crypto";
import {
  boolean,
  check,
  integer,
  pgTable,
  primaryKey,
  text,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const restaurantHours = pgTable(
  "restaurant_hours",
  {
    dayOfWeek: integer("day_of_week").primaryKey(),
    openTime: text("open_time"),
    closeTime: text("close_time"),
    isClosed: boolean("is_closed").notNull().default(true),
  },
  (table) => [
    check("restaurant_hours_day_check", sql`${table.dayOfWeek} between 0 and 6`),
  ],
);

export const restaurantTables = pgTable(
  "restaurant_tables",
  {
    id: text("id").$defaultFn(randomUUID).primaryKey(),
    name: text("name").notNull().unique(),
    capacity: integer("capacity").notNull(),
    section: text("section"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`now()::text`),
  },
  (table) => [
    check("restaurant_tables_capacity_check", sql`${table.capacity} > 0`),
  ],
);

export const reservations = pgTable(
  "reservations",
  {
    id: text("id").$defaultFn(randomUUID).primaryKey(),
    reference: text("reference").notNull().unique(),
    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    startsAt: text("starts_at").notNull(),
    partySize: integer("party_size").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    specialRequests: text("special_requests"),
    occasion: text("occasion"),
    status: text("status").notNull().default("pending"),
    createdAt: text("created_at").notNull().default(sql`now()::text`),
    updatedAt: text("updated_at").notNull().default(sql`now()::text`),
  },
  (table) => [
    check("reservations_party_size_check", sql`${table.partySize} > 0`),
    check("reservations_duration_check", sql`${table.durationMinutes} > 0`),
    check(
      "reservations_status_check",
      sql`${table.status} in ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')`,
    ),
  ],
);

export const reservationTables = pgTable(
  "reservation_tables",
  {
    reservationId: text("reservation_id")
      .notNull()
      .references(() => reservations.id, { onDelete: "cascade" }),
    tableId: text("table_id")
      .notNull()
      .references(() => restaurantTables.id),
  },
  (table) => [
    primaryKey({ columns: [table.reservationId, table.tableId] }),
  ],
);

export const menuCategories = pgTable("menu_categories", {
  id: text("id").$defaultFn(randomUUID).primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isVisible: boolean("is_visible").notNull().default(true),
});

export const menuItems = pgTable(
  "menu_items",
  {
    id: text("id").$defaultFn(randomUUID).primaryKey(),
    categoryId: text("category_id")
      .notNull()
      .references(() => menuCategories.id),
    name: text("name").notNull(),
    description: text("description").notNull(),
    priceMinor: integer("price_minor").notNull(),
    currency: text("currency").notNull().default("USD"),
    imageUrl: text("image_url"),
    isAvailable: boolean("is_available").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    check("menu_items_price_check", sql`${table.priceMinor} >= 0`),
  ],
);

export const restaurantSettings = pgTable("restaurant_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`now()::text`),
});

export const reservationRateLimits = pgTable(
  "reservation_rate_limits",
  {
    key: text("key").primaryKey(),
    windowStartedAt: text("window_started_at").notNull(),
    requestCount: integer("request_count").notNull().default(0),
  },
  (table) => [
    check("reservation_rate_limits_count_check", sql`${table.requestCount} >= 0`),
  ],
);
