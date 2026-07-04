# STACK.md — Technology Stack & Setup

> `package.json` pins almost every dependency to `"latest"` rather than a real semver range — that's deliberate (see `CLAUDE.md`'s "always latest" rule). The table below lists what `"latest"` **actually resolved to** as of the last audit (`npm ls --depth=0` inside the dev container), not the aspirational versions from the original plan. Re-run that command before trusting exact patch versions long after this doc was written.

## Core Framework

| Package | Resolved version | Notes |
|---|---|---|
| next | **16.2.9** | App Router. Not 15.x — the app has moved to Next.js 16. `next dev` runs with `--turbopack`. |
| react / react-dom | **19.2.7** | |
| typescript | **6.0.3** | Not 5.x — TypeScript 6. Strict mode, no `any`. |
| tailwindcss | **4.3.1** | CSS-first config — **no `tailwind.config.ts` exists**. Config lives entirely in `app/globals.css` via `@import "tailwindcss";` + `@plugin "tailwindcss-animate";`. |
| @tailwindcss/postcss | **4.3.1** | Required by Tailwind v4; wired in `postcss.config.mjs`. |
| prisma / @prisma/client | **7.8.0** | Not 6.x. Uses the new `prisma.config.ts` connection model (see below), not a `url =` line in `schema.prisma`. |
| next-auth | package.json says `"beta"`, **resolves to 4.24.14** | v4 stable, not v5 beta. See `AUTH.md` for the v5-shim pattern used to keep the rest of the app's `auth()` calls uniform. |
| @auth/prisma-adapter | 2.11.2 | **Installed but unused** — Credentials+JWT strategy doesn't need a DB session adapter. |
| zod | **4.4.3** | Not 3.x — Zod v4. |
| zustand | 5.0.14 | |
| @tanstack/react-query / -devtools | 5.101.2 | |
| lucide-react | 1.22.0 | |
| date-fns | 4.4.0 | |
| resend | 6.16.0 | |
| bcryptjs | 3.0.3 | Password hashing, 12 rounds. |
| react-hook-form / @hookform/resolvers | 7.80.0 / latest | |
| jsPDF | 4.2.1 | **This is the actual PDF library** for bill generation (`lib/billPdf.ts`), client-side. |
| @react-pdf/renderer | 4.5.1 | Installed but **not used anywhere** in the codebase — dead dependency, candidate for removal. |
| axios | 1.18.1 | Installed but **not imported anywhere** — the app uses `fetch` exclusively. Dead dependency. |
| pg / @prisma/adapter-pg | 8.22.0 / 7.8.0 | Prisma 7 driver-adapter pattern — see below. |
| dotenv | 17.4.2 | Used by `prisma.config.ts` and `prisma/seed.ts` to load `.env.local` outside of Next's own env loading. |

**Install command:** `npm install <package>@latest` — always latest, no version pinning, per project convention.

## Prisma 7 connection model (breaking change from v6 assumptions)

- `schema.prisma`'s `datasource db` block has **no `url` or `directUrl`** — just `provider = "postgresql"`.
- **Runtime** connection: `lib/prisma.ts` builds a `pg.Pool` from `DATABASE_URL` and wraps it in `@prisma/adapter-pg`'s `PrismaPg` adapter, passed to `new PrismaClient({ adapter })`. This is what the running Next.js app actually queries through — pgBouncer transaction pooler, port 6543.
- **CLI/tooling** connection: `prisma.config.ts` at the repo root defines `datasource: { url: process.env.DIRECT_URL }` and the seed command. `prisma migrate`, `prisma db seed`, `prisma studio` all go through this — Supabase direct connection, port 5432.
- `prisma/seed.ts` independently constructs its own `pg.Pool`/`PrismaPg`/`PrismaClient` from `DATABASE_URL` (not `DIRECT_URL`) since it's really an app-level script, not a migration.

## Styling

- Tailwind v4, CSS-based config only — see `UI.md` for the full `--df-*` custom property system (indigo/violet theme, dark + light).
- `tailwindcss-animate` plugin loaded via `@plugin` directive.
- No shadcn/ui CLI scaffolding was ever adopted — there's no `components.json`. `@radix-ui/react-*` primitives are installed and used directly, hand-wired into custom components under `components/ui/`, `components/shared/`, `components/layout/` — not shadcn-generated files.

## Routing / middleware

- `proxy.ts` at the repo root — Next.js 16 renamed `middleware.ts` to `proxy.ts` (same runtime mechanism). Handles `/admin/*` route protection via `next-auth/jwt`'s `getToken`.

## `next.config.ts`

```ts
const nextConfig: NextConfig = {
  output: 'standalone',   // required for the Docker multi-stage build
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],  // tenant logos via Supabase storage
  },
}
```

## Database

PostgreSQL via Supabase. Two connection strings, both required (`.env.local`):
- `DATABASE_URL` — pgBouncer transaction pooler, port **6543**, used by the running app.
- `DIRECT_URL` — direct connection, port **5432**, used only by Prisma CLI tooling.

There is no AWS/self-hosted-Postgres phase in the code today — the "Phase 2: migrate to Neon/VPS" idea from earlier planning docs hasn't been started; Supabase is the only datastore currently wired up.

## Dead dependencies (safe to remove, not currently used by anything)

- `axios` — everything uses `fetch`.
- `@react-pdf/renderer` — PDF generation uses `jsPDF` instead.
- `@auth/prisma-adapter` — JWT strategy needs no adapter.

Don't remove these speculatively without checking again first — this list reflects a point-in-time grep, not a guarantee nothing was added since.
