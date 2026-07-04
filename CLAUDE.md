# CLAUDE.md — DineFlow POS Master Instructions

> **Read this file first before touching any code.**
> This is the master instruction file for Claude Code.
> Every decision, every file, every component must follow what is written here.
> When in doubt — come back to this file.
>
> **This is a working, already-built application** — not a greenfield plan. Before assuming something works a certain way, read the actual file. The `claude/*.md` docs describe the real current implementation and are kept in sync deliberately; if you find drift between a doc and the code, trust the code and flag/update the doc.

---

## What Is DineFlow?

DineFlow is a **multi-tenant Restaurant POS and Management SaaS** built with **Next.js 16 (App Router, React 19)**.
Each restaurant that signs up gets their own isolated workspace (tenant).
One codebase serves unlimited restaurants — data is always isolated by `tenantId`.

---

## Package Versions — Always Use Latest

> **RULE: Always install the latest stable version of every package. Never pin to old versions.**

`package.json` pins almost everything to `"latest"` on purpose. Below is what that actually resolved to as of the last audit — see `claude/STACK.md` for the full list, including dead dependencies and version-reality notes (e.g. `next-auth` says `"beta"` but resolves to v4, not v5).

| Package | Resolved | Notes |
|---|---|---|
| next | 16.2.9 | App Router, React 19, `--turbopack` in dev |
| react / react-dom | 19.2.7 | |
| typescript | 6.0.3 | Strict mode |
| tailwindcss | 4.3.1 | CSS-based config — no `tailwind.config.ts` exists |
| @tailwindcss/postcss | 4.3.1 | Required for v4 |
| prisma / @prisma/client | 7.8.0 | `prisma.config.ts`-driven connection, not `url=` in schema |
| next-auth | resolves to 4.24.14 | v4 API, wrapped in a v5-style `auth()` shim — see `claude/AUTH.md` |
| @auth/prisma-adapter | 2.11.2 | installed, unused |
| zod | 4.4.3 | |
| zustand | 5.0.14 | |
| @tanstack/react-query | 5.101.2 | |
| lucide-react | 1.22.0 | |
| date-fns | 4.4.0 | |
| resend | 6.16.0 | |
| jsPDF | 4.2.1 | actual PDF library (not `@react-pdf/renderer`, which is installed but unused) |

**Install command:** `npm install <package>@latest` — always latest, no version pinning.

---

## Token & Secret Management

> This section governs ALL secret/token handling across the app. Never deviate from it.

### JWT Session Tokens (NextAuth v4, JWT strategy)
- Stored in **httpOnly cookie** — never accessible from JavaScript
- Contains: `id`, `role`, `tenantId`, `tenantName`, `tenantSlug`, `currency`, `permissions`, `lastCheckedAt`, `error?`
- **Lifetime: 15 days, sliding** (`maxAge: FIFTEEN_DAYS`), re-signed roughly once a day during activity (`updateAge: ONE_DAY`)
- Revalidated against the DB at most once an hour, or immediately on client-triggered refresh (route change / tab focus) — a deactivated user or suspended tenant is force-signed-out with an explanatory toast. Full detail in `claude/AUTH.md`.
- Secret: `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`, set explicitly in `authOptions.secret`
- Rotate by updating `NEXTAUTH_SECRET` env var (all active sessions immediately invalidated)

### Required Environment Variables (all must be set before app starts)
```bash
DATABASE_URL         # Supabase transaction pooler URL (pgBouncer, port 6543) — runtime queries
DIRECT_URL           # Supabase direct connection URL (port 5432) — Prisma CLI (migrate/seed/studio) only
NEXTAUTH_URL         # App URL e.g. http://localhost:3000
NEXTAUTH_SECRET      # openssl rand -base64 32
RESEND_API_KEY       # From resend.com dashboard
RESEND_FROM_EMAIL    # Verified sender email
NEXT_PUBLIC_APP_URL  # Same as NEXTAUTH_URL
NEXT_PUBLIC_APP_NAME # "DineFlow"
```

### Docker Build — Secret Injection Pattern
```bash
# Development (hot reload, serves on :3001, uses Dockerfile.dev)
docker compose up

# Production build (secrets injected at runtime, NOT build time; Dockerfile serves on :3000)
docker build -t dineflow .
docker run -p 3000:3000 --env-file .env.local dineflow
```

