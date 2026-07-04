# FEATURES.md — Current Feature Inventory

> This used to be a "build in this order" plan for a not-yet-built app. The app now exists — this doc describes what's actually shipped, organized by page, plus what's explicitly *not* built yet. See `API.md`/`SCHEMA.md` for the backing routes/models of each.

## Dashboard pages (`app/(dashboard)/**`)

| Route | Feature |
|---|---|
| `/dashboard` | Main stats overview. |
| `/orders` | Order list — filter by status, search by order number, paginated. |
| `/orders/[id]` | Order detail — a full route/page, not a modal. Status transitions, payment recording, print bill (`PrintBillButton` → `jsPDF`). |
| `/new-order` | Order creation flow: order type (dine-in/parcel/delivery) → table pick (dine-in) → customer search/create → menu/cart → confirm → place order. |
| `/check-order` | Look up any order (by number presumably — read the page directly for the exact lookup key before building against it). |
| `/menu` | Menu CRUD, grouped by category. |
| `/inventory` | Inventory CRUD. No low-stock filtering/search wired into the API yet (see below). |
| `/customers` | Customer list + search. **No `/customers/[id]` detail page exists** — despite `GET /api/customers/[id]` existing as an API route. |
| `/reports` | Revenue/GST/order reports for a date range. |
| `/settings` | General tenant settings (name, address, phone, email, currency, timezone). |
| `/settings/gst` | GST configuration (rate, registration status, GSTIN). |
| `/settings/team` | Staff management — create/edit/deactivate staff, per-user permission editing for customizable roles. |
| `/settings/tables` | Table management (`RestaurantTable`) — **not in the original plan at all**, a real shipped feature. |
| `/kitchen` | Kitchen display — live order queue for kitchen staff, showing `PENDING/IN_PROGRESS/READY/SERVED/COMPLETED/CANCELLED` order states. **Not in the original plan**, a real shipped feature. |
| `/chat` | Team chat — Community (global, all tenants + admin) and Direct (tenant ↔ platform admin) tabs. **Not in the original plan**, a real shipped feature. |
| `/announcements` | Platform announcements from admin, with unread tracking. **Not in the original plan**, a real shipped feature. |

## Roles & permissions (`constants/ROLES.ts`)

Six roles, not four: `SUPER_ADMIN, OWNER, MANAGER, WAITER, KITCHEN, CASHIER`.

Two-layer RBAC:
1. `ROLE_PERMISSIONS` — a static, coarse default page list per role (documentation/reference).
2. A real per-user override: `User.permissions: String[]` in the DB. `DEFAULT_PERMISSIONS` supplies the fallback for `WAITER`/`KITCHEN`/`CASHIER` when a user's own `permissions[]` is empty; owners/managers can hand-edit a staff member's `permissions[]` from `ASSIGNABLE_MODULES` (dashboard, new-order, orders, kitchen, check-order, menu, inventory, customers, reports, announcements, chat — grouped into Operations/Management/Insights/Updates).

Only `WAITER, KITCHEN, CASHIER` are `CUSTOMIZABLE_ROLES` (permission-editable). `MANAGER, WAITER, KITCHEN, CASHIER` are `INVITABLE_ROLES` (creatable via `POST /api/team` by an OWNER/MANAGER) — OWNER and SUPER_ADMIN accounts are never created this way.

## Order model

- `OrderType`: `DINE_IN | PARCEL | DELIVERY` (3 types).
- `OrderStatus`: `PENDING | IN_PROGRESS | READY | SERVED | DELIVERED | COMPLETED | CANCELLED` (7 states — `SERVED` for dine-in, `DELIVERED` for parcel/delivery; once `COMPLETED` it doesn't go backwards, enforced by convention in the API, not a DB constraint).
- `PaymentStatus`: `UNPAID | PARTIAL | PAID | REFUNDED`. `PaymentMethod`: `CASH | CARD | UPI`. Payment can be recorded at any order stage.
- GST: per-item, split 50/50 into CGST/SGST, never rounded mid-calculation (`lib/gst.ts`). Order stores `subtotal`, `totalGST`, `totalCGST`, `totalSGST`, `grandTotal`.
- Soft-deletable (`Order.isActive`) — `DELETE /api/orders/[id]` sets `isActive: false`, doesn't hard-delete.

## New-tenant defaults (`lib/tenant-defaults.ts`)

Every new tenant (self-registered or admin-created) starts with: 2 categories (Main Course, Beverages), 2 menu items (Paneer Butter Masala, Masala Chai), 2 inventory items (Paneer, Basmati Rice), 2 tables (T1, T2) — so a fresh restaurant isn't a blank slate.

## Explicitly NOT implemented (don't assume these exist)

- **No staff-invite-by-email flow.** The `Invite` Prisma model exists but no route (`app/api/invite/**`) backs it. Staff are created directly with a typed password via `POST /api/team`.
- **No subscription auto-expiry.** No cron job, no scheduled function, nothing in `vercel.json` (which doesn't exist). `Subscription.status` would need manual updates.
- **No `SubscriptionPayment`-recording route**, despite the model existing.
- **No `RestockLog`-creating route**, despite the model existing and being read by `/api/reports` — there's no "restock" action wired into inventory update.
- **No `/customers/[id]` page** (API route exists, page doesn't).
- **No low-stock alerting/filtering** in the inventory API (`minStockLevel` is stored but not compared against `quantity` anywhere in a route).
- **No GSTR-1 export** or other advanced reports beyond what `GET /api/reports` returns.

## Toast notifications & confirmation dialogs

- Toasts: `useToast()` from `components/providers/ToastProvider.tsx` — see `UI.md`. Every create/update/delete action across every dashboard page should surface a success or error toast; if you find a `.catch(() => {})` silently swallowing a fetch failure, that's a bug, not a pattern to copy.
- Destructive confirmations: `useConfirm()` from `components/shared/ConfirmDialog.tsx` — prefer this over the browser's native `confirm()` for new delete flows, though a few older call sites (e.g. the admin announcements page) still use native `confirm()`.
