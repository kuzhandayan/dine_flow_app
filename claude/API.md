# API.md — API Routes

## Response shape — no shared helper

There is **no** `lib/api-response.ts` or standard `ok()`/`badRequest()` wrapper. Every route inlines its own try/catch and returns `NextResponse.json({...}, {status})` directly. The error shape is *mostly* `{ error: string }`, occasionally `{ error: string, issues: ZodIssue[] }` for validation failures, with status codes chosen per-route (typically 400 for validation, 401 for auth, 403 for role, 404 for not-found, 500 for unexpected). Don't assume a uniform contract across routes — check the specific route file.

Every route (except `/api/health` and `/api/auth/*`) starts with `requireAuth()` or `requireRole([...])` from `lib/middleware-helpers.ts` (see `AUTH.md`), which throws `AuthError` (401/403) if the session is missing, unauthenticated, or flagged revoked.

## Auth

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/auth/register` | public | Self-serve signup. `{restaurantName, ownerName, email, password}` → creates Tenant + OWNER + GSTConfig + Subscription + default data in one transaction. `201` or `{error}`. |
| `GET`/`POST` | `/api/auth/[...nextauth]` | — | NextAuth v4 handler (credentials provider). See `AUTH.md`. |

## Admin (`requireRole(['SUPER_ADMIN'])`)

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/admin/tenants` | Lists all tenants except admin-owned ones, with `_count` (users/orders/customers/menuItems), embedded `subscription {type,status,endDate}`, and paid-order revenue via `groupBy`. |
| `POST` | `/api/admin/tenants` | `{restaurantName, ownerName, email, password, phone?, gstin?, address?}` — creates tenant + OWNER (password typed by the admin directly, **no auto-generated/reveal-once password**), GSTConfig, Subscription(LIFETIME), seeds tenant defaults. Sets `createdById`/`updatedById` to the admin's id. |
| `PATCH` | `/api/admin/tenants/[id]` | Single combined endpoint: `{isActive?, isSuspended?, subscription?: {type?, status?, endDate?}}`. Updates tenant flags and/or upserts `Subscription` in one call — there is no separate suspend/close/payment endpoint. |
| `GET` | `/api/admin/announcements` | Lists all announcements with targets + read counts. |
| `POST` | `/api/admin/announcements` | `{title, content, targetType: 'ALL'|'SELECTED', tenantIds?}` — creates `AnnouncementTenant` rows when `SELECTED`. |
| `PATCH` | `/api/admin/announcements/[id]` | Updates fields, replaces `AnnouncementTenant` targets. |
| `DELETE` | `/api/admin/announcements/[id]` | Hard delete. |

**Not implemented**: no `/api/admin/tenants/new`-style separate page-backing route, no `/api/admin/subscriptions/*`, no `SubscriptionPayment`-creating route, no `/api/admin/reports`, no cron/scheduled subscription-expiry job anywhere in the repo.

## Announcements (tenant-facing, `requireAuth`)

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/announcements` | Active announcements targeted at the caller's tenant (ALL, or SELECTED matching), each annotated with `isRead`. |
| `POST` | `/api/announcements/[id]/read` | Upserts an `AnnouncementRead` row for `(announcementId, tenantId)`. |
| `GET` | `/api/announcements/unread-count` | `{count}` — eligible announcements minus read ones for the tenant. |

## Chat (`requireAuth`; admin-wide views additionally `requireRole(['SUPER_ADMIN'])`)

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/chat/community?before=<ISO>` | Global room, paginated 50/page via `before` cursor, returned oldest-first. |
| `POST` | `/api/chat/community` | Posts a message. `SUPER_ADMIN` → `tenantId: null, senderName: 'Admin', isAdmin: true`; else scoped to caller's tenant. |
| `GET` | `/api/chat/direct` | SUPER_ADMIN only — lists every tenant with a direct-message thread, last message preview, unread count, sorted by recency. |
| `GET` | `/api/chat/direct/[tenantId]` | Fetches a tenant's thread. Non-admins can only fetch their own tenantId (403 otherwise). Marks the other party's messages read as a side effect. |
| `POST` | `/api/chat/direct/[tenantId]` | Sends a message; `fromAdmin` set from caller role; same tenant-scoping check. |
| `GET` | `/api/chat/unread` | `{community: 0, direct: N}` — community unread isn't tracked (always 0); admins see all-tenant unread direct count, tenant users see their own thread's unread-from-admin count. |

## Orders (`requireAuth`)

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/orders?status&search&page&limit` | Paginated (default page 1, limit 20), `where: {tenantId, isActive: true, ...}`, optional status filter, optional case-insensitive `orderNumber` search. Includes customer name/phone + item summaries. |
| `POST` | `/api/orders` | `{customerId, type, tableNumber?, notes?, items: [{menuItemId, quantity, notes?}]}`. Validates menu items are available+active for the tenant, computes per-item GST split (CGST/SGST 50/50) and order totals, generates `orderNumber` as `ORD-#####`, creates Order+OrderItems atomically. Sets `createdById`/`updatedById`. |
| `GET` | `/api/orders/[id]` | Order (filtered `tenantId, isActive: true`) with customer/items/payments, plus the tenant + its GSTConfig for bill rendering. 404 if not found. |
| `PATCH` | `/api/orders/[id]` | Flat partial update: `{status?, paymentStatus?, paymentMethod?, paidAmount?}`. Sets `completedAt` on status→`COMPLETED`, `paidAt` on paymentStatus→`PAID`, and `updatedById`. |
| `DELETE` | `/api/orders/[id]` | Soft-delete: `isActive: false`. |

