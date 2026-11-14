import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import env from "@next/env";
import pg from "pg";

const { loadEnvConfig } = env;
loadEnvConfig(process.cwd());

const {
  DATABASE_URL,
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
if (!DATABASE_URL) {
  throw new Error("Set DATABASE_URL to the PostgreSQL connection string before provisioning.");
}

const email = ADMIN_EMAIL.trim().toLowerCase();
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  throw new Error("ADMIN_EMAIL must be a valid email address.");
}

const { Pool } = pg;
const database = new Pool({ connectionString: DATABASE_URL, max: 1 });
const client = await database.connect();

try {
  const existingUser = await client.query(
    `SELECT id FROM "user" WHERE lower(email) = $1`,
    [email],
  );
  const userId = existingUser.rows[0]?.id || randomUUID();
  const passwordHash = await hashPassword(ADMIN_PASSWORD);
  await client.query("BEGIN");
  if (existingUser.rows[0]) {
    await client.query(
      `UPDATE "user" SET name = $1, "emailVerified" = true, "updatedAt" = now()
       WHERE id = $2`,
      [ADMIN_NAME.trim(), userId],
    );
  } else {
    await client.query(
      `INSERT INTO "user" (id, name, email, "emailVerified")
       VALUES ($1, $2, $3, true)`,
      [userId, ADMIN_NAME.trim(), email],
    );
  }

  const credentialAccount = await client.query(
    `SELECT id FROM "account"
     WHERE "userId" = $1 AND "providerId" = 'credential'
     ORDER BY CASE WHEN "accountId" = $1 THEN 0 ELSE 1 END
     LIMIT 1`,
    [userId],
  );
  if (credentialAccount.rows[0]) {
    await client.query(
      `UPDATE "account"
       SET "accountId" = $1, password = $2, "updatedAt" = now()
       WHERE id = $3`,
      [userId, passwordHash, credentialAccount.rows[0].id],
    );
  } else {
    await client.query(
      `INSERT INTO "account"
         (id, "accountId", "providerId", "userId", password)
       VALUES ($1, $2, 'credential', $3, $4)`,
      [randomUUID(), userId, userId, passwordHash],
    );
  }
  await client.query(`DELETE FROM "session" WHERE "userId" = $1`, [userId]);
  await client.query("COMMIT");

  console.log(
    `${existingUser.rows[0] ? "Reset" : "Provisioned"} the Yummibite admin account for ${email}.`,
  );
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await database.end();
}
