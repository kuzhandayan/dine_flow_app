# CLAUDE.md — DineFlow POS Master Instructions

> **Read this file first before touching any code.**
> This is the master instruction file for Claude Code.
> Every decision, every file, every component must follow what is written here.
> When in doubt — come back to this file.

---

## What Is DineFlow?

DineFlow is a **multi-tenant Restaurant POS and Management SaaS** built with **Next.js 15 (App Router, React 19)**.
Each restaurant that signs up gets their own isolated workspace (tenant).
One codebase serves unlimited restaurants — data is always isolated by `tenantId`.

---

## Package Versions — Always Use Latest

> **RULE: Always install the latest stable version of every package. Never pin to old versions.**

| Package | Latest (as of build) | Notes |
|---|---|---|
| next | ^15.x | App Router, React 19 |
| react / react-dom | ^19.x | Latest stable |
| typescript | ^5.x | Strict mode |
| tailwindcss | ^4.x | CSS-based config |
| @tailwindcss/postcss | ^4.x | Required for v4 |
| prisma / @prisma/client | ^6.x | Latest ORM |
| next-auth | ^5.0.0-beta (latest beta) | Auth.js v5 |
| @auth/prisma-adapter | ^2.x | |
| zod | ^3.x | Latest |
| zustand | ^5.x | |
| @tanstack/react-query | ^5.x | |
| lucide-react | latest | |
| date-fns | ^4.x | |
| resend | latest | |

**Install command:** `npm install <package>@latest` — always latest, no version pinning.

---

## Token & Secret Management

> This section governs ALL secret/token handling across the app. Never deviate from it.

### JWT Session Tokens (NextAuth)
- Stored in **httpOnly cookie** — never accessible from JavaScript
- Contains: `userId`, `tenantId`, `role`, `name`, `email`, `tenantSlug`
- Lifetime: 30 days (`maxAge: 30 * 24 * 60 * 60`)
- Secret: `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- Rotate by updating `NEXTAUTH_SECRET` env var (all active sessions immediately invalidated)

### Required Environment Variables (all must be set before app starts)
```bash
DATABASE_URL         # Supabase transaction pooler URL (pgBouncer)
DIRECT_URL           # Supabase direct connection URL (for migrations only)
NEXTAUTH_URL         # App URL e.g. http://localhost:3000
NEXTAUTH_SECRET      # openssl rand -base64 32
RESEND_API_KEY       # From resend.com dashboard
RESEND_FROM_EMAIL    # Verified sender email
NEXT_PUBLIC_APP_URL  # Same as NEXTAUTH_URL
NEXT_PUBLIC_APP_NAME # "DineFlow"
```

### Docker Build — Secret Injection Pattern
```bash
# Development (with .env.local mounted)
docker compose up

# Production build (secrets injected at runtime, NOT build time)
docker build -t dineflow .
docker run -p 3000:3000 \
  -e DATABASE_URL="..." \
  -e DIRECT_URL="..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://yourdomain.com" \
  -e RESEND_API_KEY="..." \
  -e RESEND_FROM_EMAIL="..." \
  -e NEXT_PUBLIC_APP_URL="https://yourdomain.com" \
  -e NEXT_PUBLIC_APP_NAME="DineFlow" \
  dineflow
```

### Security Rules
- **Never** bake secrets into Docker image layers (no `ENV SECRET=value` in Dockerfile)
- **Never** commit `.env.local` — it's in `.gitignore`
- **Always** use `--env-file .env.local` or `-e KEY=value` at `docker run` time
- Prisma `DATABASE_URL` uses pgBouncer (transaction pooler) for app queries
- Prisma `DIRECT_URL` uses direct connection — only used during `prisma migrate`
- API keys (Resend) rotate in provider dashboard then update env — zero code changes

### Token Validation in Every API Route
```typescript
// REQUIRED pattern — never skip
const session = await requireAuth()  // throws AuthError if no valid session
// session.tenantId is guaranteed safe to use
```

---

---

## Read These Files in Order Before Writing Any Code

All reference MD files are located inside the `claude/` folder at the root of this repo.

```
1. CLAUDE.md                ← you are here (repo root)
2. claude/STACK.md          ← exact packages, versions, install commands
3. claude/SCHEMA.md         ← complete Prisma schema, all models
4. claude/AUTH.md           ← NextAuth v5 setup, JWT, roles, middleware
5. claude/FEATURES.md       ← every feature, every page, acceptance criteria
6. claude/API.md            ← all API routes, request/response types
7. claude/UI.md             ← design system, colors, components, layout rules
8. claude/ADMIN.md          ← super admin panel, tenant creation, subscriptions
9. claude/CICD.md           ← GitHub Actions CI/CD setup
10. claude/DEVOPS.md        ← future AWS setup (read when scaling, not now)
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
- Every database query MUST include `where: { tenantId: session.user.tenantId }`
- Never query without tenantId filter unless you are Super Admin
- Every API route starts with session check + tenantId extraction
- Helper function `requireAuth()` handles this — always use it

