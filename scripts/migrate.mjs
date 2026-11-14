import { readFile } from "node:fs/promises";
import { mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import env from "@next/env";
import Database from "better-sqlite3";

const { loadEnvConfig } = env;
loadEnvConfig(process.cwd());

const migration = await readFile(
  new URL("../drizzle/0000_restaurant_foundation.sql", import.meta.url),
  "utf8",
);
const databaseFile = process.env.SQLITE_DATABASE_FILE?.trim() || "auth.db";
if (basename(databaseFile) !== databaseFile) {
  throw new Error("SQLITE_DATABASE_FILE must be a file name inside the data directory.");
}
const dataDirectory = join(process.cwd(), "data");
const databasePath = join(dataDirectory, databaseFile);
mkdirSync(dataDirectory, { recursive: true });
const database = new Database(databasePath);

try {
  database.pragma("foreign_keys = ON");
  database.exec(migration);
  console.log(`Yummibite SQLite migration completed: ${databasePath}`);
} finally {
  database.close();
}
