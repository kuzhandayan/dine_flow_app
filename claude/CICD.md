# CICD.md — GitHub Actions CI/CD Setup

## Overview

```
Developer pushes code
        ↓
GitHub Actions runs CI (type check + lint + build)
        ↓
If passes → Vercel deploys automatically
        ↓
Production live in ~60 seconds
```

---

## Branch Strategy

```
main        → Production (live at yourdomain.com)
staging     → Staging (test before going live)
dev         → Daily development work
feature/*   → Individual features (e.g. feature/inventory-crud)
fix/*       → Bug fixes
```

**Rules:**
- Never push directly to `main`
- All features merge into `dev` first
- `dev` → `staging` for testing
- `staging` → `main` for production release

---

## File 1: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [dev, staging]
  pull_request:
    branches: [main, staging]

jobs:
  ci:
    name: Type Check + Lint + Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          RESEND_FROM_EMAIL: ${{ secrets.RESEND_FROM_EMAIL }}
          NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
          NEXT_PUBLIC_APP_NAME: "DineFlow"
```

---

## File 2: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          DIRECT_URL: ${{ secrets.DIRECT_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          RESEND_FROM_EMAIL: ${{ secrets.RESEND_FROM_EMAIL }}
          NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
          NEXT_PUBLIC_APP_NAME: "DineFlow"

      # Vercel handles the actual deploy via GitHub integration
      # Just ensure build passes here
      - name: Deploy success
        run: echo "✅ Build passed — Vercel will deploy automatically"
```

---

## File 3: `.github/workflows/staging.yml`

```yaml
name: Deploy to Staging

on:
  push:
    branches: [staging]

jobs:
  staging:
    name: Staging Deploy
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.STAGING_DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: ${{ secrets.STAGING_URL }}
          NEXT_PUBLIC_APP_URL: ${{ secrets.STAGING_URL }}
          NEXT_PUBLIC_APP_NAME: "DineFlow (Staging)"
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          RESEND_FROM_EMAIL: ${{ secrets.RESEND_FROM_EMAIL }}
```

---

## GitHub Secrets to Set

Go to: GitHub repo → Settings → Secrets and variables → Actions → New repository secret

```
DATABASE_URL          postgresql://...  (Supabase connection string)
DIRECT_URL            postgresql://...  (Supabase direct connection)
STAGING_DATABASE_URL  postgresql://...  (separate staging DB)
NEXTAUTH_SECRET       (generate: openssl rand -base64 32)
NEXTAUTH_URL          https://yourdomain.com
STAGING_URL           https://staging.yourdomain.com
RESEND_API_KEY        re_xxxxxxxxxxxx
RESEND_FROM_EMAIL     noreply@yourdomain.com
NEXT_PUBLIC_APP_URL   https://yourdomain.com
```

---

## Vercel Setup

### Connect GitHub repo to Vercel
1. Go to vercel.com → New Project
2. Import your GitHub repo
3. Framework: Next.js (auto-detected)
4. Add all environment variables in Vercel dashboard
5. Enable "Deploy on push to main"

### Vercel Environment Variables
Add these in Vercel dashboard → Project → Settings → Environment Variables:

```
DATABASE_URL          → Production + Preview
DIRECT_URL            → Production + Preview
NEXTAUTH_SECRET       → Production + Preview
NEXTAUTH_URL          → Production only (your real domain)
RESEND_API_KEY        → Production + Preview
RESEND_FROM_EMAIL     → Production + Preview
NEXT_PUBLIC_APP_URL   → Production only
NEXT_PUBLIC_APP_NAME  → DineFlow
```

---

## .gitignore

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js
.next/
out/
build/

# Environment files — NEVER COMMIT THESE
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Prisma
prisma/*.db
prisma/*.db-journal

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp
*.swo

# TypeScript
*.tsbuildinfo
next-env.d.ts
```

---

## Development Workflow

```bash
# Start new feature
git checkout dev
git pull origin dev
git checkout -b feature/menu-crud

# Work on feature...
git add .
git commit -m "feat: add menu item CRUD with GST rates"

# Push and create PR to dev
git push origin feature/menu-crud
# Create PR on GitHub: feature/menu-crud → dev

# After PR approved and merged to dev:
# Create PR: dev → staging (for testing)
# Create PR: staging → main (for production)
```

## Commit Message Convention

```
feat:     new feature
fix:      bug fix
chore:    maintenance, deps update
refactor: code restructure, no behavior change
docs:     documentation
style:    formatting, no logic change
test:     adding tests

Examples:
feat: add GST breakup to order billing
fix: tenant isolation missing in inventory API
chore: upgrade next-auth to v5.0.0-beta.22
refactor: extract GST calculation to lib/gst.ts
```