## Customers (`requireAuth`)

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/customers?q=` | Searches name/phone (case-insensitive contains), `isActive: true`. `totalOrders`/`totalSpent` are computed live via `groupBy` on `PAID` orders (the `Customer.totalOrders`/`totalSpent` columns are not read or written here). |
| `POST` | `/api/customers` | `{name, phone (10–15 chars), email?}`. Sets `createdById`/`updatedById`. |
| `GET` | `/api/customers/[id]` | Customer + up to 50 recent orders (with item summaries) + live-computed `totalSpent` from PAID orders. 404 if not found/wrong tenant. |

**Not implemented**: no `PATCH /api/customers/[id]`, no `/api/customers/search`.

## Menu

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/menu` | `requireAuth` | Active categories, each with nested active `menuItems`, sorted by `sortOrder`/`name`. Category-grouped, not a flat item list. |
| `POST` | `/api/menu` | `requireRole(['OWNER','MANAGER'])` | `{name, price, gstRate (default 5), isVeg, categoryId?, description?, costPrice?}`. |
| `PATCH` | `/api/menu/[id]` | `requireRole(['OWNER','MANAGER'])` | Partial `{name?, price?, gstRate?, isVeg?, isAvailable?, categoryId?, description?}`. |
| `DELETE` | `/api/menu/[id]` | `requireRole(['OWNER','MANAGER'])` | Soft-delete (`isActive: false`) — no "blocked if has order history" guard. |
| `GET` | `/api/menu/categories` | `requireAuth` | Flat list of active categories. |
| `POST` | `/api/menu/categories` | `requireAuth` | `{name, sortOrder?}` — **not role-restricted**. |
| `PATCH` | `/api/menu/categories/[id]` | `requireAuth` | Partial `{name?, sortOrder?, isActive?}`. |
| `DELETE` | `/api/menu/categories/[id]` | `requireAuth` | Soft-delete — no "blocked if has menu items" guard. |

## Inventory (`requireAuth` for all — not role-restricted)

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/inventory` | Active items, sorted by name. No low-stock filter, search param, or computed summary block. |
| `POST` | `/api/inventory` | `{name, unit, quantity, minStockLevel, costPerUnit, supplier?}`. |
| `PATCH` | `/api/inventory/[id]` | Partial `{name?, unit?, quantity?, minStockLevel?, costPerUnit?, supplier?}`. **No restock action** — despite the `RestockLog` model existing, nothing in this route creates one. |
| `DELETE` | `/api/inventory/[id]` | Soft-delete (`isActive: false`). |

## Reports (`requireRole(['OWNER','MANAGER','SUPER_ADMIN'])`)

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/reports?from&to` | Defaults to current month. Returns `summary` (totalRevenue, netRevenue, totalGST/CGST/SGST, totalOrders, completedOrders, cancelledOrders, avgOrderValue, inventoryExpenses from RestockLogs, currentInventoryValue, grossProfit), `daily` breakdown, `topItems` (top 10 by revenue), `gstBreakup` by rate, `ordersByStatus`. No payment-method breakdown. |

## Settings

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/settings` | `requireRole(['OWNER','MANAGER','SUPER_ADMIN'])` | Tenant `{id,name,slug,address,phone,email,currency,timezone}` (no GST config bundled here). |
| `PATCH` | `/api/settings` | `requireRole(['OWNER','SUPER_ADMIN'])` | `{name, address?, phone?, email?, currency?, timezone?}`. |
| `GET` | `/api/settings/gst` | `requireAuth` | Returns `GSTConfig` or a default stub if none exists. |
| `PUT` | `/api/settings/gst` | `requireAuth` (not role-gated) | `{gstEnabled, defaultGSTRate, isGSTRegistered, gstin?, gstBusinessName?, gstAddress?}` — upserts. |

## Team

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/team` | `requireRole(['OWNER','MANAGER','SUPER_ADMIN'])` | Users with role in `WAITER/KITCHEN/CASHIER/MANAGER` (excludes OWNER/SUPER_ADMIN), with `permissions[]`. |
| `POST` | `/api/team` | `requireRole(['OWNER','MANAGER','SUPER_ADMIN'])` | Direct staff creation (not invite-based — `app/api/invite` doesn't exist). `{name, email, password, role, permissions?}`. A MANAGER cannot create another MANAGER (403). |
| `PATCH` | `/api/team/[id]` | `requireRole(['OWNER','MANAGER','SUPER_ADMIN'])` | Cannot modify OWNER; a MANAGER cannot modify another MANAGER. `{name?, isActive?, password?, role?, permissions?}`. |
| `DELETE` | `/api/team/[id]` | `requireRole(['OWNER','SUPER_ADMIN'])` (MANAGER cannot) | Soft-delete (`isActive: false`); blocks deleting OWNER. |

## Tables (`RestaurantTable`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/api/tables` | `requireAuth` | Active tables, sorted by `sortOrder`/name. |
| `POST` | `/api/tables` | `requireRole(['OWNER','MANAGER','SUPER_ADMIN'])` | `{name, capacity (default 4), sortOrder (default 0)}`. |
| `PATCH` | `/api/tables/[id]` | `requireRole(['OWNER','MANAGER','SUPER_ADMIN'])` | Partial `{name?, capacity?, isActive?, sortOrder?}`. |
| `DELETE` | `/api/tables/[id]` | `requireRole(['OWNER','MANAGER','SUPER_ADMIN'])` | Soft-delete. |

## Misc

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/health` | Public. `{status: 'ok', timestamp}`. Used by both Docker Compose healthchecks. |

## Routes that do **not** exist (do not build against these)

`POST /api/invite`, `GET|POST /api/invite/[token]`, `DELETE /api/invite/[inviteId]`, `GET /api/customers/search`, `PATCH /api/customers/[id]`, any `/api/admin/subscriptions*`, any `/api/cron/*`.
