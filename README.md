# Nimbus CRM (Next.js)

A modern, lightweight CRM for small and medium-sized businesses: contacts,
companies, a drag-and-drop sales pipeline, invoices, tasks, notes and a live
activity feed.

This is the **Next.js version of `demo-nimbus-crm`**. The original is a React
single-page app talking to an Express REST API over `fetch` and WebSockets.
This one is the same product, with the same screens, database schema and demo
data, rebuilt on the Next.js App Router: Server Components read the data,
Server Actions change it, and there is no REST API in between.

---

## Quick start

You need Node.js 22 or newer.

```bash
npm install
npm run dev
```

Open **http://localhost:3000** and sign in with a seeded account:

| Email            | Password   | Role   |
| ---------------- | ---------- | ------ |
| `admin@crm.test` | `admin123` | admin  |
| `rep@crm.test`   | `sales123` | member |

The SQLite database is created, migrated and seeded with demo data the first
time the app needs it (`data/crm.db`, git-ignored). No env file is required.

> Tip: sign in as both users in two browser windows to watch changes made in
> one show up in the other.

### Scripts

| Command             | What it does                                                    |
| ------------------- | --------------------------------------------------------------- |
| `npm run dev`       | Development server on port 3000                                 |
| `npm run build`     | Production build                                                |
| `npm start`         | Serve the production build                                      |
| `npm run lint`      | ESLint                                                          |
| `npm run typecheck` | Generate route types and run `tsc --noEmit`                     |
| `npm run db:reset`  | Delete the database; it is re-seeded on the next start          |

Stop the server before `npm run db:reset`: a running server keeps the old
database file open.

### Configuration

Everything has a development default. See [`.env.example`](./.env.example).

| Variable         | Default               | Description                                                                 |
| ---------------- | --------------------- | --------------------------------------------------------------------------- |
| `SESSION_SECRET` | built-in dev secret   | Signs the session cookie. **Set your own outside development** (`openssl rand -base64 32`). |
| `DB_PATH`        | `./data/crm.db`       | Location of the SQLite database.                                            |
| `COOKIE_SECURE`  | `true` in production  | Set to `false` to serve a production build over plain HTTP.                 |

### Docker

```bash
docker compose up --build
# open http://localhost:3000
```

Builds the app and serves the production build from one container, with the
database in a named volume. `docker compose down -v` starts over with fresh
data.

---

## Features

- **Authentication** — sign in / sign out with a session cookie; every page
  except the login is protected.
- **Dashboard** — totals for contacts, companies, deals and open tasks;
  open/won/lost deals and win rate; invoice rollups; a deals-by-stage chart;
  and the live activity feed.
- **Contacts** — create, edit, delete, search and filter by status; a detail
  page with the contact's deals and notes, and a shortcut to add a linked task.
- **Companies** — create, edit, delete and search; a detail page with the
  company's contacts, deals and notes.
- **Deals** — a Kanban board per pipeline. Drag cards between columns; add,
  rename, retype (Open / Won / Lost), reorder (drag) and delete columns; create,
  rename and delete pipelines. The selected pipeline is part of the URL
  (`/deals/sales-pipeline`).
- **Invoices** — line items, per-invoice tax rate, automatic numbers
  (`INV-0001`), totals computed on the server, status changes (draft → sent →
  paid / overdue / void) and a printable invoice page.
- **Tasks** — optionally linked to a contact, company or deal; priority, due
  date, complete / reopen, tabs for open, completed and all.
- **Notes & activity** — notes on contacts and companies; creates, updates,
  deletes, stage changes and completed tasks are logged to the activity feed.
- **Live updates** — changes made by anyone show up for everyone who is signed
  in, without reloading.
- **Appearance** — nine primary color presets, saved per browser and applied
  before the first paint.

---

## How it is built

**Stack:** Next.js 16 (App Router, Cache Components, Turbopack), React 19,
TypeScript, Tailwind CSS 4, SQLite via `better-sqlite3`, Radix UI primitives,
`jose` for the session token, `zod` for validation, Recharts, lucide-react and
sonner.

