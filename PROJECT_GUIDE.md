# Yummibite Project Guide

A beginner-friendly tour of this project, from the pages visitors see to the
server code, authentication, and PostgreSQL database.

> **Start here:** this file describes how the project is wired. The restaurant's
> actual address, opening hours, menu, and photographs still need to be supplied
> and confirmed. The content deliberately labels examples and unknown facts.

## 1. What this project does

Yummibite is a full-stack restaurant website. “Full-stack” means one project
contains both:

- **Frontend:** the pages and interactive forms people use in their browser.
- **Backend:** server code that validates requests, checks permissions, talks to
  the database, and contacts services such as Google or Resend.

The main working features are:

- Restaurant home, story, gallery, menu, contact, and reservation pages.
- Customer email/password accounts and Google sign-in.
- A customer account page that displays the signed-in user's name and email.
- Restaurant-admin access restricted by the `ADMIN_EMAIL` setting.
- An admin dashboard for reservation status, opening hours, tables, and menu
  content.
- A persistent PostgreSQL database, such as Neon for Vercel deployments.

## 2. Run the project locally

Create a PostgreSQL database and put its connection string in `DATABASE_URL`
inside `.env.local`. Open a terminal in the project folder:

```powershell
npm install
npm run db:migrate
npm run dev
```

Then open `http://localhost:3000`.

Useful commands from [package.json](./package.json):

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the local development server. |
| `npm run build` | Creates and type-checks a production build. Stop `npm run dev` first because both commands use `.next`. |
| `npm run start` | Serves a previously built production app. |
| `npm run db:migrate` | Creates any missing PostgreSQL tables. Safe to run again. |
| `npm run db:provision-admin` | Creates or resets the account whose email is `ADMIN_EMAIL`. It reads its password from the temporary `ADMIN_PASSWORD` environment variable. |
| `npm run lint` | Runs ESLint; it needs a working ESLint configuration in the repository. |

### Environment files and secrets

- [.env.example](./.env.example) is a template. Replace placeholder values
  before using the app.
- `.env.local` is your private local configuration. It is intentionally ignored
  by Git; do not paste it into chats or commit it.
- `DATABASE_URL` is the connection string for the persistent PostgreSQL database.
  The migration and admin scripts load it from `.env.local`.
- `BETTER_AUTH_SECRET` is a private signing key for authentication sessions
  and rate limits. It is **not** your account password. Generate a long random
  value and keep it private.
- `ADMIN_EMAIL` identifies which signed-in account may open `/admin`.
  `ADMIN_NAME` is used when provisioning or resetting that admin account.
- `ADMIN_PASSWORD` should be provided temporarily in the terminal when running
  the admin provisioning script, not saved in `.env.local`.
- Google sign-in is enabled only when both `GOOGLE_CLIENT_ID` and
  `GOOGLE_CLIENT_SECRET` are set. Keep the secret private.
- For local Google OAuth, the Google Cloud OAuth client must list
  `http://localhost:3000` as an authorized JavaScript origin and
  `http://localhost:3000/api/auth/callback/google` as an authorized redirect
  URI. The redirect URI must match exactly.
- The contact endpoint needs `RESEND_API_KEY`, `RESEND_FROM`, and
  `CONTACT_EMAIL` to deliver email.
- `RESTAURANT_TIME_ZONE` should be the restaurant's IANA time zone, such as
  `Africa/Lagos`; `UTC` is only a placeholder.

## 3. The request flow: browser to database

For a reservation, the flow is:

1. A visitor opens the [Reservations page](./app/reservations/page.tsx).
2. The page renders the interactive [ReservationForm](./components/reservation-form.tsx).
3. The form asks the server for available slots using
   `GET /api/reservations/availability`.
4. The [availability route](./app/api/reservations/availability/route.ts)
   validates the date and party size, then calls the reservation service.
