import { betterAuth } from "better-auth";
import { Kysely, PostgresDialect } from "kysely";
import { getDatabase } from "@/lib/db";

const secret = process.env.BETTER_AUTH_SECRET;

if (process.env.NODE_ENV === "production" && !secret) {
  throw new Error("BETTER_AUTH_SECRET must be set in production.");
}

const authDatabase = {
  db: new Kysely<Record<string, never>>({
    dialect: new PostgresDialect({ pool: getDatabase() }),
  }),
  type: "postgres" as const,
};

const googleCredentials = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectURI: `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/auth/callback/google`,
    }
  : undefined;

export const auth = betterAuth({
  database: authDatabase,
  secret: secret || "local-development-only-secret-change-before-deploy",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  socialProviders: {
    google: googleCredentials,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
});