### Project structure

```
db/schema.sql              Database schema (same as the original app)
scripts/db-reset.mjs       npm run db:reset
src/
├── proxy.ts               Optimistic auth redirect, before rendering
├── app/
│   ├── layout.tsx         Root layout: font, metadata, color preset script
│   ├── login/             Login page + form
│   ├── (app)/             Everything behind the login
│   │   ├── layout.tsx     Sidebar, top bar, live connection
│   │   ├── page.tsx       Dashboard
│   │   ├── contacts/      List + [id] detail
│   │   ├── companies/     List + [id] detail
│   │   ├── deals/         Redirect + [slug] board
│   │   ├── invoices/      List + [id] detail
│   │   ├── tasks/
│   │   ├── settings/
│   │   └── loading.tsx, error.tsx, not-found.tsx
│   └── api/events/route.ts  The live feed (Server-Sent Events)
├── components/
│   ├── ui/                Buttons, dialogs, selects, tables… (design system)
│   ├── contacts/ companies/ deals/ invoices/ tasks/   Interactive leaves
│   ├── filters/           Search box, select filter, pagination (URL-bound)
│   ├── layout/ live/ theme/ settings/ dashboard/
│   └── notes-panel.tsx, confirm-dialog.tsx, empty-state.tsx, …
├── hooks/                 useFormAction, useAction
└── lib/
    ├── dal/               Data access layer (server-only reads)
    ├── actions/           Server Actions (all writes)
    ├── db/                Connection, migration, seed
    ├── session.ts         Session cookie (sign, verify, set, delete)
    ├── events.ts          In-process event hub behind the live feed
    ├── activity.ts        Activity log
    ├── validation.ts      zod schemas for every form
    ├── revalidate.ts      Which routes show which data
    └── constants.ts, format.ts, theme.ts, types.ts, utils.ts, …
```

### Server Components read the data

Pages and layouts are Server Components. They call the **data access layer**
in [`src/lib/dal`](./src/lib/dal) directly and render HTML; the browser never
requests JSON.

- Every file in `src/lib/dal` starts with `import "server-only"`, so it cannot
  end up in a client bundle.
- Every data function starts with `verifySession()`
  ([`dal/auth.ts`](./src/lib/dal/auth.ts)), which checks the session cookie and
  that its user still exists, and redirects to `/login` otherwise. Protection
  lives next to the data, not in a layout.
- Functions return only what the UI needs. The password hash never leaves
  `dal/auth.ts`.

The app runs with **Cache Components**. Each route has a static shell (sidebar,
page title, filters, loading states) that is prerendered at build time, and
everything that reads the session or the database streams in behind a
`<Suspense>` boundary or a `loading.tsx`. CRM data is deliberately *not* cached
(`use cache`): it has to be fresh for every user on every request.

Search, filters, tabs and pagination live in the URL (`?q=`, `?status=`,
`?page=`) and are applied in SQL on the server. The small client components in
`components/filters` only update the URL.

### Server Actions change the data

All writes are Server Actions in [`src/lib/actions`](./src/lib/actions), one
file per resource. Each action:

1. checks the session itself (`verifySession()`); it never trusts that the
   page it was called from was protected;
2. validates its input with zod ([`lib/validation.ts`](./src/lib/validation.ts));
3. writes to SQLite, logs an activity and publishes a live event;
4. calls `revalidatePath` for the routes that show that data
   ([`lib/revalidate.ts`](./src/lib/revalidate.ts)), so the response to the
   action already carries the updated UI.

On the client:

- The form dialogs submit with `<form action>` and `useActionState`
  ([`hooks/use-form-action.ts`](./src/hooks/use-form-action.ts)): pending
  buttons, a toast for the result, and the typed values are kept when the
  server rejects the form.
- Dragging a deal or a column, ticking a task and adding or removing a note
  use `useOptimistic`, so the UI moves immediately and settles on the server's
  answer.