### Security Rules
- **Never** bake secrets into Docker image layers (no `ENV SECRET=value` in Dockerfile)
- **Never** commit `.env.local` — it's in `.gitignore`
- **Always** use `--env-file .env.local` or `-e KEY=value` at `docker run` time
- Prisma `DATABASE_URL` uses pgBouncer (transaction pooler) for app queries, via `@prisma/adapter-pg` in `lib/prisma.ts`
- Prisma `DIRECT_URL` uses direct connection — configured in `prisma.config.ts`, used only by CLI tooling
- API keys (Resend) rotate in provider dashboard then update env — zero code changes

### Token Validation in Every API Route
```typescript
// REQUIRED pattern — never skip
const session = await requireAuth()  // throws AuthError if no valid/active session
// session.tenantId is guaranteed safe to use
```

---

## Read These Files in Order Before Writing Any Code

All reference MD files are located inside the `claude/` folder at the root of this repo.

```
1. CLAUDE.md                ← you are here (repo root)
2. claude/STACK.md          ← exact resolved packages, versions, dead dependencies
3. claude/SCHEMA.md         ← full Prisma schema (embedded verbatim), conventions, what's schema-only vs. wired up
4. claude/AUTH.md           ← NextAuth v4 (behind a v5-style shim), JWT lifecycle, revalidation, roles
5. claude/FEATURES.md       ← every shipped page/feature, and what's explicitly NOT built yet
6. claude/API.md            ← every API route, method, auth requirement, request/response shape
7. claude/UI.md             ← design system: indigo/violet color tokens, toast system, layout components
8. claude/ADMIN.md          ← super admin panel — real routes, what's aspirational vs. built
9. claude/CICD.md           ← the actual single GitHub Actions workflow + Docker setup
10. claude/DEVOPS.md        ← future AWS setup (read when scaling, not now — nothing in it has started)
```

---

## Core Rules — Never Break These

### 1. TypeScript Everywhere
- Every file is `.ts` or `.tsx` — no `.js` files ever
- No `any` type — ever. Use `unknown` and narrow it
- Every function has explicit return types
- Every API response has a typed interface
- Zod validates every form input and API request body

### 2. Multi-Tenant Isolation — Most Critical Rule
- Every database query MUST include `where: { tenantId: session.tenantId }` (except `SUPER_ADMIN`-only admin routes, which explicitly manage across tenants)
- Never query without tenantId filter unless you are Super Admin
- Every API route starts with `requireAuth()` or `requireRole([...])` from `lib/middleware-helpers.ts`

```typescript
// ALWAYS do this pattern in every API route
const session = await requireAuth()
// session.tenantId is guaranteed here

const data = await prisma.order.findMany({
  where: { tenantId: session.tenantId } // never skip this
})
```

### 3. Audit trail on every write
Every business table has `createdById`/`updatedById` (nullable UUID FK to `User`) alongside `createdAt`/`updatedAt`. Every `create`/`update` route must set these from `session.userId`:
```typescript
await prisma.order.create({
  data: { ...payload, tenantId: session.tenantId, createdById: session.userId, updatedById: session.userId },
})
```
See `claude/SCHEMA.md` for which models have this (all business models — check before assuming a new model needs it too).

### 4. Soft delete via `isActive`, not hard delete
Resources with an `isActive` column (`Tenant, User, Customer, Category, MenuItem, InventoryItem, Order, RestaurantTable, Announcement`) are never `DELETE`d from the DB — every delete route sets `isActive: false`, and every list/get route filters `isActive: true`.

### 5. Server Components by Default
- Use React Server Components unless you need interactivity
- Only add `'use client'` when you need: useState, useEffect, event handlers, browser APIs
- Keep client components small and leaf-level

### 6. Error Handling
- Every API route wrapped in try/catch, returning `NextResponse.json({error}, {status})` — there is no shared response helper (`lib/api-response.ts` does not exist), so match the pattern of the file you're editing
- Never expose internal errors to client
- Log errors server-side with context

