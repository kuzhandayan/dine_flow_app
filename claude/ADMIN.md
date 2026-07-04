# ADMIN.md — Super Admin Panel & Tenant Management

## Overview

Two separate worlds, both served from the same Next.js app:
- `/admin/*` — platform admin, for the one running the SaaS.
- `/(dashboard)/*` — the actual restaurant workspace, one per tenant.

`SUPER_ADMIN` is **not a separate model** — it's just `UserRole.SUPER_ADMIN` on the same `User` table everyone else uses, and that admin user belongs to its own `Tenant` row like any restaurant would. `GET /api/admin/tenants` explicitly filters out any tenant that contains a `SUPER_ADMIN` user, so the admin's own tenant never shows up in the platform's tenant list.

Route protection: `proxy.ts` (Next 16's renamed `middleware.ts`) requires `role === 'SUPER_ADMIN'` for any `/admin*` path (redirects to `/admin/login` otherwise), and redirects an already-authenticated `SUPER_ADMIN` away from `/admin/login` straight to `/admin/dashboard`.

## Real route inventory

| Route | File | Purpose |
|---|---|---|
| `/admin/login` | `app/(admin)/admin/login/page.tsx` + `AdminLoginClient.tsx` | Admin sign-in (same credentials provider as tenant login, gated by role after auth). |
| `/admin/dashboard` | `app/(admin)/admin/(protected)/dashboard/page.tsx` | Platform overview. |
| `/admin/tenants` | `app/(admin)/admin/(protected)/tenants/page.tsx` | List + create + suspend/activate tenants — **all in one page**, via modals, not separate `/new` or `/[id]` routes. |
| `/admin/announcements` | `app/(admin)/admin/(protected)/announcements/page.tsx` | Create/manage platform-wide or per-tenant announcements. |
| `/admin/chat` | `app/(admin)/admin/(protected)/chat/page.tsx` | Admin side of the community + direct-message chat system. |

**Do not build against `/admin/tenants/new`, `/admin/tenants/[id]`, `/admin/subscriptions`, or `/admin/reports` — none of these exist.** Tenant creation/detail/suspension is handled inline within the single `/admin/tenants` page.

There are two orphaned empty directories left over from an earlier structure: `app/(admin)/admin/tenants` and `app/(admin)/tenants` — no `page.tsx` in either. Harmless, but a cleanup candidate; don't confuse them with the real `app/(admin)/admin/(protected)/tenants`.

## Admin API (`requireRole(['SUPER_ADMIN'])` on every route)

| Method | Path | What it does |
|---|---|---|
| `GET` | `/api/admin/tenants` | All non-admin tenants, with `_count` (users/orders/customers/menuItems), embedded `subscription {type, status, endDate}`, and paid-order revenue via `groupBy`. |
| `POST` | `/api/admin/tenants` | `{restaurantName, ownerName, email, password, phone?, gstin?, address?}`. Creates Tenant + OWNER User + GSTConfig + Subscription(LIFETIME/ACTIVE) + calls `seedTenantDefaults`, all in one transaction. Sets `createdById`/`updatedById` on every created row to the admin's own user id. |
| `PATCH` | `/api/admin/tenants/[id]` | The one combined tenant-management endpoint: `{isActive?, isSuspended?, subscription?: {type?, status?, endDate?}}`. Updates `Tenant` flags and/or upserts `Subscription` in a single call. |
| `GET` | `/api/admin/announcements` | Lists announcements with per-tenant targets + read counts. |
| `POST` | `/api/admin/announcements` | Creates an announcement, optionally with `AnnouncementTenant` rows for `SELECTED` targeting. |
| `PATCH` | `/api/admin/announcements/[id]` | Updates fields, replaces targets. |
| `DELETE` | `/api/admin/announcements/[id]` | Deletes it. |

## What's real vs. aspirational

**Real, confirmed by reading the actual create-tenant form:** the admin **types a password directly** into a form field when creating a tenant (`app/(admin)/admin/(protected)/tenants/page.tsx`, a plain `<input type="password">` bound to form state, submitted as-is in the `POST` body). There is **no** auto-generated temporary password, no "reveal once" screen, no forced first-login password change flow tied to admin-created tenants.

**Schema exists, no route uses it:**
- `Subscription`/`SubscriptionPayment` models are fully fleshed out (type/status/dates/amounts, `recordedBy`), but there is **no route that creates a `SubscriptionPayment`** — subscription state is only ever touched via the combined `PATCH /api/admin/tenants/[id]` endpoint, which never writes to `SubscriptionPayment`.
- `Tenant.isSuspended` / `suspendedAt` / `suspendedReason` exist and are read by the login flow (`AUTH.md`), settable via the same `PATCH` endpoint's `isSuspended` field — but `suspendedAt`/`suspendedReason` aren't populated by any route currently (only the boolean flag is wired up).
- `User.mustChangePassword` exists on the schema but isn't read or set by any current route.

**Not built at all:**
- No subscription auto-expiry. No cron job, no scheduled function, no `vercel.json` crons config anywhere in the repo. A `Subscription.status` of `EXPIRED` would have to be set manually today.
- No `/api/admin/reports` or platform-wide reports page.
- No staff-invite-by-email flow (see `AUTH.md`) — irrelevant to admin specifically, but worth knowing the `Invite` model isn't backed by any route anywhere in the app, admin included.

## Admin-side chat & announcements (not in earlier docs at all)

Two systems, both admin ↔ tenant:
- **Announcements** — one-way broadcast. `Announcement` targeted `ALL` or `SELECTED` tenants (via `AnnouncementTenant` join rows), with per-tenant read tracking (`AnnouncementRead`). Tenant side reads via `/announcements` + `GET /api/announcements`; admin manages via `/admin/announcements`.
- **Chat** — two-way. `CommunityMessage` is one global room across every tenant + admin (`tenantId: null` + `senderName: 'Admin'` when a `SUPER_ADMIN` posts). `DirectMessage` is a private thread per tenant with the platform admin. Tenant side is `/chat` (`app/(dashboard)/chat/page.tsx`, Community/Direct tabs); admin side is `/admin/chat`. See `API.md` for the full route list.
