# DineFlow POS

Multi-tenant Restaurant POS and Management SaaS — Next.js 15, React 19, Prisma 7, Supabase.

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

### 4. Seed demo data
```bash
npm run db:seed
# Demo login: owner@demo.com / demo1234
```

### 5. Start development server
```bash
npm run dev
# App runs at http://localhost:3000
```

---

## All Commands

### Development
| Command | What it does |
|---|---|
| `npm run dev` | Start dev server with Turbopack hot reload at :3000 |
| `npm run build` | Production build |
| `npm run start` | Start production server (after build) |
| `npm run lint` | Run ESLint |
| `npm run type-check` | TypeScript check without emitting |
| `npm run format` | Prettier format all files |

### Database (Prisma 7)
| Command | What it does |
|---|---|
| `npm run db:migrate` | Create + apply a new migration (dev) |
| `npm run db:seed` | Seed demo restaurant + menu + inventory data |
| `npm run db:push` | Push schema changes without migration file (quick dev) |
| `npm run db:studio` | Open Prisma Studio GUI to browse data in browser |
| `npm run db:generate` | Regenerate Prisma client after schema change |
| `npx prisma migrate deploy` | Apply pending migrations in production |
| `npx prisma migrate reset` | ⚠️ Drop all data and re-run migrations from scratch |
| `npx prisma migrate status` | Check which migrations are applied |

### Docker — Development (hot reload)
```bash
# Start dev server inside Docker
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
# Build production image
docker build -t dineflow .

# Run with env file (secrets injected at runtime, NOT baked into image)
docker run -p 3000:3000 --env-file .env.local dineflow

# Or using docker compose
docker compose -f docker-compose.prod.yml up -d
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Supabase → Settings → Database → Transaction pooler URL (port 6543) |
| `DIRECT_URL` | Supabase → Settings → Database → Session pooler URL (port 5432) |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your app URL e.g. `http://localhost:3000` |
| `RESEND_API_KEY` | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | Verified sender email on Resend |
| `NEXT_PUBLIC_APP_URL` | Same as `NEXTAUTH_URL` |
| `NEXT_PUBLIC_APP_NAME` | `DineFlow` |

---

## Demo Credentials (after running seed)

| | |
|---|---|
| Email | `owner@demo.com` |
| Password | `demo1234` |
| Role | OWNER (full access to all features) |

---

## Key Architecture Notes

**No `npx create-next-app` was used** — project bootstrapped manually for full version control over all files and package versions.

**Prisma 7 connection model** (breaking change from v6):
- `url` no longer lives in `schema.prisma`
- Runtime connection: `@prisma/adapter-pg` in `lib/prisma.ts`
- Migration connection: `DIRECT_URL` in `prisma.config.ts`

**Multi-tenant isolation** — every single DB query must include `where: { tenantId }` — enforced via `requireAuth()` in `lib/middleware-helpers.ts`

**Auth flow** — bcrypt hashes password (12 rounds) → NextAuth v5 verifies → JWT stored in httpOnly cookie → 30-day session → rotate by changing `NEXTAUTH_SECRET`

**Supabase URLs**:
- `DATABASE_URL` port **6543** = pgBouncer transaction pooler → used by app at runtime
- `DIRECT_URL` port **5432** = direct connection → used only by `prisma migrate`

**Docker secrets** — never baked into the image; always injected at `docker run` time via `--env-file .env.local`

---

## Tech Stack

| Layer | Package |
|---|---|
| Framework | Next.js 15 (App Router), React 19 |
| Language | TypeScript 5 (strict mode, no `any`) |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 |
| Auth | NextAuth v5 beta (JWT strategy) |
| Password | bcryptjs (12 rounds) |
| Styling | Tailwind CSS v4 (CSS-based config) |
| Validation | Zod |
| Forms | React Hook Form + @hookform/resolvers |
| State | Zustand + TanStack Query v5 |
| Email | Resend |
| PDF | @react-pdf/renderer |
| Icons | Lucide React |