### 7. Toast notifications — one system only
`useToast()` from `@/components/providers/ToastProvider` — never import from `@/hooks/useToast` (deleted, was dead/duplicate code). Every create/update/delete action should surface a toast; a silently-swallowed `.catch(() => {})` is a bug.

### 8. Environment Variables
- Never hardcode secrets
- All secrets in `.env.local` (never committed)
- All env vars in `.env.example` with placeholder values
- Access via `process.env.VARIABLE_NAME` with null check

### 9. File Naming Conventions
```
Components:     PascalCase     → OrderCard.tsx
Utilities:      camelCase      → formatCurrency.ts
API routes:     kebab-case     → /api/orders/[id]/route.ts
Types:          PascalCase     → types/Order.ts
Hooks:          camelCase      → hooks/useOrders.ts
Constants:      SCREAMING_SNAKE → constants/GST_RATES.ts
```

### 10. Component Structure
```tsx
// Every component follows this order:
// 1. Imports
// 2. Types/Interfaces
// 3. Constants (if local)
// 4. Component function
// 5. Helper functions (if small and only used here)
// 6. Export
```

---

## Project Structure (actual, as of the last audit)

> Don't hand-write a new file into a location this doesn't show without first checking `find` — the app has grown organically (chat, announcements, tables, kitchen view) beyond any original plan.

```
dine_flow/
├── .github/workflows/
│   └── deploy.yml               ← the ONLY workflow: push to `live` → vercel build+deploy (no separate CI/lint gate)
├── app/
│   ├── (admin)/admin/
│   │   ├── login/                        ← /admin/login
│   │   └── (protected)/
│   │       ├── dashboard/                ← /admin/dashboard
│   │       ├── tenants/                  ← /admin/tenants (list+create+manage, all in one page — no /new or /[id])
│   │       ├── announcements/            ← /admin/announcements
│   │       └── chat/                     ← /admin/chat
│   ├── (auth)/
│   │   ├── login/, register/, forgot-password/
│   │   └── (no invite/[token] route — Invite model exists but is unused)
│   ├── (dashboard)/
│   │   ├── dashboard/, orders/, orders/[id]/, new-order/, check-order/,
│   │   ├── menu/, inventory/, customers/ (no [id] page yet), reports/,
│   │   ├── kitchen/, chat/, announcements/,
│   │   └── settings/, settings/gst/, settings/team/, settings/tables/
│   ├── api/
│   │   ├── auth/[...nextauth]/, auth/register/
│   │   ├── admin/tenants/, admin/tenants/[id]/, admin/announcements/, admin/announcements/[id]/
│   │   ├── announcements/, announcements/[id]/read/, announcements/unread-count/
│   │   ├── chat/community/, chat/direct/, chat/direct/[tenantId]/, chat/unread/
│   │   ├── orders/, orders/[id]/
│   │   ├── customers/, customers/[id]/
│   │   ├── menu/, menu/[id]/, menu/categories/, menu/categories/[id]/
│   │   ├── inventory/, inventory/[id]/
│   │   ├── reports/
│   │   ├── settings/, settings/gst/
│   │   ├── team/, team/[id]/
│   │   ├── tables/, tables/[id]/
│   │   └── health/                        ← public, used by Docker healthchecks
│   ├── layout.tsx, globals.css, page.tsx  ← root layout + public marketing landing page
├── components/
│   ├── ui/                     ← hand-built primitives (no shadcn CLI scaffolding, no components.json)
│   ├── admin/AdminShell.tsx
│   ├── announcements/, chat/, billing/ (PrintBillButton → jsPDF)
│   ├── layout/                 ← DashboardShell.tsx, Sidebar.tsx, Topbar.tsx, MobileNav.tsx
│   ├── providers/              ← ToastProvider.tsx (the only toast system), SessionSyncProvider.tsx
│   └── shared/                 ← PageHeader, StatCard, EmptyState, LoadingSpinner, ConfirmDialog, UnreadDot
├── lib/
│   ├── auth.ts                 ← NextAuth v4 config + v5-style auth() shim
│   ├── prisma.ts               ← Prisma client via @prisma/adapter-pg + pg.Pool
│   ├── gst.ts, currency.ts, billPdf.ts, email.ts
│   ├── middleware-helpers.ts   ← requireAuth, requireRole, AuthError
│   ├── tenant-defaults.ts      ← seedTenantDefaults() — default categories/menu/inventory/tables for new tenants
│   ├── orderNumber.ts, password.ts, utils.ts
│   └── validations/            ← auth, order, menu, inventory, customer, chat, announcement
├── hooks/                      ← useTheme, useCurrency, useAnnouncements, useChat
├── types/                      ← next-auth.d.ts, api.ts, announcement.ts, chat.ts
├── constants/                  ← GST_RATES.ts, ORDER_STATUS.ts, ROLES.ts (roles/permissions/modules)
├── prisma/
│   ├── schema.prisma           ← uuid(7) ids, createdById/updatedById audit cols, isActive soft-delete
│   └── seed.ts                 ← seeds ONE SUPER_ADMIN account only, no demo restaurant
├── proxy.ts                    ← Next.js 16's renamed middleware.ts — route protection for /admin/*
├── Dockerfile, Dockerfile.dev, docker-compose.yml, docker-compose.prod.yml
├── next.config.ts              ← output: 'standalone', Supabase image remote pattern
├── prisma.config.ts            ← Prisma 7 CLI connection config (DIRECT_URL) + seed command
├── .env.example, .env.local (never commit)
└── package.json
```

