import { readFile } from "node:fs/promises";
import env from "@next/env";
import pg from "pg";

const { loadEnvConfig } = env;
loadEnvConfig(process.cwd());

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("Set DATABASE_URL to the PostgreSQL connection string before migrating.");
}

const migration = await readFile(
  new URL("../drizzle/0000_restaurant_foundation.sql", import.meta.url),
  "utf8",
);
const database = new Pool({ connectionString, max: 1 });
const client = await database.connect();

try {
  await client.query("BEGIN");
  await client.query(migration);
  await client.query("COMMIT");
  console.log("Yummibite PostgreSQL migration completed.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await database.end();
}
