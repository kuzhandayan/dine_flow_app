# SCHEMA.md — Database Schema (Prisma)

## File: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─────────────────────────────────────────────
// MULTI-TENANT CORE
// ─────────────────────────────────────────────

model Tenant {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique  // used in URLs
  gstin       String?           // GST registration number
  gstName     String?           // Legal name on GST certificate
  address     String?
  phone       String?
  email       String?
  logo        String?           // URL to logo image
  currency    String   @default("INR")
  timezone    String   @default("Asia/Kolkata")
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  users       User[]
  customers   Customer[]
  orders      Order[]
  menuItems   MenuItem[]
  categories  Category[]
  inventory   InventoryItem[]
  invites     Invite[]
  gstConfig   GSTConfig?

  // Subscription relation
  subscription    Subscription?

  // Admin controls
  isSuspended     Boolean   @default(false)
  suspendedAt     DateTime?
  suspendedReason String?

  @@map("tenants")
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  tenantId      String
  name          String
  email         String
  emailVerified DateTime?
  password      String               // bcrypt hashed
  role          UserRole  @default(WAITER)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  tenant        Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  sessions      Session[]
  orders        Order[]   @relation("OrderCreatedBy")

  mustChangePassword Boolean  @default(false)  // true when admin creates account

  @@unique([tenantId, email])
  @@map("users")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
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
  id        String      @id @default(cuid())
  tenantId  String
  email     String
  role      UserRole    @default(WAITER)
  token     String      @unique @default(cuid())
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime    @default(now())

  tenant    Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("invites")
}

enum UserRole {
  SUPER_ADMIN   // platform owner (you)
  OWNER         // restaurant owner
  MANAGER       // manager - most access
  WAITER        // take orders, update status
  KITCHEN       // view orders, update cooking status
}

// ─────────────────────────────────────────────
// CUSTOMERS
// ─────────────────────────────────────────────

model Customer {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  phone       String
  email       String?
  address     String?
  notes       String?
  totalOrders Int      @default(0)
  totalSpent  Float    @default(0)
  lastVisitAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  orders      Order[]

  @@unique([tenantId, phone])
  @@index([tenantId])
  @@map("customers")
}

// ─────────────────────────────────────────────
// MENU
// ─────────────────────────────────────────────

model Category {
  id          String     @id @default(cuid())
  tenantId    String
  name        String
  sortOrder   Int        @default(0)
  isActive    Boolean    @default(true)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  tenant      Tenant     @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  menuItems   MenuItem[]

  @@unique([tenantId, name])
  @@index([tenantId])
  @@map("categories")
}

model MenuItem {
  id              String         @id @default(cuid())
  tenantId        String
  categoryId      String?
  name            String
  description     String?
  price           Float          // base price before GST
  costPrice       Float?         // cost price for profit calculation
  gstRate         Float          @default(5)  // GST % applied to this item
  isAvailable     Boolean        @default(true)
  isVeg           Boolean        @default(true)
  sortOrder       Int            @default(0)
  inventoryItemId String?        // linked inventory item
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  // Relations
  tenant          Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  category        Category?      @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  inventoryItem   InventoryItem? @relation(fields: [inventoryItemId], references: [id], onDelete: SetNull)
  orderItems      OrderItem[]

  @@index([tenantId])
  @@index([tenantId, categoryId])
  @@map("menu_items")
}

// ─────────────────────────────────────────────
// INVENTORY
// ─────────────────────────────────────────────

model InventoryItem {
  id              String         @id @default(cuid())
  tenantId        String
  name            String
  unit            String         // kg, litre, pcs, dozen, etc.
  quantity        Float          @default(0)
  minStockLevel   Float          @default(0)
  costPerUnit     Float          @default(0)
  supplier        String?
  lastRestockedAt DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  // Relations
  tenant          Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  menuItems       MenuItem[]
  restockLogs     RestockLog[]

  @@index([tenantId])
  @@map("inventory_items")
}

model RestockLog {
  id              String        @id @default(cuid())
  inventoryItemId String
  quantityAdded   Float
  costPerUnit     Float?
  supplier        String?
  notes           String?
  createdAt       DateTime      @default(now())

  inventoryItem   InventoryItem @relation(fields: [inventoryItemId], references: [id], onDelete: Cascade)

  @@map("restock_logs")
}

// ─────────────────────────────────────────────
// ORDERS
// ─────────────────────────────────────────────

model Order {
  id              String        @id @default(cuid())
  tenantId        String
  customerId      String
  createdById     String?       // which staff member created this order
  orderNumber     String        // human-readable: ORD-000001
  type            OrderType     @default(DINE_IN)
  tableNumber     String?
  status          OrderStatus   @default(PENDING)
  notes           String?

  // Billing
  subtotal        Float         // base amount before GST
  totalGST        Float         // total GST amount
  totalCGST       Float         // CGST portion
  totalSGST       Float         // SGST portion
  grandTotal      Float         // subtotal + totalGST

  // Payment
  paymentStatus   PaymentStatus @default(UNPAID)
  paymentMethod   PaymentMethod?
  paidAmount      Float         @default(0)
  paidAt          DateTime?

  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  completedAt     DateTime?

  // Relations
  tenant          Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  customer        Customer      @relation(fields: [customerId], references: [id])
  createdBy       User?         @relation("OrderCreatedBy", fields: [createdById], references: [id])
  items           OrderItem[]
  payments        Payment[]

  @@index([tenantId])
  @@index([tenantId, status])
  @@index([tenantId, createdAt])
  @@index([customerId])
  @@map("orders")
}