**No `tailwind.config.ts`** (Tailwind v4 CSS-first config, in `globals.css`). **No `middleware.ts`** (renamed `proxy.ts`). **No `lib/api-response.ts`**. **No `app/api/invite/**` or `app/api/cron/**`**.

---

## Current Status — read `claude/FEATURES.md` for the full list

The MVP described in earlier planning is essentially done, plus several features that weren't originally planned (kitchen display, team chat, announcements, table management). What's explicitly **not** built: staff email-invite flow, subscription auto-expiry (no cron exists anywhere), `SubscriptionPayment` recording, `RestockLog` creation, low-stock alerting, GSTR-1 export, customer detail page. Don't assume any of these exist — check `claude/API.md`/`claude/SCHEMA.md` first.

Payment gateway integration (Razorpay), WhatsApp/SMS notifications, customer-facing online menu, and self-hosted Postgres migration remain future/unstarted, same as originally planned.

---

## Key Business Logic Rules

### GST Calculation (`lib/gst.ts`)
- Calculate GST per item based on item's `gstRate`
- Split equally into CGST and SGST (e.g. 5% = 2.5% CGST + 2.5% SGST)
- Grand Total = Subtotal (base) + Total GST
- Store `subtotal`, `totalGST`, `totalCGST`, `totalSGST`, `grandTotal` on every order
- Never round mid-calculation — only round final display values

### Order Flow
```
PENDING → IN_PROGRESS → READY → SERVED / DELIVERED → COMPLETED   (or → CANCELLED at any point)
```
- `SERVED` = dine-in, `DELIVERED` = parcel/delivery
- Once `COMPLETED` — status shouldn't go backwards (enforced by API convention, not a DB constraint)
- Payment can be collected at any stage
- Orders are soft-deleted (`isActive: false`), never hard-deleted

### Multi-Tenant Registration
- Registering (`POST /api/auth/register`) creates: Tenant + Owner User + GSTConfig + Subscription(LIFETIME) + default categories/menu/inventory/tables, all in one transaction
- Tenant gets a unique `id` — **`uuid(7)`, not `cuid()`** — used as `tenantId` on all records
- Owner role cannot be deleted (blocked in `DELETE /api/team/[id]`) or reassigned via the team API

### Primary keys
Every model's `id` is `String @id @default(uuid(7)) @db.Uuid` — time-sortable UUIDs, native Postgres `uuid` column. Every foreign key matches (`@db.Uuid`). See `claude/SCHEMA.md`.

---

## Working in this repo going forward

This is not a "build from scratch" project anymore. When asked to add or change something:
1. Check `claude/*.md` first — they're kept current and will tell you what already exists and what's a known gap.
2. If a doc and the code disagree, the code wins — and the doc should be corrected as part of your change, not left stale.
3. Follow the existing patterns in neighboring files (e.g. copy the shape of a sibling `route.ts` rather than inventing a new response format).
