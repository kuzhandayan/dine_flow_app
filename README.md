# DineFlow POS

Multi-tenant Restaurant POS and Management SaaS — Next.js 16, React 19, Prisma 7, Supabase Postgres, NextAuth (JWT).

---

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env.local
# Fill in your Supabase DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, etc.
```

### 3. Run database migration
```bash
npm run db:migrate
# or: npx prisma migrate dev --name <migration-name>
```

### 4. Seed the platform admin account
```bash
npm run db:seed
# Creates one SUPER_ADMIN user (email/password hardcoded in prisma/seed.ts —
# change them there before running against a real database).
# This does NOT create a demo restaurant/tenant. To get a restaurant workspace,
# either self-register at /register, or sign in as SUPER_ADMIN at /admin/login
# and create a tenant from the admin panel.
```

### 5. Start development server
```bash
npm run dev
# App runs at http://localhost:3000 (bare npm run dev)
# App runs at http://localhost:3001 when started via `docker compose up` (Dockerfile.dev sets PORT=3001)
```

---

## All Commands

### Development
| Command | What it does |
|---|---|
| `npm run dev` | Start dev server with Turbopack hot reload |
| `npm run build` | Production build |
| `npm run start` | Start production server (after build) |
| `npm run lint` | Run ESLint (note: no `eslint.config.js` is currently committed — running this will error until one is added) |
| `npm run type-check` | TypeScript check without emitting |
| `npm run format` | Prettier format all files |

### Database (Prisma 7)
| Command | What it does |
|---|---|
| `npm run db:migrate` | Create + apply a new migration (dev) |
| `npm run db:seed` | Seed the platform SUPER_ADMIN account |
| `npm run db:push` | Push schema changes without migration file (quick dev) |
| `npm run db:studio` | Open Prisma Studio GUI to browse data in browser |
| `npm run db:generate` | Regenerate Prisma client after schema change |
| `npx prisma migrate deploy` | Apply pending migrations in production |
| `npx prisma migrate reset` | ⚠️ Drop all data and re-run migrations from scratch |
| `npx prisma migrate status` | Check which migrations are applied |

### Docker — Development (hot reload)
```bash
# Start dev server inside Docker (serves on :3001, see Dockerfile.dev)
docker compose up

# Rebuild after package.json changes
docker compose up --build

# Run in background
docker compose up -d

# Stop
docker compose down

# View logs
docker compose logs -f app
```

### Docker — Production
```bash
# Build production image (Dockerfile sets PORT=3000)
docker build -t dineflow .

# Run with env file (secrets injected at runtime, NOT baked into image)
docker run -p 3000:3000 --env-file .env.local dineflow
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Settings → Database → Transaction pooler URL (port 6543) — used by the app at runtime via `@prisma/adapter-pg` |
| `DIRECT_URL` | Supabase → Settings → Database → direct connection (port 5432) — used only by `prisma.config.ts` for migrations/seed/studio |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your app URL e.g. `http://localhost:3000` |
| `RESEND_API_KEY` | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | Verified sender email on Resend |
| `NEXT_PUBLIC_APP_URL` | Same as `NEXTAUTH_URL` |
| `NEXT_PUBLIC_APP_NAME` | `DineFlow` |

---

## Getting a Login

There is no seeded demo restaurant. Two ways to get in:

1. **Self-register a restaurant** — visit `/register`, which creates a `Tenant` + `OWNER` user in one transaction (`app/api/auth/register`).
2. **Platform admin** — after `npm run db:seed`, sign in at `/admin/login` with the `SUPER_ADMIN` credentials set in `prisma/seed.ts`, then create restaurant tenants from the admin panel (`/admin/tenants/new`).

Session lifetime: JWT sessions last up to **15 days** of inactivity (sliding — refreshed roughly once a day while active). Deactivated accounts / suspended tenants are force-signed-out within an hour, or immediately on the next page navigation.

---

## Key Architecture Notes

**No `npx create-next-app` was used** — project bootstrapped manually for full version control over all files and package versions.

**Prisma 7 connection model:**
- `url` no longer lives in `schema.prisma`
- Runtime connection: `@prisma/adapter-pg` in `lib/prisma.ts` (pools via `DATABASE_URL`)
- Migration/seed/studio connection: `DIRECT_URL` in `prisma.config.ts`

**Multi-tenant isolation** — every single DB query must include `where: { tenantId }` — enforced via `requireAuth()` in `lib/middleware-helpers.ts`

**Primary keys** — all models use `uuid(7)` (time-sortable UUIDs, native Postgres `uuid` column via `@db.Uuid`), not `cuid()`.

**Audit trail** — every business table has `createdAt`/`updatedAt` plus nullable `createdById`/`updatedById` foreign keys to `User`, populated from the acting session's user id on every write. See `claude/SCHEMA.md`.

**Auth flow** — bcrypt hashes password (12 rounds) → NextAuth (v4, JWT strategy — see note below) verifies → JWT stored in httpOnly cookie → 15-day sliding session, revalidated against the DB at most once an hour (or immediately on client-triggered refresh) → deactivated/suspended accounts get force-signed-out with a toast explaining why. Full detail in `claude/AUTH.md`.

**NextAuth version note** — `package.json` specifies `"next-auth": "beta"`, but this currently resolves to `4.24.14` (stable v4), not the v5 beta the original stack plan called for. The auth code is written against the v4 API (`getServerSession`).

**Supabase URLs**:
- `DATABASE_URL` port **6543** = pgBouncer transaction pooler → used by app at runtime
- `DIRECT_URL` port **5432** = direct connection → used only by Prisma CLI (migrate/seed/studio)

**Docker secrets** — never baked into the image; always injected at `docker run` time via `--env-file .env.local`

**Toast notifications** — single system: `components/providers/ToastProvider.tsx` (`useToast()` context hook), mounted app-wide in `components/providers.tsx`. There is no other toast implementation in the codebase.

**Brand color** — indigo/violet (`--df-accent`), not orange. Dark theme uses an indigo-tinted near-black background; light theme uses a warm ivory background — see `claude/UI.md`.

---

## Tech Stack

Actual resolved versions (`npm ls --depth=0`), not aspirational ones — see `claude/STACK.md` for the full list and notes on unused/dead dependencies (`axios`, `@react-pdf/renderer`, `@auth/prisma-adapter` are installed but not currently wired into any code path; PDF generation actually uses `jsPDF`).

| Layer | Package |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript 6 (strict mode, no `any`) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 (`@prisma/adapter-pg` driver adapter) |
| Auth | NextAuth v4 (JWT strategy, 15-day sliding session) |
| Password | bcryptjs (12 rounds) |
| Styling | Tailwind CSS v4 (CSS-based config, indigo/violet theme) |
| Validation | Zod v4 |
| Forms | React Hook Form + @hookform/resolvers |
| State | Zustand + TanStack Query v5 |
| Email | Resend |
| PDF | jsPDF (client-side bill generation) |
| Icons | Lucide React |
