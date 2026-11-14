import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const globalForDb = globalThis as typeof globalThis & { yummibitePool?: Pool };

export function getDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL must be set to connect to the production database.");
  }
  globalForDb.yummibitePool ??= new Pool({ connectionString, max: 5 });
  return globalForDb.yummibitePool;
}

export async function incrementRateLimit(key: string) {
  const database = getDatabase();
  const now = Date.now();
  const windowStartedAt = new Date(now - (now % 3_600_000)).toISOString();
  const result = await database.query<{ request_count: number }>(
    `INSERT INTO reservation_rate_limits (key, window_started_at, request_count)
     VALUES ($1, $2, 1)
     ON CONFLICT (key) DO UPDATE SET
       request_count = CASE
         WHEN reservation_rate_limits.window_started_at < EXCLUDED.window_started_at
         THEN 1 ELSE reservation_rate_limits.request_count + 1
       END,
       window_started_at = GREATEST(
         reservation_rate_limits.window_started_at,
         EXCLUDED.window_started_at
       )
     RETURNING request_count`,
    [key, windowStartedAt],
  );
  await database.query(
    "DELETE FROM reservation_rate_limits WHERE window_started_at < $1",
    [new Date(now - 48 * 3_600_000).toISOString()],
  );
  return result.rows[0].request_count;
}

export function getDb() {
  return drizzle(getDatabase(), { schema });
}
