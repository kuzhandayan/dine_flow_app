# STACK.md — Technology Stack & Setup

## Core Framework

| Package | Version | Purpose |
|---|---|---|
| next | 14.2.x | Full-stack framework (App Router) |
| react | 18.3.x | UI library |
| react-dom | 18.3.x | DOM rendering |
| typescript | 5.4.x | Type safety |

---

## Database Strategy — 3 Phases

### Phase 1 — Launch (Right Now, ₹0)
**Supabase Free Tier**
- 0.5 GB PostgreSQL storage
- If project pauses after 1 week inactivity → log into supabase.com → click "Restore" → back in 2 min
- Data is never lost on pause
- Perfect for development + first customers
- Supabase gives you a hosted Postgres + connection pooling (pgBouncer) built in

### Phase 2 — Growing (First Paying Customers)
**Supabase Pro — $25/month**
- Never pauses
- 8 GB storage
- Daily backups
- When to upgrade: when you have 5+ paying restaurants consistently using the app
- No code changes needed — just upgrade plan in Supabase dashboard

### Phase 3 — Scale (Many Customers, Full Control)
**AWS EC2 + Self-hosted PostgreSQL**
- Full DevOps control
- Cheapest at scale
- You own everything — no vendor lock-in
- See DEVOPS.md for full AWS setup guide (future)
- Migration: change DATABASE_URL in .env — Prisma handles the rest, zero code changes

```
Supabase Free → Supabase Pro → AWS RDS or EC2 Postgres
     ↑                ↑                    ↑
  Launch day    5+ restaurants       50+ restaurants
```

---

## Step 1 — Create Project

```bash
npx create-next-app@latest dineflow \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias="@/*" \
  --no-git

cd dineflow
```

---

## Step 2 — Install All Dependencies

```bash
# Database ORM
npm install prisma @prisma/client

# Auth
npm install next-auth@beta @auth/prisma-adapter

# Password hashing
npm install bcryptjs
npm install -D @types/bcryptjs

# Validation
npm install zod

# Forms
npm install react-hook-form @hookform/resolvers

# UI Components
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-select
npm install @radix-ui/react-tabs
npm install @radix-ui/react-toast
npm install @radix-ui/react-tooltip
npm install @radix-ui/react-popover
npm install @radix-ui/react-separator
npm install @radix-ui/react-avatar
npm install @radix-ui/react-checkbox
npm install @radix-ui/react-label
npm install @radix-ui/react-slot

# State management
npm install zustand

# Server state / data fetching
npm install @tanstack/react-query @tanstack/react-query-devtools

# Date utilities
npm install date-fns

# PDF generation
npm install @react-pdf/renderer

# Email (Resend - free 3000/month)
npm install resend

# HTTP client
npm install axios

# Dev tools
npm install -D @types/node
npm install -D eslint-config-next
npm install -D prettier prettier-plugin-tailwindcss
npm install -D tailwindcss-animate
```

---

## Step 3 — Initialize Prisma

```bash
npx prisma init --datasource-provider postgresql
```

---

## Step 4 — Initialize shadcn/ui

```bash
npx shadcn-ui@latest init
```

Select:
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**

Then add components:
```bash
npx shadcn-ui@latest add button input label card dialog dropdown-menu select tabs toast badge table separator avatar checkbox tooltip popover skeleton sheet alert progress
```

---

## Step 5 — Environment Variables

### `.env.local` (never commit this file)

```env
# ─────────────────────────────────────
# DATABASE — PHASE 1: Supabase Free
# Get these from: supabase.com → project → settings → database
# ─────────────────────────────────────
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# ─────────────────────────────────────
# DATABASE — PHASE 2: Supabase Pro (when you upgrade, just update these URLs)
# Same format, just your project will be on Pro plan — no code changes
# ─────────────────────────────────────

# ─────────────────────────────────────
# DATABASE — PHASE 3: AWS EC2 Postgres (future — see DEVOPS.md)
# DATABASE_URL="postgresql://postgres:password@your-ec2-ip:5432/dineflow?schema=public"
# DIRECT_URL="postgresql://postgres:password@your-ec2-ip:5432/dineflow?schema=public"
# ─────────────────────────────────────

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# Email - Resend (free 3000 emails/month)
RESEND_API_KEY="re_xxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="DineFlow"

# ─────────────────────────────────────
# FUTURE PHASE 2 — Razorpay (do not add until ready)
# RAZORPAY_KEY_ID=""
# RAZORPAY_KEY_SECRET=""
# ─────────────────────────────────────
```

### `.env.example` (commit this)

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
RESEND_API_KEY="re_xxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="DineFlow"
```

---

## Step 6 — Supabase Setup (Phase 1)

```
1. Go to supabase.com → New Project
2. Choose region: ap-south-1 (Asia Pacific — Mumbai) — closest to India
3. Set a strong database password — save it
4. Wait ~2 minutes for project to provision
5. Go to: Settings → Database → Connection string
6. Copy "Transaction pooler" URL → paste as DATABASE_URL
7. Copy "Session pooler" or "Direct" URL → paste as DIRECT_URL
8. Run: npx prisma migrate dev --name init
9. Run: npx prisma db seed
```

### If Supabase Project Pauses
```
1. Go to supabase.com → your project
2. You'll see "Project is paused" banner
3. Click "Restore project"
4. Wait ~2 minutes
5. Everything resumes — zero data lost
```
This only happens during development when no one uses the app for 7 days.
Once you go live with real customers using the app daily — it will never pause.

---

## Step 7 — TypeScript Config

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## Step 8 — ESLint + Prettier

`.eslintrc.json`:
```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

`.prettierrc`:
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

---

## Step 9 — Tailwind Config

`tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'df-bg': '#0f1117',
        'df-surface': '#1a1d2e',
        'df-surface-2': '#252840',
        'df-card': '#1e2235',
        'df-accent': '#f97316',
        'df-accent-hover': '#fb923c',
        'df-border': '#2d3149',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

---

## Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "prisma db seed",
    "db:studio": "prisma studio",
    "db:generate": "prisma generate",
    "postinstall": "prisma generate"
  }
}
```

---

## Future Phase 2 Packages — Do Not Install Now

```bash
# Razorpay — Indian payment gateway
npm install razorpay
npm install -D @types/razorpay

# Phase 3 — AWS SDK (if using S3 for receipts/images)
npm install @aws-sdk/client-s3
```