- Buttons that are not forms (delete, change status) call the action inside a
  transition ([`hooks/use-action.ts`](./src/hooks/use-action.ts)).

`"use client"` is only on those interactive leaves: dialogs and their trigger
buttons, the board, the notes panel, the chart, the URL filters, the color
picker and the live connection.

### Authentication

Follows the Next.js authentication guide:

- The login form posts to the `login` Server Action, which checks the password
  (bcrypt) and stores a signed token (HS256, 7 days) in an **httpOnly**,
  `SameSite=Lax` cookie. `logout` deletes it.
- [`src/proxy.ts`](./src/proxy.ts) does the *optimistic* check: it redirects
  on the cookie alone before anything renders, and never touches the database.
- The *real* check is `verifySession()` in the data layer and in every Server
  Action, plus the live feed endpoint.

Both users can do everything. Like the original, roles are stored and shown
but not enforced.

### Live feed

The original pushes updates over a WebSocket. Next.js has no WebSocket server,
so this version uses **Server-Sent Events from a streaming Route Handler**
plus the router:

1. After every write, the Server Action publishes a small event
   (`{ type: "deal.updated", id: 7 }`) on an in-process hub
   ([`lib/events.ts`](./src/lib/events.ts)).
2. [`app/api/events/route.ts`](./src/app/api/events/route.ts) keeps a
   `text/event-stream` response open per signed-in browser and writes each
   event to it. It checks the session, and sends heartbeats so proxies keep
   the connection alive.
3. In the browser, [`LiveProvider`](./src/components/live/live-provider.tsx)
   listens with `EventSource` and calls `router.refresh()`. The Server
   Components on screen render again with fresh data: the activity feed, the
   dashboard numbers, lists, the board, notes. Client state such as open
   dialogs and typed input is preserved.

The stream carries no CRM data, only "something changed". The data always
arrives through Server Components, with the same session checks as any page
load. This is the only Route Handler in the app.

The "Live / Offline" dot in the top bar shows the state of that connection.

### Primary color

The color preset is a per-browser preference, so it stays in `localStorage`
(like the original). An inline script in the root layout applies it to
`<html data-color="…">` before the first paint, which keeps every page's static
shell cacheable and avoids a flash of the default color.

---

## Differences from the original

Same features, with a few intentional changes:

- **Sessions** are an httpOnly cookie instead of a token in `localStorage`.
- **Live feed** uses Server-Sent Events and re-renders on the server (see
  above) instead of WebSocket messages handled in the browser. The stream
  requires a session; the original socket was open to anyone.
- **Calendar dates** (close dates, due dates, invoice dates) are shown as
  stored. The original parses them as UTC, so west of UTC it shows the previous
  day.
- **Editing an invoice from the list** loads its line items. In the original
  that form opens with an empty item list.
- **Search boxes** update the URL after a short pause (250 ms) instead of on
  every keystroke, and the contact and invoice tables paginate at 25 rows.
- **Server-side validation** is stricter (enums, dates, ids, email format).
- **Font**: Inter, loaded with `next/font`, instead of the system font.
- **No JSON API**: there is nothing like `GET /api/contacts` to call from
  outside the app.

## Known limitations

This is a demo, kept deliberately simple:

- **Single process.** The live feed hub and the database connection live in
  the Node.js process, and SQLite is a local file. Run one instance; it will
  not work on serverless platforms or behind a load balancer without moving
  the hub to something shared (Redis pub/sub, Postgres `LISTEN/NOTIFY`).
- **Single workspace, roles not enforced.** No tenants, no per-role
  permissions.
- **Dates and times are formatted on the server**, in the server's time zone
  and in English.
- **No account management.** Users are seeded; there is no sign-up, password
  reset or profile editing.
- **No rate limiting** on the login form.
- **No automated tests.**
- **Notes on deals** are supported by the data layer and the `addNote` action
  but, as in the original, no screen shows them.
