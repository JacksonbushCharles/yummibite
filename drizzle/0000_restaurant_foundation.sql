CREATE TABLE IF NOT EXISTS "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "emailVerified" integer NOT NULL DEFAULT 0,
  "image" text,
  "createdAt" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updatedAt" integer NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE IF NOT EXISTS "session" (
  "id" text PRIMARY KEY NOT NULL,
  "expiresAt" integer NOT NULL,
  "token" text NOT NULL UNIQUE,
  "createdAt" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updatedAt" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("userId");

CREATE TABLE IF NOT EXISTS "account" (
  "id" text PRIMARY KEY NOT NULL,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" integer,
  "refreshTokenExpiresAt" integer,
  "scope" text,
  "password" text,
  "createdAt" integer NOT NULL DEFAULT (unixepoch() * 1000),
  "updatedAt" integer NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("userId");

CREATE TABLE IF NOT EXISTS "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" integer NOT NULL,
  "createdAt" integer DEFAULT (unixepoch() * 1000),
  "updatedAt" integer DEFAULT (unixepoch() * 1000)
);
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");

CREATE TABLE IF NOT EXISTS "restaurant_hours" (
  "day_of_week" integer PRIMARY KEY CHECK ("day_of_week" BETWEEN 0 AND 6),
  "open_time" text,
  "close_time" text,
  "is_closed" integer NOT NULL DEFAULT 1,
  CHECK ("is_closed" OR ("open_time" IS NOT NULL AND "close_time" IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS "restaurant_tables" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL UNIQUE,
  "capacity" integer NOT NULL CHECK ("capacity" > 0),
  "section" text,
  "is_active" integer NOT NULL DEFAULT 1,
  "created_at" text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS "reservations" (
  "id" text PRIMARY KEY NOT NULL,
  "reference" text NOT NULL UNIQUE,
  "full_name" text NOT NULL,
  "phone" text NOT NULL,
  "email" text NOT NULL,
  "starts_at" text NOT NULL,
  "party_size" integer NOT NULL CHECK ("party_size" > 0),
  "duration_minutes" integer NOT NULL CHECK ("duration_minutes" > 0),
  "special_requests" text,
  "occasion" text,
  "status" text NOT NULL DEFAULT 'pending'
    CHECK ("status" IN ('pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
  "created_at" text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  "updated_at" text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS "reservations_starts_at_idx" ON "reservations" ("starts_at");
CREATE INDEX IF NOT EXISTS "reservations_status_idx" ON "reservations" ("status");

CREATE TABLE IF NOT EXISTS "reservation_tables" (
  "reservation_id" text NOT NULL REFERENCES "reservations" ("id") ON DELETE CASCADE,
  "table_id" text NOT NULL REFERENCES "restaurant_tables" ("id"),
  PRIMARY KEY ("reservation_id", "table_id")
);

CREATE TABLE IF NOT EXISTS "menu_categories" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "is_visible" integer NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS "menu_items" (
  "id" text PRIMARY KEY NOT NULL,
  "category_id" text NOT NULL REFERENCES "menu_categories" ("id"),
  "name" text NOT NULL,
  "description" text NOT NULL,
  "price_minor" integer NOT NULL CHECK ("price_minor" >= 0),
  "currency" text NOT NULL DEFAULT 'USD',
  "image_url" text,
  "is_available" integer NOT NULL DEFAULT 1,
  "sort_order" integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS "restaurant_settings" (
  "key" text PRIMARY KEY,
  "value" text NOT NULL,
  "updated_at" text NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS "reservation_rate_limits" (
  "key" text PRIMARY KEY,
  "window_started_at" text NOT NULL,
  "request_count" integer NOT NULL DEFAULT 0 CHECK ("request_count" >= 0)
);
