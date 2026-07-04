# SCHEMA.md — Database Schema (Prisma)

> This file mirrors `prisma/schema.prisma`. If they ever disagree, `prisma/schema.prisma` is the source of truth — re-copy it here rather than trusting this doc.

## Conventions — apply to every model

1. **Primary keys are `uuid(7)`, not `cuid()`.** Every `id` field is `String @id @default(uuid(7)) @db.Uuid` — a time-sortable UUID stored as a native Postgres `uuid` column. Every foreign key column pointing at another model's `id` is typed `String @db.Uuid` (or `String? @db.Uuid` if optional) to match. The one exception is `Invite.token`, which is intentionally a separate opaque, URL-safe value and still uses `@default(cuid())` — it's a share-link token, not a row identifier.
2. **Audit trail: `createdById` / `updatedById`.** Every business model (all of them except `Session` and `VerificationToken`) has nullable `createdById String? @db.Uuid` / `updatedById String? @db.Uuid`, each with its own relation to `User` (`onDelete: SetNull`, so deleting a user never cascades into deleting the records they touched). Every API route that creates or updates a row is expected to set these from the acting session's `userId` (see `AUTH.md` / `API.md`). `User` itself carries both fields too (self-referential — tracks which admin/owner created or last edited a staff account).
3. **Soft delete: `isActive`.** Present on `Tenant, User, Customer, Category, MenuItem, InventoryItem, Order, RestaurantTable, Announcement` (all default `true`). Every `DELETE` route on these resources sets `isActive: false` instead of removing the row; every `GET`/list route filters `isActive: true`. Models without `isActive` (`Session, VerificationToken, Invite, RestockLog, OrderItem, Payment, GSTConfig, Subscription, SubscriptionPayment, AnnouncementTenant, AnnouncementRead, CommunityMessage, DirectMessage`) are either child records removed via cascade from their parent, or aren't soft-deleted at all. `MenuItem.isAvailable` is a separate business toggle (86-ing an item) distinct from `isActive` (soft-delete).
4. **Multi-tenant isolation.** Every tenant-scoped model has a `tenantId String @db.Uuid` column and an index on it (or a compound index/unique starting with it). Every query in `app/api/**` must filter on `tenantId` from the session — see `AUTH.md`.

## Full schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// ─────────────────────────────────────────────
// MULTI-TENANT CORE
// ─────────────────────────────────────────────

