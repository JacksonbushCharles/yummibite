import { mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const globalForDb = globalThis as typeof globalThis & {
  yummibiteDatabase?: Database.Database;
};

export function getDatabase() {
  if (!globalForDb.yummibiteDatabase) {
    const databaseFile = process.env.SQLITE_DATABASE_FILE?.trim() || "auth.db";
    if (basename(databaseFile) !== databaseFile) {
      throw new Error("SQLITE_DATABASE_FILE must be a file name inside the data directory.");
    }
    const dataDirectory = join(process.cwd(), "data");
    const databasePath = join(dataDirectory, databaseFile);
    mkdirSync(dataDirectory, { recursive: true });
    globalForDb.yummibiteDatabase = new Database(databasePath);
    globalForDb.yummibiteDatabase.pragma("foreign_keys = ON");
  }
  return globalForDb.yummibiteDatabase;
}

export function incrementRateLimit(key: string) {
  const database = getDatabase();
  const now = Date.now();
  const windowStartedAt = new Date(now - (now % 3_600_000)).toISOString();
  database.prepare(
    `INSERT INTO reservation_rate_limits (key, window_started_at, request_count)
     VALUES (?, ?, 1)
     ON CONFLICT (key) DO UPDATE SET
       request_count = CASE
         WHEN reservation_rate_limits.window_started_at < ?
         THEN 1 ELSE reservation_rate_limits.request_count + 1
       END,
       window_started_at = CASE
         WHEN reservation_rate_limits.window_started_at < ?
         THEN ? ELSE reservation_rate_limits.window_started_at
       END`,
  ).run(key, windowStartedAt, windowStartedAt, windowStartedAt, windowStartedAt);
  database.prepare(
    "DELETE FROM reservation_rate_limits WHERE window_started_at < ?",
  ).run(new Date(now - 48 * 3_600_000).toISOString());
  const row = database.prepare(
    "SELECT request_count FROM reservation_rate_limits WHERE key = ?",
  ).get(key) as { request_count: number };
  return row.request_count;
}

export function getDb() {
  return drizzle(getDatabase(), { schema });
}
