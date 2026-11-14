# Yummibite

A single-restaurant website and reservation app built with Next.js, TypeScript,
PostgreSQL, Drizzle ORM and Better Auth.

Restaurant facts, hours, dishes, prices, address, phone number and email must be
confirmed by the restaurant. Until then, the site labels sample photography
and placeholders rather than presenting invented details as fact.

## Local setup

1. Install Node.js 22.
2. Create a PostgreSQL database (Neon is recommended for Vercel), then copy
   `.env.example` to `.env.local` and set `DATABASE_URL`, `BETTER_AUTH_SECRET`
   (at least 32 random characters), `BETTER_AUTH_URL`,
   `NEXT_PUBLIC_BETTER_AUTH_URL`, `ADMIN_EMAIL` and `ADMIN_NAME`. Set
   `RESTAURANT_TIME_ZONE` to the restaurant's IANA time zone; `UTC` is only a
   development placeholder.
3. Install dependencies with `npm install`.
4. Create the PostgreSQL schema with `npm run db:migrate`.
5. Create or reset the admin account using a strong password. In PowerShell:

   ```powershell
   $env:ADMIN_PASSWORD = Read-Host "Initial admin password"
   npm run db:provision-admin
   Remove-Item Env:ADMIN_PASSWORD
   ```

   This creates the account if it does not exist, or resets its password and
   signs out existing sessions if it does. The database scripts load
   `.env.local`; make sure it contains `DATABASE_URL`, `ADMIN_EMAIL` and
   `ADMIN_NAME`. The account email must match `ADMIN_EMAIL`.
6. Start the app with `npm run dev`, then sign in at `/sign-in`. Add the
   restaurant's tables and opening hours in `/admin` before accepting requests.

The migration script is idempotent. Back up the database before applying schema
changes.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string for the persistent database |
| `BETTER_AUTH_SECRET` | Session signing key and rate-limit key; use a unique secret in every environment |
| `BETTER_AUTH_URL` | Canonical app URL for Better Auth |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Public app URL used by the sign-in client |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID for optional Google sign-in |
| `GOOGLE_CLIENT_SECRET` | Server-only Google OAuth client secret |
| `ADMIN_EMAIL` | The single email address allowed into the admin area |
| `ADMIN_NAME` | Name for the initial provisioned admin |
| `ADMIN_PASSWORD` | Temporary shell-only value required by `db:provision-admin`; do not store in `.env` |
| `RESTAURANT_TIME_ZONE` | IANA time zone for opening hours and bookings |
| `RESEND_API_KEY` | Server-only Resend API key for the contact form |
| `RESEND_FROM` | Verified sender address for contact messages |
| `CONTACT_EMAIL` | Restaurant inbox that receives contact messages |

Never commit `.env.local`, passwords, database credentials or API keys. For
Vercel, add `DATABASE_URL` and the auth settings in Project Settings, then run
`npm run db:migrate` against the production database before deploying.

## What's implemented

- Yummibite public home, story, menu, gallery, contact and reservation pages.
- PostgreSQL schema and SQL migration for auth, hours, tables, reservations,
  menu and settings.
- Guest reservation requests, server-side opening-hours and table availability,
  multi-table allocation, PostgreSQL transaction locking, booking references
  and database-backed request rate limiting.
- Better Auth email/password customer sign-up and sign-in; the navbar links to
  each signed-in customer's account name and email.
- Google sign-in when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set.
- Admin routes remain restricted to the single `ADMIN_EMAIL` address.
- Admin reservation status, opening-hours, table creation and menu category/item
  creation controls.
- Contact message delivery through the Resend HTTP API when configured.

## Not yet implemented

This is a working foundation, not a production-ready completion of the full
project brief. Reservation email confirmations/reminders, booking lookup and
guest cancellation, table editing/deactivation, menu editing/availability and
image upload, editable restaurant profile/contact settings, deposits/Paystack,
refunds, audit logs, calendar/search/filters, Maps/social integration,
structured-data/sitemap/robots routes and automated application tests remain
to be completed. Do not accept real bookings until those workflows and the
restaurant's real details have been reviewed and tested.

Configure a persistent PostgreSQL database, authentication secret, email sender
and restaurant time zone before deploying. The app does not ship with real
restaurant hours, tables, menu items, prices or contact details.

## Checks

```bash
npm run lint
npm run build
```