model Tenant {
  id          String   @id @default(uuid(7)) @db.Uuid
  name        String
  slug        String   @unique
  gstin       String?
  gstName     String?
  address     String?
  phone       String?
  email       String?
  logo        String?
  currency    String   @default("INR")
  timezone    String   @default("Asia/Kolkata")
  isActive    Boolean  @default(true)
  createdById String?  @db.Uuid
  updatedById String?  @db.Uuid
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  createdBy User? @relation("TenantCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy User? @relation("TenantUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)

  users                User[]                @relation("UserTenant")
  customers            Customer[]
  orders               Order[]
  menuItems            MenuItem[]
  categories           Category[]
  inventory            InventoryItem[]
  invites              Invite[]
  gstConfig            GSTConfig?
  subscription         Subscription?
  announcementTargets  AnnouncementTenant[]
  announcementReads    AnnouncementRead[]
  communityMessages    CommunityMessage[]
  directMessages       DirectMessage[]
  tables               RestaurantTable[]

  isSuspended     Boolean   @default(false)
  suspendedAt     DateTime?
  suspendedReason String?

  @@map("tenants")
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

model User {
  id            String    @id @default(uuid(7)) @db.Uuid
  tenantId      String    @db.Uuid
  name          String
  email         String
  emailVerified DateTime?
  password      String
  role          UserRole  @default(WAITER)
  permissions   String[]  @default([])
  isActive      Boolean   @default(true)
  createdById   String?   @db.Uuid
  updatedById   String?   @db.Uuid
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  tenant    Tenant @relation("UserTenant", fields: [tenantId], references: [id], onDelete: Cascade)
  createdBy User?  @relation("UserCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy User?  @relation("UserUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)

  // Reverse "who created/updated X" relations — one pair per audited model.
  createdUsers User[] @relation("UserCreatedBy")
  updatedUsers User[] @relation("UserUpdatedBy")
  createdTenants Tenant[] @relation("TenantCreatedBy")
  updatedTenants Tenant[] @relation("TenantUpdatedBy")
  createdInvites Invite[] @relation("InviteCreatedBy")
  updatedInvites Invite[] @relation("InviteUpdatedBy")
  createdCustomers Customer[] @relation("CustomerCreatedBy")
  updatedCustomers Customer[] @relation("CustomerUpdatedBy")
  createdCategories Category[] @relation("CategoryCreatedBy")
  updatedCategories Category[] @relation("CategoryUpdatedBy")
  createdMenuItems MenuItem[] @relation("MenuItemCreatedBy")
  updatedMenuItems MenuItem[] @relation("MenuItemUpdatedBy")
  createdInventoryItems InventoryItem[] @relation("InventoryItemCreatedBy")
  updatedInventoryItems InventoryItem[] @relation("InventoryItemUpdatedBy")
  createdRestockLogs RestockLog[] @relation("RestockLogCreatedBy")
  updatedRestockLogs RestockLog[] @relation("RestockLogUpdatedBy")
  createdOrders Order[] @relation("OrderCreatedBy")
  updatedOrders Order[] @relation("OrderUpdatedBy")
  createdOrderItems OrderItem[] @relation("OrderItemCreatedBy")
  updatedOrderItems OrderItem[] @relation("OrderItemUpdatedBy")
  createdPayments Payment[] @relation("PaymentCreatedBy")
  updatedPayments Payment[] @relation("PaymentUpdatedBy")
  createdGstConfigs GSTConfig[] @relation("GSTConfigCreatedBy")
  updatedGstConfigs GSTConfig[] @relation("GSTConfigUpdatedBy")
  createdSubscriptions Subscription[] @relation("SubscriptionCreatedBy")
  updatedSubscriptions Subscription[] @relation("SubscriptionUpdatedBy")
  createdSubscriptionPayments SubscriptionPayment[] @relation("SubscriptionPaymentCreatedBy")
  updatedSubscriptionPayments SubscriptionPayment[] @relation("SubscriptionPaymentUpdatedBy")
  createdRestaurantTables RestaurantTable[] @relation("RestaurantTableCreatedBy")
  updatedRestaurantTables RestaurantTable[] @relation("RestaurantTableUpdatedBy")
  createdAnnouncements Announcement[] @relation("AnnouncementCreatedBy")
  updatedAnnouncements Announcement[] @relation("AnnouncementUpdatedBy")
  createdAnnouncementTenants AnnouncementTenant[] @relation("AnnouncementTenantCreatedBy")
  updatedAnnouncementTenants AnnouncementTenant[] @relation("AnnouncementTenantUpdatedBy")
  createdAnnouncementReads AnnouncementRead[] @relation("AnnouncementReadCreatedBy")
  updatedAnnouncementReads AnnouncementRead[] @relation("AnnouncementReadUpdatedBy")
  createdCommunityMessages CommunityMessage[] @relation("CommunityMessageCreatedBy")
  updatedCommunityMessages CommunityMessage[] @relation("CommunityMessageUpdatedBy")
  createdDirectMessages DirectMessage[] @relation("DirectMessageCreatedBy")
  updatedDirectMessages DirectMessage[] @relation("DirectMessageUpdatedBy")

  sessions           Session[]
  mustChangePassword Boolean   @default(false)

  @@unique([tenantId, email])
  @@map("users")
}

model Session {
  id           String   @id @default(uuid(7)) @db.Uuid
  sessionToken String   @unique
  userId       String   @db.Uuid
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}

model Invite {
  id          String    @id @default(uuid(7)) @db.Uuid
  tenantId    String    @db.Uuid
  email       String
  role        UserRole  @default(WAITER)
  token       String    @unique @default(cuid())
  expiresAt   DateTime
  usedAt      DateTime?
  createdById String?   @db.Uuid
  updatedById String?   @db.Uuid
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  tenant    Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdBy User?  @relation("InviteCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy User?  @relation("InviteUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)

  @@map("invites")
}
```

> **Note:** the `Invite` model exists in the schema but there is currently **no API route** that creates, validates, or accepts an invite (`app/api/invite/**` does not exist). Staff onboarding today happens via `POST /api/team` (an owner/manager directly creates a staff account with a password), not an email-invite flow. Treat `Invite` as schema that's ahead of the feature — see `FEATURES.md`.

```prisma
enum UserRole {
  SUPER_ADMIN
  OWNER
  MANAGER
  WAITER
  KITCHEN
  CASHIER
}

// ─────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────

model Customer {
  id          String    @id @default(uuid(7)) @db.Uuid
  tenantId    String    @db.Uuid
  name        String
  phone       String
  email       String?
  address     String?
  notes       String?
  totalOrders Int       @default(0)
  totalSpent  Float     @default(0)
  lastVisitAt DateTime?
  isActive    Boolean   @default(true)
  createdById String?   @db.Uuid
  updatedById String?   @db.Uuid
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  tenant    Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdBy User?  @relation("CustomerCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy User?  @relation("CustomerUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)
  orders    Order[]

  @@unique([tenantId, phone])
  @@index([tenantId])
  @@map("customers")
}
```

> `totalOrders`/`totalSpent`/`lastVisitAt` columns exist but are **not written to** by any current route — `GET /api/customers` and `GET /api/customers/[id]` compute these live via a `groupBy` on `PAID` orders instead of reading these columns. They're effectively unused denormalized fields right now.

```prisma
// ─────────────────────────────────────────────
// MENU
// ─────────────────────────────────────────────

model Category {
  id          String   @id @default(uuid(7)) @db.Uuid
  tenantId    String   @db.Uuid
  name        String
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
  createdById String?  @db.Uuid
  updatedById String?  @db.Uuid
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant    Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdBy User?      @relation("CategoryCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy User?      @relation("CategoryUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)
  menuItems MenuItem[]

  @@unique([tenantId, name])
  @@index([tenantId])
  @@map("categories")
}

model MenuItem {
  id              String   @id @default(uuid(7)) @db.Uuid
  tenantId        String   @db.Uuid
  categoryId      String?  @db.Uuid
  name            String
  description     String?
  price           Float
  costPrice       Float?
  gstRate         Float    @default(5)
  isAvailable     Boolean  @default(true)
  isActive        Boolean  @default(true)
  isVeg           Boolean  @default(true)
  sortOrder       Int      @default(0)
  inventoryItemId String?  @db.Uuid
  createdById     String?  @db.Uuid
  updatedById     String?  @db.Uuid
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tenant        Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  category      Category?      @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  inventoryItem InventoryItem? @relation(fields: [inventoryItemId], references: [id], onDelete: SetNull)
  createdBy     User?          @relation("MenuItemCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy     User?          @relation("MenuItemUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)
  orderItems    OrderItem[]

  @@index([tenantId])
  @@index([tenantId, categoryId])
  @@map("menu_items")
}

// ─────────────────────────────────────────────
// INVENTORY
// ─────────────────────────────────────────────

model InventoryItem {
  id              String    @id @default(uuid(7)) @db.Uuid
  tenantId        String    @db.Uuid
  name            String
  unit            String
  quantity        Float     @default(0)
  minStockLevel   Float     @default(0)
  costPerUnit     Float     @default(0)
  supplier        String?
  lastRestockedAt DateTime?
  isActive        Boolean   @default(true)
  createdById     String?   @db.Uuid
  updatedById     String?   @db.Uuid
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  tenant      Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdBy   User?        @relation("InventoryItemCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy   User?        @relation("InventoryItemUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)
  menuItems   MenuItem[]
  restockLogs RestockLog[]

  @@index([tenantId])
  @@map("inventory_items")
}

model RestockLog {
  id              String   @id @default(uuid(7)) @db.Uuid
  inventoryItemId String   @db.Uuid
  quantityAdded   Float
  costPerUnit     Float?
  supplier        String?
  notes           String?
  createdById     String?  @db.Uuid
  updatedById     String?  @db.Uuid
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  inventoryItem InventoryItem @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)
  createdBy     User?         @relation("RestockLogCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy     User?         @relation("RestockLogUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)

  @@map("restock_logs")
}
```

> `RestockLog` is read by `GET /api/reports` (as `inventoryExpenses`), but **no route currently creates a `RestockLog` row** — there's no "restock" action wired into `PATCH /api/inventory/[id]`. The model exists ahead of the feature.

```prisma
// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────

model Order {
  id          String      @id @default(uuid(7)) @db.Uuid
  tenantId    String      @db.Uuid
  customerId  String      @db.Uuid
  createdById String?     @db.Uuid
  updatedById String?     @db.Uuid
  orderNumber String
  type        OrderType   @default(DINE_IN)
  tableNumber String?
  status      OrderStatus @default(PENDING)
  notes       String?
  isActive    Boolean     @default(true)

  subtotal   Float
  totalGST   Float
  totalCGST  Float
  totalSGST  Float
  grandTotal Float

  paymentStatus PaymentStatus  @default(UNPAID)
  paymentMethod PaymentMethod?
  paidAmount    Float          @default(0)
  paidAt        DateTime?

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  completedAt DateTime?

  tenant    Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  customer  Customer    @relation(fields: [customerId], references: [id])
  createdBy User?       @relation("OrderCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy User?       @relation("OrderUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)
  items     OrderItem[]
  payments  Payment[]

  @@index([tenantId])
  @@index([tenantId, status])
  @@index([tenantId, createdAt])
  @@index([customerId])
  @@map("orders")
}

model OrderItem {
  id          String   @id @default(uuid(7)) @db.Uuid
  orderId     String   @db.Uuid
  menuItemId  String   @db.Uuid
  name        String
  price       Float
  gstRate     Float
  quantity    Int
  subtotal    Float
  gstAmount   Float
  cgst        Float
  sgst        Float
  total       Float
  notes       String?
  createdById String?  @db.Uuid
  updatedById String?  @db.Uuid
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  menuItem  MenuItem @relation(fields: [menuItemId], references: [id])
  createdBy User?    @relation("OrderItemCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy User?    @relation("OrderItemUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)

  @@index([orderId])
  @@map("order_items")
}
```

- `OrderItem` snapshots `name/price/gstRate` from the `MenuItem` at order time — so historical orders don't change if a menu item's price is edited later.
- GST math (`lib/gst.ts`): `gstAmount = subtotal * (gstRate / 100)`, split 50/50 into `cgst`/`sgst`, `total = subtotal + gstAmount`. Order-level totals are the sum across items. Never rounded mid-calculation.
- `OrderType`: `DINE_IN | PARCEL | DELIVERY`. `OrderStatus`: `PENDING | IN_PROGRESS | READY | SERVED | DELIVERED | COMPLETED | CANCELLED` (`SERVED` = dine-in, `DELIVERED` = parcel/delivery). `PaymentStatus`: `UNPAID | PARTIAL | PAID | REFUNDED`. `PaymentMethod`: `CASH | CARD | UPI`.

```prisma
// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────

model Payment {
  id          String        @id @default(uuid(7)) @db.Uuid
  orderId     String        @db.Uuid
  amount      Float
  method      PaymentMethod
  status      String        @default("success")
  reference   String?
  createdById String?       @db.Uuid
  updatedById String?       @db.Uuid
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  order     Order @relation(fields: [orderId], references: [id], onDelete: Cascade)
  createdBy User? @relation("PaymentCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy User? @relation("PaymentUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)

  @@index([orderId])
  @@map("payments")
}

// ─────────────────────────────────────────────
// GST CONFIGURATION
// ─────────────────────────────────────────────

model GSTConfig {
  id              String   @id @default(uuid(7)) @db.Uuid
  tenantId        String   @unique @db.Uuid
  gstEnabled      Boolean  @default(true)
  defaultGSTRate  Float    @default(5)
  isGSTRegistered Boolean  @default(false)
  gstin           String?
  gstBusinessName String?
  gstAddress      String?
  createdById     String?  @db.Uuid
  updatedById     String?  @db.Uuid
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tenant    Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdBy User?  @relation("GSTConfigCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy User?  @relation("GSTConfigUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)

  @@map("gst_configs")
}
```

```prisma
// ─────────────────────────────────────────────
// SUBSCRIPTIONS
// ─────────────────────────────────────────────

model Subscription {
  id             String             @id @default(uuid(7)) @db.Uuid
  tenantId       String             @unique @db.Uuid
  type           SubscriptionType   @default(LIFETIME)
  status         SubscriptionStatus @default(ACTIVE)
  startDate      DateTime           @default(now())
  endDate        DateTime?
  amount         Float?
  currency       String             @default("INR")
  notes          String?
  lastPaymentAt  DateTime?
  lastPaymentAmt Float?
  createdById    String?            @db.Uuid
  updatedById    String?            @db.Uuid
  createdAt      DateTime           @default(now())
  updatedAt      DateTime           @updatedAt

  tenant    Tenant                @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdBy User?                 @relation("SubscriptionCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy User?                 @relation("SubscriptionUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)
  payments  SubscriptionPayment[]

  @@map("subscriptions")
}

model SubscriptionPayment {
  id             String    @id @default(uuid(7)) @db.Uuid
  subscriptionId String    @db.Uuid
  amount         Float
  currency       String    @default("INR")
  method         String
  reference      String?
  paidAt         DateTime  @default(now())
  extendedUntil  DateTime?
  notes          String?
  recordedBy     String    @db.Uuid
  createdById    String?   @db.Uuid
  updatedById    String?   @db.Uuid
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  subscription Subscription @relation(fields: [subscriptionId], references: [id])
  createdBy    User?        @relation("SubscriptionPaymentCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy    User?        @relation("SubscriptionPaymentUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)

  @@map("subscription_payments")
}

enum SubscriptionType {
  LIFETIME
  DURATION
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  SUSPENDED
  CLOSED
}
```

> `SubscriptionPayment` exists in the schema but **no API route creates one** — there's no `/api/admin/subscriptions/*/payment` endpoint. Tenant subscription state today is managed entirely through `PATCH /api/admin/tenants/[id]`, which upserts `Subscription` directly (`type`, `status`, `endDate`) without ever touching `SubscriptionPayment`. Also: there is **no cron job or scheduled task anywhere in the repo** that auto-expires subscriptions — `status: EXPIRED` would have to be set manually today.

```prisma
// ─────────────────────────────────────────────
// TABLES
// ─────────────────────────────────────────────

model RestaurantTable {
  id          String   @id @default(uuid(7)) @db.Uuid
  tenantId    String   @db.Uuid
  name        String
  capacity    Int      @default(4)
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdById String?  @db.Uuid
  updatedById String?  @db.Uuid
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant    Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdBy User?  @relation("RestaurantTableCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy User?  @relation("RestaurantTableUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)

  @@unique([tenantId, name])
  @@index([tenantId])
  @@map("restaurant_tables")
}
```

Powers `/settings/tables` and the table picker in `/new-order` for dine-in orders. Every new tenant gets two default tables (`T1`, `T2`) seeded by `lib/tenant-defaults.ts`.

```prisma
// ─────────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────────

model Announcement {
  id          String             @id @default(uuid(7)) @db.Uuid
  title       String
  content     String
  targetType  AnnouncementTarget @default(ALL)
  isActive    Boolean            @default(true)
  createdById String?            @db.Uuid
  updatedById String?            @db.Uuid
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  createdBy User?                @relation("AnnouncementCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy User?                @relation("AnnouncementUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)
  targets   AnnouncementTenant[]
  reads     AnnouncementRead[]

  @@index([createdAt])
  @@map("announcements")
}

model AnnouncementTenant {
  id             String   @id @default(uuid(7)) @db.Uuid
  announcementId String   @db.Uuid
  tenantId       String   @db.Uuid
  createdById    String?  @db.Uuid
  updatedById    String?  @db.Uuid
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  announcement Announcement @relation(fields: [announcementId], references: [id], onDelete: Cascade)
  tenant       Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdBy    User?        @relation("AnnouncementTenantCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy    User?        @relation("AnnouncementTenantUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)

  @@unique([announcementId, tenantId])
  @@map("announcement_tenants")
}

model AnnouncementRead {
  id             String   @id @default(uuid(7)) @db.Uuid
  announcementId String   @db.Uuid
  tenantId       String   @db.Uuid
  readAt         DateTime @default(now())
  createdById    String?  @db.Uuid
  updatedById    String?  @db.Uuid
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  announcement Announcement @relation(fields: [announcementId], references: [id], onDelete: Cascade)
  tenant       Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdBy    User?        @relation("AnnouncementReadCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy    User?        @relation("AnnouncementReadUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)

  @@unique([announcementId, tenantId])
  @@map("announcement_reads")
}

enum AnnouncementTarget {
  ALL
  SELECTED
}
```

Platform admin (`SUPER_ADMIN`) broadcasts announcements to `ALL` tenants or a `SELECTED` subset (via `AnnouncementTenant` join rows). Each tenant's read state is tracked per-announcement in `AnnouncementRead`, powering the unread badge on `/announcements`.

```prisma
// ─────────────────────────────────────────────
// COMMUNITY CHAT
// ─────────────────────────────────────────────

model CommunityMessage {
  id          String   @id @default(uuid(7)) @db.Uuid
  tenantId    String?  @db.Uuid
  senderName  String
  isAdmin     Boolean  @default(false)
  content     String
  createdById String?  @db.Uuid
  updatedById String?  @db.Uuid
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant    Tenant? @relation(fields: [tenantId], references: [id], onDelete: SetNull)
  createdBy User?   @relation("CommunityMessageCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy User?   @relation("CommunityMessageUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)

  @@index([createdAt])
  @@map("community_messages")
}

// ─────────────────────────────────────────────
// DIRECT MESSAGES (Restaurant ↔ Admin)
// ─────────────────────────────────────────────

model DirectMessage {
  id          String   @id @default(uuid(7)) @db.Uuid
  tenantId    String   @db.Uuid
  content     String
  fromAdmin   Boolean  @default(false)
  senderName  String
  isRead      Boolean  @default(false)
  createdById String?  @db.Uuid
  updatedById String?  @db.Uuid
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant    Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdBy User?  @relation("DirectMessageCreatedBy", fields: [createdById], references: [id], onDelete: SetNull)
  updatedBy User?  @relation("DirectMessageUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)

  @@index([tenantId, createdAt])
  @@index([tenantId, isRead])
  @@map("direct_messages")
}
```

`CommunityMessage` is a single global room across all tenants + admin (`tenantId: null` when the sender is `SUPER_ADMIN`, displayed as "Admin"). `DirectMessage` is a private 1:1 thread between one tenant and the platform admin. Both power `/chat` (tenant side) and `/admin/chat` (admin side).

## Connection setup

- `datasource db { provider = "postgresql" }` — note there's **no `url`/`directUrl` in the datasource block itself**. Prisma 7 resolves connection strings from `prisma.config.ts` instead (see `STACK.md`).
- Runtime queries go through `@prisma/adapter-pg` (`lib/prisma.ts`) using `DATABASE_URL` (Supabase pgBouncer transaction pooler, port 6543).
- `prisma migrate` / `prisma db seed` / `prisma studio` use `DIRECT_URL` (Supabase direct connection, port 5432), configured in `prisma.config.ts`.