5. [lib/reservations.ts](./lib/reservations.ts) checks opening hours, active
   tables, existing bookings, and time-zone rules using PostgreSQL.
6. When the visitor submits, the form sends `POST /api/reservations`.
7. The [reservation route](./app/api/reservations/route.ts) validates the
   details, checks the request rate limit, and asks the service to reserve
   available tables in a PostgreSQL transaction.
8. The browser displays a booking reference. The request remains **pending**;
   it is not automatically a confirmed reservation.

The same pattern applies elsewhere: the browser gathers input, a route handler
validates it, backend logic performs the operation, and the UI presents the
result. Never rely only on browser validation or hide server errors.

## 4. Frontend: pages and shared components

### Shared layout and visual system

- [Root layout](./app/layout.tsx) wraps every page, loads global CSS, sets
  metadata, and includes the shared site frame.
- [SiteShell](./components/site-shell.tsx) draws the site-wide header,
  navigation, account link, reservation button, and footer.
- [AccountNavigation](./components/account-navigation.tsx) uses Better Auth's
  client session to show **Sign in** when signed out or the user's name and
  email when signed in.
- [Global styles](./app/globals.css) defines the color palette, typography,
  form input styles, and reduced-motion behavior using Tailwind CSS and custom
  CSS.
- [Not found page](./app/not-found.tsx) is the custom 404 page.
- [Site icon](./app/icon.svg) supplies the browser/app icon.

### Main public pages

| URL | Page file | What it does |
| --- | --- | --- |
| `/` | [Home page](./app/page.tsx) | Introduces the restaurant and links to the menu and booking form. Photos are explicitly samples. |
| `/about` | [About page](./app/about/page.tsx) | Story and restaurant approach; real details await confirmation. |
| `/menu` | [Menu page](./app/menu/page.tsx) | Reads visible categories and available items from PostgreSQL using Drizzle. |
| `/gallery` | [Gallery page](./app/gallery/page.tsx) | Gallery layout awaiting the restaurant's real photography. |
| `/contact` | [Contact page](./app/contact/page.tsx) | Shows configured contact placeholders and embeds the contact form. |
| `/reservations` | [Reservations page](./app/reservations/page.tsx) | Explains and embeds the reservation form. |
| `/sign-in` | [Sign-in page](./app/sign-in/page.tsx) | Offers email/password sign-in, email/password account creation, and Google sign-in when configured. |
| `/account` | [Account page](./app/account/page.tsx) | Server-checks the session and displays the visitor's account name/email. |
| `/admin` | [Admin page](./app/admin/page.tsx) | Restricts access to `ADMIN_EMAIL`; displays bookings, hours, tables, and menu tools. |

### Interactive UI components

- [AuthPanel](./components/auth-panel.tsx) switches between email/password
  sign-in and customer sign-up, and starts Google OAuth. It sends credentials
  to Better Auth; it never stores a plaintext password in application code.
- [ReservationForm](./components/reservation-form.tsx) fetches available slots,
  collects guest/contact details, submits a reservation, and shows its pending
  reference.
- [ContactForm](./components/contact-form.tsx) sends a visitor's message to the
  contact API and displays the response.
- [Admin controls](./components/admin-controls.tsx) contains the admin's
  sign-out button, reservation status selector, opening-hours editor, table
  creation form, and menu manager. Its browser requests are still authorized
  again on the server.

### Compatibility routes

These pages preserve older URLs and redirect visitors to the current restaurant
pages:

- [`/builds`](./app/builds/page.tsx) and
  [`/builds/[slug]`](./app/builds/%5Bslug%5D/page.tsx) redirect to `/menu`.
- [`/signal`](./app/signal/page.tsx) and
  [`/signal/[slug]`](./app/signal/%5Bslug%5D/page.tsx) redirect to `/gallery`.
