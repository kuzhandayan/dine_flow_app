# ADMIN.md — Super Admin Panel & Tenant Management

## Overview

DineFlow has two completely separate worlds:

```
/admin/*          → Super Admin only (you, the platform owner)
/login            → Restaurant staff login (tenants)
/(dashboard)/*    → Restaurant dashboard (tenant-scoped)
```

The admin panel is a hidden, separate section of the app.
No links point to it from the main app.
Only accessible if you know the URL and have SUPER_ADMIN role.

---

## Admin Login Flow

```
You go to: yourdomain.com/admin/login
        ↓
Enter admin email + password
        ↓
NextAuth checks role === SUPER_ADMIN
        ↓
Redirected to: /admin/dashboard
        ↓
Full platform view — all tenants, all data
```

Normal restaurant users who try to access /admin/* 
→ redirected to /dashboard (their restaurant)

---

## Admin Routes

```
/admin/login              → Admin-only login page (separate from /login)
/admin/dashboard          → Platform overview stats
/admin/tenants            → All restaurants list
/admin/tenants/new        → Create new tenant + owner account
/admin/tenants/[id]       → Single tenant detail
/admin/tenants/[id]/edit  → Edit tenant details
/admin/subscriptions      → All subscriptions, payment status
/admin/reports            → Platform-wide revenue, usage reports
```

These routes are ONLY visible and accessible when logged in as SUPER_ADMIN.
Middleware blocks all /admin/* routes for any other role.

---

## Tenant Creation Flow (Admin Only)

```
Admin clicks "Create New Restaurant"
        ↓
Fills form:
  - Restaurant Name
  - Owner Name
  - Owner Email
  - Owner Phone
  - Subscription Type (Lifetime / Duration-based)
  - If Duration: start date + end date OR months
        ↓
System auto-generates:
  - Tenant record
  - Owner user account
  - Temporary password (auto-generated)
  - Subscription record
        ↓
Admin sees confirmation screen with:
  - Restaurant Name
  - Login URL: yourdomain.com/login
  - Owner Email
  - Temporary Password (shown once, copy it)
        ↓
Admin manually shares credentials with restaurant owner
        ↓
Owner logs in → forced to change password on first login
```

---

## Subscription System

### Two Types

**Type 1 — Lifetime**
```
Restaurant can use the app forever
Until admin manually suspends/closes it
No expiry date
Payment: one-time (tracked manually by admin)
```

**Type 2 — Duration (Pay-as-you-go)**
```
Restaurant gets access for a fixed period
Example: 3 months, 6 months, 1 year
Admin sets start date + end date
When end date passes → restaurant gets locked out
Admin can extend by updating end date after payment
Payment: recurring (tracked manually by admin)
```

### Subscription Status Flow
```
ACTIVE    → Restaurant can use app normally
EXPIRED   → Restaurant locked out, sees "Subscription expired" page
SUSPENDED → Admin manually suspended (non-payment or violation)
CLOSED    → Admin permanently closed the account
```

### Lock-out Behavior
When subscription is EXPIRED or SUSPENDED:
- Restaurant owner and staff cannot login
- If already logged in → session invalidated on next request
- They see a page: "Your subscription has expired. Contact support."
- Admin can reactivate instantly by updating subscription

---

## Prisma Schema Additions

Add these models to `prisma/schema.prisma`:

```prisma
model Subscription {
  id               String             @id @default(cuid())
  tenantId         String             @unique
  type             SubscriptionType   @default(LIFETIME)
  status           SubscriptionStatus @default(ACTIVE)
  startDate        DateTime           @default(now())
  endDate          DateTime?          // null = lifetime
  amount           Float?             // how much they paid (for records)
  currency         String             @default("INR")
  notes            String?            // admin notes about this subscription
  lastPaymentAt    DateTime?
  lastPaymentAmt   Float?
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  tenant           Tenant             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  payments         SubscriptionPayment[]

  @@map("subscriptions")
}

model SubscriptionPayment {
  id              String   @id @default(cuid())
  subscriptionId  String
  amount          Float
  currency        String   @default("INR")
  method          String   // cash, bank transfer, upi, etc.
  reference       String?  // payment reference number
  paidAt          DateTime @default(now())
  extendedUntil   DateTime? // new end date after this payment
  notes           String?
  recordedBy      String   // admin user id who recorded this

  subscription    Subscription @relation(fields: [subscriptionId], references: [id])

  @@map("subscription_payments")
}

enum SubscriptionType {
  LIFETIME   // no expiry
  DURATION   // fixed period, pay-as-you-go
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRED
  SUSPENDED
  CLOSED
}
```

Also update the Tenant model to include:
```prisma
model Tenant {
  // ... existing fields ...
  subscription    Subscription?
  isSuspended     Boolean  @default(false)  // admin override
  suspendedAt     DateTime?
  suspendedReason String?
}
```

---

## Middleware Updates

Update `middleware.ts` to handle:

```typescript
// 1. Block /admin/* for non-SUPER_ADMIN
if (pathname.startsWith('/admin')) {
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/admin/login', req.url))
  }
}

// 2. Check subscription status for all dashboard routes
if (pathname.startsWith('/dashboard') || isDashboardRoute(pathname)) {
  if (session && session.user.role !== 'SUPER_ADMIN') {
    const isActive = await checkSubscriptionActive(session.user.tenantId)
    if (!isActive) {
      return NextResponse.redirect(new URL('/subscription-expired', req.url))
    }
  }
}
```

```typescript
// lib/subscription.ts
export async function checkSubscriptionActive(tenantId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { tenantId },
    select: { status: true, type: true, endDate: true }
  })

  if (!sub) return false
  if (sub.status === 'SUSPENDED' || sub.status === 'CLOSED') return false
  if (sub.status === 'EXPIRED') return false

  // Check if duration subscription has expired
  if (sub.type === 'DURATION' && sub.endDate) {
    if (new Date() > sub.endDate) {
      // Auto-update status to EXPIRED
      await prisma.subscription.update({
        where: { tenantId },
        data: { status: 'EXPIRED' }
      })
      return false
    }
  }

  return true
}
```

---

## Admin API Routes

### Tenant Management

```
GET    /api/admin/tenants              → list all tenants with subscription status
POST   /api/admin/tenants              → create new tenant + owner + subscription
GET    /api/admin/tenants/[id]         → single tenant full detail
PATCH  /api/admin/tenants/[id]         → update tenant details
POST   /api/admin/tenants/[id]/suspend → suspend tenant
POST   /api/admin/tenants/[id]/close   → close tenant permanently
```

### Subscription Management

```
GET    /api/admin/subscriptions               → all subscriptions
PATCH  /api/admin/subscriptions/[id]          → update subscription (extend, change type)
POST   /api/admin/subscriptions/[id]/payment  → record a payment + extend duration
```

### Platform Reports

```
GET    /api/admin/reports → platform-wide stats
```

All admin API routes start with:
```typescript
const session = await requireRole(['SUPER_ADMIN'])
```

---

## POST /api/admin/tenants — Create Tenant

**Request:**
```typescript
{
  restaurantName: string
  ownerName: string
  ownerEmail: string
  ownerPhone?: string
  address?: string
  subscriptionType: 'LIFETIME' | 'DURATION'
  subscriptionMonths?: number   // required if DURATION
  amount?: number               // payment amount recorded
  paymentMethod?: string        // how they paid you
  paymentReference?: string     // payment reference
  notes?: string
}
```

**What it does (all in one transaction):**
```typescript
await prisma.$transaction(async (tx) => {
  // 1. Create tenant
  const tenant = await tx.tenant.create({ data: { name, slug } })

  // 2. Generate temp password
  const tempPassword = generateTempPassword() // e.g. "Dine@2847"
  const hashed = await bcrypt.hash(tempPassword, 12)

  // 3. Create owner user
  await tx.user.create({
    data: {
      tenantId: tenant.id,
      name: ownerName,
      email: ownerEmail,
      password: hashed,
      role: 'OWNER',
      mustChangePassword: true,  // force change on first login
    }
  })

  // 4. Create subscription
  const endDate = type === 'DURATION'
    ? addMonths(new Date(), months)
    : null

  await tx.subscription.create({
    data: {
      tenantId: tenant.id,
      type,
      status: 'ACTIVE',
      endDate,
      amount,
    }
  })

  // 5. Create GSTConfig defaults
  await tx.gSTConfig.create({ data: { tenantId: tenant.id } })

  return { tenant, tempPassword }  // return temp password to show admin
})
```

**Response:**
```typescript
{
  data: {
    tenantId: string
    restaurantName: string
    loginUrl: string         // "https://yourdomain.com/login"
    ownerEmail: string
    temporaryPassword: string  // shown ONCE — admin must copy this
    subscriptionType: string
    subscriptionEndDate: string | null
  }
}
```

---

## PATCH /api/admin/subscriptions/[id]/payment — Record Payment + Extend

**Request:**
```typescript
{
  amount: number
  method: string           // "cash" | "upi" | "bank_transfer" | "cheque"
  reference?: string       // UPI ref, cheque number, etc.
  extendMonths?: number    // how many months to extend (for DURATION type)
  notes?: string
}
```

**What it does:**
```typescript
// Record payment
await prisma.subscriptionPayment.create({ ... })

// Extend end date if DURATION type
if (type === 'DURATION' && extendMonths) {
  const currentEnd = subscription.endDate ?? new Date()
  const newEnd = addMonths(
    currentEnd > new Date() ? currentEnd : new Date(), // extend from current end or today
    extendMonths
  )
  await prisma.subscription.update({
    where: { id },
    data: {
      endDate: newEnd,
      status: 'ACTIVE',  // reactivate if was expired
      lastPaymentAt: new Date(),
      lastPaymentAmt: amount,
    }
  })
}
```

---

## GET /api/admin/reports — Platform Stats

**Response:**
```typescript
{
  data: {
    overview: {
      totalTenants: number
      activeTenants: number
      expiredTenants: number
      suspendedTenants: number
      lifetimeTenants: number
      durationTenants: number
    }
    revenue: {
      totalCollected: number      // sum of all subscription payments
      thisMonth: number
      thisYear: number
    }
    usage: {
      totalOrders: number         // across all tenants
      totalCustomers: number
      totalRevenue: number        // restaurant revenue across platform
    }
    expiringSoon: Array<{         // subscriptions expiring in next 30 days
      tenantId: string
      restaurantName: string
      endDate: string
      ownerEmail: string
    }>
    recentPayments: Array<{
      restaurantName: string
      amount: number
      method: string
      paidAt: string
    }>
    tenantActivity: Array<{       // most active restaurants
      restaurantName: string
      ordersThisMonth: number
      revenueThisMonth: number
    }>
  }
}
```

---

## Admin Dashboard UI Pages

### `/admin/dashboard`
- Total active restaurants
- Total subscriptions revenue collected
- Expiring soon alerts (next 30 days)
- Platform-wide orders and revenue stats
- Recent subscription payments
- Quick links to all admin sections

### `/admin/tenants`
Table columns:
```
Restaurant Name | Owner | Phone | Subscription | Status | Expires | Orders | Actions
```
- Filter by: All / Active / Expired / Suspended
- Search by restaurant name or owner email
- Quick actions: View, Suspend, Extend

### `/admin/tenants/new`
Form to create new tenant (see API section above).
On success: show credentials screen with copy button for temp password.

### `/admin/tenants/[id]`
Full tenant detail page:
- Restaurant info (name, address, contact)
- Owner details
- Subscription history (all payments recorded)
- Current subscription status + end date
- Usage stats (orders, revenue, customers, menu items)
- Staff list
- Action buttons: Suspend / Reactivate / Extend Subscription / Close Account

### `/admin/subscriptions`
All subscriptions in one view:
- Filter: Active / Expired / Expiring Soon (next 30 days)
- For each: restaurant name, type, status, end date, last payment
- Quick extend button (opens modal: months + amount + method)

---

## User Model Addition

Add `mustChangePassword` field to User:

```prisma
model User {
  // ... existing fields ...
  mustChangePassword Boolean @default(false)
}
```

On first login after admin creates account:
- Middleware detects `mustChangePassword === true`
- Redirects to `/change-password` before accessing dashboard
- After password changed → `mustChangePassword` set to false
- Normal dashboard access resumes

---

## Subscription Expiry Cron Job

Run daily to auto-expire subscriptions:

```typescript
// app/api/cron/check-subscriptions/route.ts
// Called by Vercel Cron or external cron service

export async function GET(req: Request): Promise<Response> {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find all DURATION subscriptions past end date
  const expired = await prisma.subscription.findMany({
    where: {
      type: 'DURATION',
      status: 'ACTIVE',
      endDate: { lt: new Date() }
    }
  })

  // Mark them expired
  await prisma.subscription.updateMany({
    where: { id: { in: expired.map(s => s.id) } },
    data: { status: 'EXPIRED' }
  })

  // TODO: Send expiry notification email to restaurant owner

  return Response.json({
    processed: expired.length,
    expiredIds: expired.map(s => s.tenantId)
  })
}
```

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/check-subscriptions",
      "schedule": "0 1 * * *"
    }
  ]
}
```
Add `CRON_SECRET` to env variables (generate with `openssl rand -base64 32`).

---

## Admin User Seeding

Add to `prisma/seed.ts`:

```typescript
// Create Super Admin (you)
const adminPassword = await bcrypt.hash('your-admin-password', 12)
await prisma.user.create({
  data: {
    tenantId: tenant.id,  // admin needs a tenant — create a platform tenant
    name: 'Platform Admin',
    email: 'admin@dineflow.com',  // change this to your email
    password: adminPassword,
    role: 'SUPER_ADMIN',
  }
})
```

**Important:**
- Change admin email and password before deploying
- Never commit actual admin credentials
- Store in environment variables:

```env
ADMIN_EMAIL="your-email@gmail.com"
ADMIN_INITIAL_PASSWORD="generate-strong-password"
```

---

## Security Notes for Admin Panel

1. `/admin/login` is a separate login page — different from `/login`
2. Even if someone finds the URL, they need SUPER_ADMIN credentials
3. All `/admin/*` API routes check `role === SUPER_ADMIN` first
4. Admin actions are not logged yet (Phase 2: add audit log)
5. Consider IP whitelisting for `/admin/*` routes in production (your home/office IP only)
6. Enable 2FA for admin account (Phase 2)

---

## Summary of What Admin Can Do

```
✅ Create new restaurant tenant
✅ Set subscription type (Lifetime or Duration)
✅ See all restaurants and their status
✅ View each restaurant's orders, revenue, activity
✅ Record subscription payments
✅ Extend subscription duration
✅ Suspend a restaurant (immediate lockout)
✅ Reactivate a suspended restaurant
✅ Close a restaurant permanently
✅ See platform-wide reports and revenue
✅ See which subscriptions are expiring soon
✅ View subscription payment history per restaurant

❌ Admin cannot edit restaurant's actual menu/orders/customers
   (that's the restaurant owner's data — admin only manages the platform)
```