model OrderItem {
  id          String   @id @default(cuid())
  orderId     String
  menuItemId  String
  name        String   // snapshot at time of order
  price       Float    // snapshot at time of order
  gstRate     Float    // snapshot at time of order
  quantity    Int
  subtotal    Float    // price * quantity (before GST)
  gstAmount   Float    // GST on this item
  cgst        Float    // CGST portion
  sgst        Float    // SGST portion
  total       Float    // subtotal + gstAmount
  notes       String?

  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  menuItem    MenuItem @relation(fields: [menuItemId], references: [id])

  @@index([orderId])
  @@map("order_items")
}

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────

model Payment {
  id            String        @id @default(cuid())
  orderId       String
  amount        Float
  method        PaymentMethod
  status        String        @default("success")
  reference     String?       // transaction ID, UPI ref, etc.
  // Future: Razorpay fields
  // razorpayOrderId   String?
  // razorpayPaymentId String?
  // razorpaySignature String?
  createdAt     DateTime      @default(now())

  order         Order         @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId])
  @@map("payments")
}

// ─────────────────────────────────────────────
// GST CONFIGURATION
// ─────────────────────────────────────────────

model GSTConfig {
  id              String   @id @default(cuid())
  tenantId        String   @unique
  defaultGSTRate  Float    @default(5)
  isGSTRegistered Boolean  @default(false)
  gstin           String?
  gstBusinessName String?
  gstAddress      String?
  updatedAt       DateTime @updatedAt

  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@map("gst_configs")
}

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

enum OrderType {
  DINE_IN
  PARCEL
  DELIVERY
}

enum OrderStatus {
  PENDING       // just placed
  IN_PROGRESS   // kitchen started
  READY         // ready to serve/deliver
  SERVED        // dine-in served
  DELIVERED     // parcel delivered
  COMPLETED     // fully done + paid
  CANCELLED
}

enum PaymentStatus {
  UNPAID
  PARTIAL
  PAID
  REFUNDED
}

// ─────────────────────────────────────────────
// SUBSCRIPTIONS (managed by Super Admin)
// ─────────────────────────────────────────────

model Subscription {
  id               String             @id @default(cuid())
  tenantId         String             @unique
  type             SubscriptionType   @default(LIFETIME)
  status           SubscriptionStatus @default(ACTIVE)
  startDate        DateTime           @default(now())
  endDate          DateTime?          // null = lifetime
  amount           Float?             // payment amount recorded by admin
  currency         String             @default("INR")
  notes            String?
  lastPaymentAt    DateTime?
  lastPaymentAmt   Float?
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  tenant           Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  payments         SubscriptionPayment[]

  @@map("subscriptions")
}

model SubscriptionPayment {
  id              String       @id @default(cuid())
  subscriptionId  String
  amount          Float
  currency        String       @default("INR")
  method          String       // cash, upi, bank_transfer, cheque
  reference       String?      // UPI ref, cheque number, etc.
  paidAt          DateTime     @default(now())
  extendedUntil   DateTime?    // new end date after this payment
  notes           String?
  recordedBy      String       // admin user id

  subscription    Subscription @relation(fields: [subscriptionId], references: [id])

  @@map("subscription_payments")
}

enum SubscriptionType {
  LIFETIME   // no expiry — until admin closes
  DURATION   // fixed period, renew to extend
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  SUSPENDED
  CLOSED
}

enum PaymentMethod {
  CASH
  CARD
  UPI
  // RAZORPAY  // Phase 2
}
```

---

## Prisma Client Singleton

`lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

---

## Seed File

`prisma/seed.ts`:

```typescript
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  // Create demo tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Demo Restaurant',
      slug: 'demo-restaurant',
      gstin: '22AAAAA0000A1Z5',
      gstName: 'Demo Restaurant Pvt Ltd',
      phone: '9999999999',
      email: 'demo@restaurant.com',
    },
  })

  // Create owner user
  const hashedPassword = await bcrypt.hash('demo1234', 12)
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      name: 'Restaurant Owner',
      email: 'owner@demo.com',
      password: hashedPassword,
      role: UserRole.OWNER,
    },
  })

  // Create GST config
  await prisma.gSTConfig.create({
    data: {
      tenantId: tenant.id,
      defaultGSTRate: 5,
      isGSTRegistered: true,
      gstin: '22AAAAA0000A1Z5',
      gstBusinessName: 'Demo Restaurant Pvt Ltd',
    },
  })

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Starter', sortOrder: 1 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Main Course', sortOrder: 2 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Bread', sortOrder: 3 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Rice', sortOrder: 4 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Drinks', sortOrder: 5 } }),
    prisma.category.create({ data: { tenantId: tenant.id, name: 'Dessert', sortOrder: 6 } }),
  ])

  const [starter, mainCourse, bread, rice, drinks, dessert] = categories

  // Create menu items
  await prisma.menuItem.createMany({
    data: [
      { tenantId: tenant.id, categoryId: starter.id, name: 'Paneer Tikka', price: 220, gstRate: 5, costPrice: 80, isVeg: true },
      { tenantId: tenant.id, categoryId: starter.id, name: 'Samosa (2 pcs)', price: 60, gstRate: 5, costPrice: 15, isVeg: true },
      { tenantId: tenant.id, categoryId: mainCourse.id, name: 'Butter Chicken', price: 280, gstRate: 5, costPrice: 120, isVeg: false },
      { tenantId: tenant.id, categoryId: mainCourse.id, name: 'Dal Makhani', price: 180, gstRate: 5, costPrice: 60, isVeg: true },
      { tenantId: tenant.id, categoryId: mainCourse.id, name: 'Chicken Biryani', price: 320, gstRate: 5, costPrice: 130, isVeg: false },
      { tenantId: tenant.id, categoryId: bread.id, name: 'Butter Naan', price: 40, gstRate: 5, costPrice: 10, isVeg: true },
      { tenantId: tenant.id, categoryId: bread.id, name: 'Tandoori Roti', price: 30, gstRate: 5, costPrice: 8, isVeg: true },
      { tenantId: tenant.id, categoryId: rice.id, name: 'Jeera Rice', price: 120, gstRate: 5, costPrice: 30, isVeg: true },
      { tenantId: tenant.id, categoryId: drinks.id, name: 'Mango Lassi', price: 80, gstRate: 12, costPrice: 25, isVeg: true },
      { tenantId: tenant.id, categoryId: drinks.id, name: 'Cold Coffee', price: 100, gstRate: 12, costPrice: 30, isVeg: true },
      { tenantId: tenant.id, categoryId: dessert.id, name: 'Gulab Jamun', price: 90, gstRate: 5, costPrice: 20, isVeg: true },
    ],
  })

  // Create inventory items
  await prisma.inventoryItem.createMany({
    data: [
      { tenantId: tenant.id, name: 'Chicken', unit: 'kg', quantity: 5, minStockLevel: 2, costPerUnit: 250, supplier: 'Fresh Farm' },
      { tenantId: tenant.id, name: 'Paneer', unit: 'kg', quantity: 3, minStockLevel: 1, costPerUnit: 180, supplier: 'Dairy Fresh' },
      { tenantId: tenant.id, name: 'Flour (Maida)', unit: 'kg', quantity: 10, minStockLevel: 3, costPerUnit: 40, supplier: 'Local Market' },
      { tenantId: tenant.id, name: 'Basmati Rice', unit: 'kg', quantity: 8, minStockLevel: 3, costPerUnit: 80, supplier: 'Local Market' },
      { tenantId: tenant.id, name: 'Milk', unit: 'litre', quantity: 6, minStockLevel: 2, costPerUnit: 60, supplier: 'Dairy Fresh' },
      { tenantId: tenant.id, name: 'Tomatoes', unit: 'kg', quantity: 1.5, minStockLevel: 2, costPerUnit: 30, supplier: 'Veggie Mart' },
    ],
  })

  console.log('✅ Seed complete. Login: owner@demo.com / demo1234')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Add to `package.json`:
```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

---

## Key Index Strategy

All queries filter by `tenantId` first — indexes are on:
- `(tenantId)` — all main models
- `(tenantId, status)` — orders (most common filter)
- `(tenantId, createdAt)` — orders for reports
- `(tenantId, phone)` — customers (unique, used for search)
- `(tenantId, name)` — categories (unique)

---

## Order Number Generation

Generate human-readable sequential order numbers per tenant:

```typescript
// lib/orderNumber.ts
export async function generateOrderNumber(tenantId: string): Promise<string> {
  const count = await prisma.order.count({ where: { tenantId } })
  const num = String(count + 1).padStart(6, '0')
  return `ORD-${num}`
}
```

Result: `ORD-000001`, `ORD-000002`, etc.

---

## Database Connection Notes

### Phase 1 — Supabase Free
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")   // Transaction pooler URL (pgBouncer)
  directUrl = env("DIRECT_URL")     // Direct connection URL (for migrations)
}
```
Prisma needs BOTH urls for Supabase:
- `DATABASE_URL` → uses pgBouncer connection pooling (for app queries)
- `DIRECT_URL` → direct connection (for `prisma migrate` commands)

Get both from: Supabase Dashboard → Project → Settings → Database → Connection string

### Phase 2 — Supabase Pro
Same setup, just upgrade plan in Supabase dashboard. Zero code changes.

### Phase 3 — AWS EC2 Postgres
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")   // Direct EC2 connection, no pooler needed
}
```
Update DATABASE_URL in .env → run `prisma migrate deploy` → done.
Zero code changes anywhere in the app.