```typescript
// ALWAYS do this pattern in every API route
const session = await requireAuth(req)
// session.user.tenantId is guaranteed here

const data = await prisma.order.findMany({
  where: { tenantId: session.user.tenantId } // never skip this
})
```

### 3. Server Components by Default
- Use React Server Components unless you need interactivity
- Only add `'use client'` when you need: useState, useEffect, event handlers, browser APIs
- Keep client components small and leaf-level

### 4. Error Handling
- Every API route wrapped in try/catch
- Return typed error responses always
- Never expose internal errors to client
- Log errors server-side with context

### 5. Environment Variables
- Never hardcode secrets
- All secrets in `.env.local` (never committed)
- All env vars in `.env.example` with placeholder values
- Access via `process.env.VARIABLE_NAME` with null check

### 6. File Naming Conventions
```
Components:     PascalCase     → OrderCard.tsx
Utilities:      camelCase      → formatCurrency.ts
API routes:     kebab-case     → /api/orders/[id]/route.ts
Types:          PascalCase     → types/Order.ts
Hooks:          camelCase      → hooks/useOrders.ts
Constants:      SCREAMING_SNAKE → constants/GST_RATES.ts
```

### 7. Component Structure
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

## Project Structure

```
dineflow/
├── .github/
│   └── workflows/
│       ├── ci.yml              ← type check + lint on every PR
│       └── deploy.yml          ← deploy to Vercel on main push
├── app/
│   ├── (admin)/
│   │   ├── layout.tsx          ← admin layout (separate from dashboard)
│   │   ├── login/
│   │   │   └── page.tsx        ← /admin/login (hidden admin entry)
│   │   ├── dashboard/
│   │   │   └── page.tsx        ← platform overview
│   │   ├── tenants/
│   │   │   ├── page.tsx        ← all restaurants
│   │   │   ├── new/
│   │   │   │   └── page.tsx    ← create tenant + credentials
│   │   │   └── [id]/
│   │   │       └── page.tsx    ← tenant detail + subscription
│   │   ├── subscriptions/
│   │   │   └── page.tsx        ← all subscriptions, expiry management
│   │   └── reports/
│   │       └── page.tsx        ← platform-wide reports
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── register/
│   │   │   └── page.tsx
│   │   ├── forgot-password/
│   │   │   └── page.tsx
│   │   └── invite/
│   │       └── [token]/
│   │           └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          ← sidebar + topbar wrapper
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx        ← all orders list
│   │   │   └── [id]/
│   │   │       └── page.tsx    ← single order detail
│   │   ├── new-order/
│   │   │   └── page.tsx
│   │   ├── check-order/
│   │   │   └── page.tsx
│   │   ├── menu/
│   │   │   └── page.tsx
│   │   ├── inventory/
│   │   │   └── page.tsx
│   │   ├── customers/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       ├── page.tsx        ← general settings
│   │       ├── gst/
│   │       │   └── page.tsx
│   │       └── team/
│   │           └── page.tsx    ← invite staff, manage roles
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   ├── orders/
│   │   │   ├── route.ts        ← GET list, POST create
│   │   │   └── [id]/
│   │   │       └── route.ts    ← GET, PATCH, DELETE
│   │   ├── customers/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── menu/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── inventory/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── reports/
│   │   │   └── route.ts
│   │   └── invite/
│   │       ├── route.ts        ← POST create invite
│   │       └── [token]/
│   │           └── route.ts    ← GET validate, POST accept
│   ├── layout.tsx              ← root layout
│   └── globals.css
├── components/
│   ├── ui/                     ← shadcn/ui components (auto-generated)
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   └── MobileNav.tsx
│   ├── orders/
│   │   ├── OrderCard.tsx
│   │   ├── OrderTable.tsx
│   │   ├── OrderStatusBadge.tsx
│   │   └── BillPreview.tsx
│   ├── menu/
│   │   ├── MenuItemCard.tsx
│   │   └── MenuItemForm.tsx
│   ├── inventory/
│   │   ├── InventoryTable.tsx
│   │   └── StockBar.tsx
│   ├── billing/
│   │   ├── GSTBreakup.tsx
│   │   └── PrintBill.tsx
│   └── shared/
│       ├── StatCard.tsx
│       ├── PageHeader.tsx
│       ├── EmptyState.tsx
│       ├── LoadingSpinner.tsx
│       └── ConfirmDialog.tsx
├── lib/
│   ├── auth.ts                 ← NextAuth config
│   ├── prisma.ts               ← Prisma client singleton
│   ├── gst.ts                  ← GST calculation functions
│   ├── currency.ts             ← Indian currency formatting
│   ├── pdf.ts                  ← Bill PDF generation
│   ├── email.ts                ← Resend email client
│   ├── middleware-helpers.ts   ← requireAuth, requireRole
│   └── validations/
│       ├── order.ts            ← Zod schemas
│       ├── menu.ts
│       ├── inventory.ts
│       └── customer.ts
├── hooks/
│   ├── useOrders.ts
│   ├── useMenu.ts
│   ├── useInventory.ts
│   └── useCustomers.ts
├── types/
│   ├── next-auth.d.ts          ← extend NextAuth session types
│   ├── order.ts
│   ├── menu.ts
│   ├── inventory.ts
│   └── api.ts                  ← API response types
├── constants/
│   ├── GST_RATES.ts
│   ├── ORDER_STATUS.ts
│   └── ROLES.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                 ← demo data for development
├── public/
│   └── logo.svg
├── .env.example
├── .env.local                  ← never commit this
├── .eslintrc.json
├── .gitignore
├── middleware.ts               ← Next.js middleware for route protection
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Phase Plan

### Phase 1 — MVP (Build Now, Zero Cost)
- [ ] Project setup + all configs
- [ ] Auth (login, register, JWT session, roles)
- [ ] Multi-tenant isolation
- [ ] Dashboard
- [ ] New Order flow (customer search → menu → cart → place order)
- [ ] Orders management (list, filter, status updates)
- [ ] Check Order by ID
- [ ] Menu CRUD with GST rates
- [ ] Inventory CRUD with low stock alerts
- [ ] Customers management
- [ ] GST billing (CGST + SGST breakup on every bill)
- [ ] Print Tax Bill (PDF)
- [ ] Reports (revenue, GST, top items, monthly chart)
- [ ] Staff invite system
- [ ] Admin panel (tenant creation, subscription management)
- [ ] Subscription expiry + lockout
- [ ] Cron job for auto-expire subscriptions
- [ ] GitHub Actions CI/CD
- [ ] Deploy to Vercel

### Phase 2 — Scale (Future)
- [ ] Migrate DB to Neon.tech or VPS Postgres
- [ ] Razorpay payment gateway integration
- [ ] Kitchen Display Screen (KDS)
- [ ] WhatsApp/SMS order notifications
- [ ] Customer-facing online menu
- [ ] Stock deduction on order placement
- [ ] Advanced reports (GSTR-1 export)
- [ ] Super Admin panel (manage all tenants)

---

## Key Business Logic Rules

### GST Calculation
- Always calculate GST per item based on item's `gstRate`
- Split equally into CGST and SGST (e.g. 5% = 2.5% CGST + 2.5% SGST)
- Grand Total = Subtotal (base) + Total GST
- Store both `subtotal`, `totalGST`, `grandTotal` on every order
- Never round mid-calculation — only round final display values

### Order Flow
```
pending → inprogress → ready → served/delivered → completed
```
- `served` = dine-in
- `delivered` = parcel
- Once `completed` — status cannot go backwards
- Payment can be collected at any stage

### Multi-Tenant Registration
- Registering creates: Tenant record + Owner User record in one transaction
- Tenant gets unique `id` (cuid) used as `tenantId` on all records
- Owner role cannot be deleted or changed

---

## What Claude Code Should Do First

```
1. Read all MD files inside claude/ folder completely
2. Run: npx create-next-app@latest dineflow --typescript --tailwind --app --src-dir=no --import-alias="@/*"
3. Install all packages from claude/STACK.md
4. Set up Prisma with schema from claude/SCHEMA.md
5. Set up NextAuth from claude/AUTH.md
6. Build features in order from claude/FEATURES.md
7. Follow UI design system from claude/UI.md exactly
```
