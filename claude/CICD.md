# CICD.md — Deployment & Containerization

> This used to describe a 3-workflow, multi-branch (`dev`/`staging`/`main`) pipeline with type-check/lint/build gates and a `prisma migrate deploy` step. None of that exists. There is exactly **one** GitHub Actions workflow, and it doesn't run type-check/lint/migrate at all.

## GitHub Actions — `.github/workflows/deploy.yml`

```yaml
name: Deploy to Vercel

on:
  push:
    branches:
      - live

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm install -g vercel@latest
      - run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      - run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      - run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

- **Production branch is `live`**, not `main`. Pushing to `live` triggers a deploy.
- **Vercel CLI-driven prebuilt deploy**, not Vercel's GitHub-integration auto-deploy: `vercel pull` fetches env/project config, `vercel build --prod` builds inside the Action runner, `vercel deploy --prebuilt --prod` ships that exact build artifact. Build failures surface as a failed `vercel build` step — there's no separate CI gate before that.
- Required GitHub secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`. App secrets (`DATABASE_URL`, `NEXTAUTH_SECRET`, etc.) are **not** duplicated as GitHub secrets — they live in Vercel's own environment variable store and get pulled in via `vercel pull`.
- **No staging environment or workflow exists.** No `ci.yml` runs type-check/lint on pull requests. No `prisma migrate deploy` step runs anywhere in CI — migrations against the production Supabase DB are presumably run manually (`npx prisma migrate deploy`) or via Vercel's build hooks, not verified as automated.

## Docker

Two separate images, two separate compose files — dev and prod are not the same container.

### `Dockerfile.dev` — development (hot reload)
Single-stage Node 22 alpine. Copies `package*.json` + `prisma.config.ts` + `prisma/` *before* `npm install` (so `postinstall`'s `prisma generate` has the schema available), then `npm install`, then the rest of the source (overridden by the bind mount at runtime anyway). `EXPOSE 3001`, `ENV PORT=3001`, `CMD ["npm", "run", "dev"]`.

### `docker-compose.yml` — dev orchestration
```yaml
services:
  app:
    build: { context: ., dockerfile: Dockerfile.dev }
    container_name: dineflow-dev
    ports: ["3001:3001"]
    volumes:
      - .:/app                 # bind-mount source for hot reload
      - /app/node_modules       # preserve container's node_modules
      - /app/.next
    env_file: [.env.local]
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3001/api/health"]
```
Run with `docker compose up`. The app is reachable at `http://localhost:3001` in this mode (not 3000).

### `Dockerfile` — production, 3-stage build
1. `deps` — `npm ci --frozen-lockfile`.
2. `builder` — copies source, runs `npx prisma generate` (no DB connection needed for that), `npm run build` (produces `.next/standalone` because `next.config.ts` sets `output: 'standalone'`).
3. `runner` — minimal alpine image, runs as non-root `nextjs` user, copies only `.next/standalone`, `.next/static`, `public/`, `prisma/`, and the generated `node_modules/.prisma` + `node_modules/@prisma` — not the full `node_modules`. `EXPOSE 3000`, `ENV PORT=3000`, `CMD ["node", "server.js"]`.

Secrets are never baked into any layer — always injected at `docker run`/`docker compose` time via `--env-file` or `-e`.

### `docker-compose.prod.yml` — prod orchestration
```yaml
services:
  app:
    build: { context: ., dockerfile: Dockerfile }
    container_name: dineflow-prod
    ports: ["3000:3000"]
    env_file: [.env.local]
    restart: always
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:3000/api/health"]
```

Both healthchecks hit the real `GET /api/health` route (`{status: 'ok', timestamp}`), which exists and is public.

## `next.config.ts`

```ts
{
  output: 'standalone',   // required for the Docker multi-stage build to produce a minimal runner image
  images: { remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }] },  // tenant logos in Supabase storage
}
```