- [`/growth`](./app/growth/page.tsx) redirects to `/about`.
- [`/reach`](./app/reach/page.tsx) redirects to `/`.
- [`/studio`](./app/studio/page.tsx) and
  [`/dashboard`](./app/dashboard/page.tsx) redirect to `/admin`.

## 5. Backend: API routes

An API route is server code that responds to an HTTP request. These routes run
on the server; request validation and authorization belong here, even when the
browser has similar checks.

### Authentication

- [Better Auth route](./app/api/auth/%5B...all%5D/route.ts) forwards auth
  requests to Better Auth. This catch-all URL handles email/password signup,
  login, sessions, Google OAuth, and the OAuth callback.
- [Server auth configuration](./lib/auth.ts) connects Better Auth to PostgreSQL,
  sets the session secret and base URL, enables email/password accounts, and
  configures Google when both credentials exist.
- [Browser auth client](./lib/auth-client.ts) is the client-side Better Auth
  SDK used by the sign-in form and account navigation.
- [Admin authorization](./lib/admin-auth.ts) reads the signed-in session and
  compares its email with `ADMIN_EMAIL`. A valid customer login alone does not
  grant admin access.

### Reservations and contact

- [Availability API](./app/api/reservations/availability/route.ts) validates
  query parameters and returns available time slots.
- [Reservation submission API](./app/api/reservations/route.ts) checks request
  origin and input, limits attempts, and creates a pending reservation.
- [Contact API](./app/api/contact/route.ts) validates and rate-limits a message,
  then sends it through Resend when email settings are configured.
- [Origin helper](./lib/http.ts) checks that browser form requests came from the
  same site.

### Admin APIs

Each admin API checks `getAdminSession()` before changing data:

- [Save opening hours](./app/api/admin/hours/route.ts) validates seven days
  and updates them together in a transaction.
- [Add a table](./app/api/admin/tables/route.ts) validates seating details and
  inserts a table.
- [Add menu category or item](./app/api/admin/menu/route.ts) validates and
  inserts one of those menu records.
- [Change reservation status](./app/api/admin/reservations/%5Bid%5D/route.ts)
  validates the reservation ID and allowed status before updating it.

## 6. Services, database, and data model

- [Database connection and helpers](./lib/db/index.ts) opens a shared PostgreSQL
  connection pool, exposes Drizzle,
  and increments/cleans request rate-limit records.
- [Drizzle schema](./lib/db/schema.ts) describes application tables and types
  for TypeScript queries.
- [SQL migration](./drizzle/0000_restaurant_foundation.sql) creates the
  application and Better Auth tables in PostgreSQL.
- [Migration script](./scripts/migrate.mjs) loads local environment settings
  and executes the SQL migration.
- [Admin provisioning script](./scripts/provision-admin.mjs) securely hashes
  the temporary password and creates or resets the configured admin account.
- [Reservation service](./lib/reservations.ts) handles date/time conversion,
  open-hour checks, table availability, table combinations, and transactional
  booking creation.
- [Restaurant configuration](./lib/restaurant-config.ts) contains app copy,
  placeholder contact details, and reservation limits/durations.
- [Utility functions](./lib/utils.ts) contains small shared helpers used in
  styling or formatting.

The main PostgreSQL tables are:

| Table | What it stores |
| --- | --- |
| `user`, `account`, `session`, `verification` | Better Auth identities, credential/provider links, login sessions, and verification records. |
| `restaurant_hours` | Open/closed state and local opening/closing times by weekday. |
| `restaurant_tables` | Restaurant seating name, capacity, section, and active state. |
| `reservations` | Guest details, reference, date/time, party size, and booking status. |
| `reservation_tables` | Which physical tables are allocated to each reservation. |
| `menu_categories`, `menu_items` | Published menu grouping and dish data. |
| `restaurant_settings` | Extensible JSON settings. |
| `reservation_rate_limits` | Hashed request keys, time windows, and attempt counts. |

Back up the PostgreSQL database before risky schema changes and keep its
connection string private.

