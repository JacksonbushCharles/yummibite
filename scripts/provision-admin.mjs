import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import Database from "better-sqlite3";
import { hashPassword } from "better-auth/crypto";
import env from "@next/env";

const { loadEnvConfig } = env;
loadEnvConfig(process.cwd());

const {
  SQLITE_DATABASE_FILE,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ADMIN_NAME,
} = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
  throw new Error(
    "Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_NAME before provisioning.",
  );
}
if (ADMIN_PASSWORD.length < 12) {
  throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
}

const email = ADMIN_EMAIL.trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("ADMIN_EMAIL must be a valid email address.");
}

const databaseFile = SQLITE_DATABASE_FILE?.trim() || "auth.db";
if (basename(databaseFile) !== databaseFile) {
  throw new Error("SQLITE_DATABASE_FILE must be a file name inside the data directory.");
}
const dataDirectory = join(process.cwd(), "data");
const databasePath = join(dataDirectory, databaseFile);
mkdirSync(dataDirectory, { recursive: true });
const database = new Database(databasePath);
database.pragma("foreign_keys = ON");

try {
  const existingUser = database.prepare(
    `SELECT id FROM "user" WHERE lower(email) = ?`,
  ).get(email);
  const userId = existingUser?.id || randomUUID();
  const now = Date.now();
  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  database.transaction(() => {
    if (existingUser) {
      database.prepare(
        `UPDATE "user" SET name = ?, "emailVerified" = 1, "updatedAt" = ?
         WHERE id = ?`,
      ).run(ADMIN_NAME.trim(), now, userId);
    } else {
      database.prepare(
        `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
         VALUES (?, ?, ?, 1, ?, ?)`,
      ).run(userId, ADMIN_NAME.trim(), email, now, now);
    }

    const credentialAccount = database.prepare(
      `SELECT id FROM "account"
       WHERE "userId" = ? AND "providerId" = 'credential'
       ORDER BY CASE WHEN "accountId" = ? THEN 0 ELSE 1 END
       LIMIT 1`,
    ).get(userId, userId);
    if (credentialAccount) {
      database.prepare(
        `UPDATE "account"
         SET "accountId" = ?, password = ?, "updatedAt" = ?
         WHERE id = ?`,
      ).run(userId, passwordHash, now, credentialAccount.id);
    } else {
      database.prepare(
        `INSERT INTO "account"
           (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
         VALUES (?, ?, 'credential', ?, ?, ?, ?)`,
      ).run(randomUUID(), userId, userId, passwordHash, now, now);
    }

    database.prepare(`DELETE FROM "session" WHERE "userId" = ?`).run(userId);
  }).immediate();

  console.log(
    `${existingUser ? "Reset" : "Provisioned"} the Yummibite admin account for ${email} in ${databasePath}.`,
  );
} finally {
  database.close();
}