## 7. Concepts worth learning

- **React component:** a function that returns UI markup. For example, the
  reservation page composes the `ReservationForm` component.
- **Server component:** Next.js renders it on the server. It can read a session
  or database without sending server-only code to the browser. App Router pages
  are server components unless marked `"use client"`.
- **Client component:** a component marked `"use client"` that can respond to
  clicks, hold React state, and use browser APIs. Forms and account navigation
  use this.
- **Route handler:** a server function exported as `GET`, `POST`, `PUT`, or
  `PATCH` from a `route.ts` file. The HTTP verb describes the kind of operation.
- **API request:** the browser sends JSON to a route; the route returns JSON
  with a status code. `400` means invalid input, `401` unauthorized,
  `403` forbidden, `409` a conflict, and `5xx` a server/service problem.
- **Authentication vs authorization:** authentication proves who signed in;
  authorization decides what that person is allowed to do. Better Auth handles
  login/session; `lib/admin-auth.ts` separately restricts the admin area.
- **OAuth callback:** the URL Google redirects to after consent. Google checks
  it exactly against the redirect URI allow-list in Google Cloud.
- **Database migration:** SQL that creates or changes database structure.
  Migration is separate from application requests, so run `npm run db:migrate`
  after pulling schema changes.
- **Environment variable:** a setting injected when the server runs. Secrets
  stay server-side; never prefix a secret with `NEXT_PUBLIC_`.
- **TypeScript type:** a compile-time description of data shape. It helps catch
  mistakes but does not replace runtime validation of incoming requests; Zod
  is used for that.
- **Transaction:** a group of database changes committed together or rolled
  back together. The reservation service uses one so partial table allocation
  cannot be saved.

## 8. Suggested learning path through this code

1. Read [Home page](./app/page.tsx) and [SiteShell](./components/site-shell.tsx)
   to see how a page fits inside shared navigation and footer.
2. Read [Reservations page](./app/reservations/page.tsx) and
   [ReservationForm](./components/reservation-form.tsx) to learn client-side
   state, events, and browser `fetch`.
3. Follow those requests into the
   [availability route](./app/api/reservations/availability/route.ts) and
   [reservation service](./lib/reservations.ts).
4. Read [PostgreSQL connection](./lib/db/index.ts),
   [schema](./lib/db/schema.ts), and
   [migration SQL](./drizzle/0000_restaurant_foundation.sql) to understand
   persistence.
5. Read [auth configuration](./lib/auth.ts),
   [AuthPanel](./components/auth-panel.tsx), and
   [Account page](./app/account/page.tsx) to trace login and sessions.
6. Read [admin authorization](./lib/admin-auth.ts), [Admin page](./app/admin/page.tsx),
   and [admin APIs](./app/api/admin/hours/route.ts) to learn authorization and
   protected data changes.
7. Make one small change, run `npx tsc --noEmit`, and then `npm run build`.
   Before running the build, stop the dev server to avoid both processes
   modifying `.next` at once.

## 9. Current limits and safety reminders

- Customer sign-up is enabled; it creates a customer account, not an admin.
- Admin pages and admin APIs check the `ADMIN_EMAIL` allow-list on the server.
- Reservations are guest requests, stored as `pending`. Customer accounts are
  not yet linked to reservations.
- The project does not yet include reservation email confirmations/reminders,
  customer booking lookup/cancellation, full menu editing, deposits, refunds,
  audit logs, or automated application test suites.
- PostgreSQL is shared and persistent across Vercel function instances. Run the
  schema migration against the same database configured by `DATABASE_URL`.
- The repository's `npm run lint` command needs an ESLint config; if it reports
  that no `eslint.config.*` exists, that is a project setup issue rather than a
  TypeScript compiler error.
- Never share `.env.local`, passwords, OAuth client secrets, password hashes,
  or a database file containing real customer data.
