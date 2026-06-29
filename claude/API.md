# API.md — API Routes

## Standard Response Format

Every API route returns this shape:

```typescript
// Success
{ data: T, message?: string }

// Error
{ error: string, details?: unknown }

// Paginated
{ data: T[], total: number, page: number, pageSize: number }
```

## Standard Response Helper

```typescript
// lib/api-response.ts
import { NextResponse } from 'next/server'

export function ok<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({ data, message }, { status: 200 })
}

export function created<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({ data, message }, { status: 201 })
}

export function badRequest(error: string, details?: unknown): NextResponse {
  return NextResponse.json({ error, details }, { status: 400 })
}

export function notFound(resource: string): NextResponse {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 })
}

export function serverError(error?: string): NextResponse {
  return NextResponse.json(
    { error: error ?? 'Internal server error' },
    { status: 500 }
  )
}
```

---

## Auth Routes

### `POST /api/auth/register`
Creates new tenant + owner user.

**Request:**
```typescript
{
  restaurantName: string  // min 2 chars
  ownerName: string       // min 2 chars
  email: string           // valid email
  password: string        // min 8 chars, 1 uppercase, 1 number
  confirmPassword: string // must match password
}
```

**Response:**
```typescript
{ data: { message: 'Registration successful' } }
```

---

### `POST /api/invite` — Create invite
**Role:** OWNER, MANAGER

**Request:**
```typescript
{
  email: string
  role: 'MANAGER' | 'WAITER' | 'KITCHEN'
}
```

**Response:**
```typescript
{ data: { id: string, email: string, role: string, expiresAt: string } }
```

---

### `GET /api/invite/[token]` — Validate invite token

**Response:**
```typescript
{
  data: {
    email: string
    role: string
    tenantName: string
    expiresAt: string
    isValid: boolean
  }
}
```

---

### `POST /api/invite/[token]` — Accept invite

**Request:**
```typescript
{
  name: string
  password: string
  confirmPassword: string
}
```

**Response:**
```typescript
{ data: { message: 'Account created. Please login.' } }
```

---

## Orders

### `GET /api/orders`
**Role:** All authenticated

**Query params:**
```
status?: 'PENDING' | 'IN_PROGRESS' | 'READY' | 'SERVED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED'
search?: string        // searches orderNumber, customerName, customerPhone
page?: number          // default 1
pageSize?: number      // default 20
dateFrom?: string      // ISO date
dateTo?: string        // ISO date
```

**Response:**
```typescript
{
  data: OrderListItem[]
  total: number
  page: number
  pageSize: number
}

interface OrderListItem {
  id: string
  orderNumber: string
  type: 'DINE_IN' | 'PARCEL' | 'DELIVERY'
  tableNumber: string | null
  status: OrderStatus
  subtotal: number
  totalGST: number
  grandTotal: number
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod | null
  itemCount: number
  customer: {
    id: string
    name: string
    phone: string
  }
  createdAt: string
  updatedAt: string
}
```

---

### `POST /api/orders` — Create order
**Role:** All authenticated

**Request:**
```typescript
{
  customerId: string
  type: 'DINE_IN' | 'PARCEL'
  tableNumber?: string
  notes?: string
  items: Array<{
    menuItemId: string
    quantity: number
    notes?: string
  }>
  payNow?: boolean
  paymentMethod?: 'CASH' | 'CARD' | 'UPI'
}
```

**Response:**
```typescript
{
  data: {
    id: string
    orderNumber: string
    grandTotal: number
    status: string
    paymentStatus: string
  }
}
```

---

### `GET /api/orders/[id]` — Get single order
**Role:** All authenticated

**Response:**
```typescript
{
  data: {
    id: string
    orderNumber: string
    type: string
    tableNumber: string | null
    status: string
    notes: string | null
    subtotal: number
    totalGST: number
    totalCGST: number
    totalSGST: number
    grandTotal: number
    paymentStatus: string
    paymentMethod: string | null
    paidAmount: number
    paidAt: string | null
    gstBreakup: Record<string, { base: number; gstAmount: number; cgst: number; sgst: number }>
    items: Array<{
      id: string
      name: string
      quantity: number
      price: number
      gstRate: number
      subtotal: number
      gstAmount: number
      cgst: number
      sgst: number
      total: number
    }>
    customer: {
      id: string
      name: string
      phone: string
      email: string | null
    }
    createdBy: {
      id: string
      name: string
    } | null
    createdAt: string
    updatedAt: string
    completedAt: string | null
  }
}
```

---

### `PATCH /api/orders/[id]` — Update order status or payment
**Role:** All authenticated

**Request:**
```typescript
// Update status
{
  action: 'UPDATE_STATUS'
  status: 'IN_PROGRESS' | 'READY' | 'SERVED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED'
}

// Mark payment
{
  action: 'MARK_PAYMENT'
  paymentMethod: 'CASH' | 'CARD' | 'UPI'
  amount?: number  // defaults to grandTotal (full payment)
}
```

**Response:**
```typescript
{
  data: {
    id: string
    status: string
    paymentStatus: string
    updatedAt: string
  }
}
```

---

## Customers

### `GET /api/customers`
**Role:** All authenticated

**Query params:**
```
search?: string     // name or phone
page?: number
pageSize?: number
```

**Response:**
```typescript
{
  data: Array<{
    id: string
    name: string
    phone: string
    email: string | null
    address: string | null
    totalOrders: number
    totalSpent: number
    lastVisitAt: string | null
    createdAt: string
  }>
  total: number
}
```

---

### `GET /api/customers/search?phone=[phone]`
Used in New Order flow to find customer by phone.

**Response:**
```typescript
{
  data: {
    id: string
    name: string
    phone: string
    email: string | null
    address: string | null
    totalOrders: number
    lastVisitAt: string | null
  } | null   // null if not found
}
```

---

### `POST /api/customers`
**Role:** All authenticated

**Request:**
```typescript
{
  name: string
  phone: string    // unique per tenant
  email?: string
  address?: string
  notes?: string
}
```

---

### `PATCH /api/customers/[id]`
**Role:** All authenticated

Same fields as POST, all optional.

---

## Menu Items

### `GET /api/menu`
**Role:** All authenticated

**Query params:**
```
categoryId?: string
available?: boolean   // filter available only
search?: string
```

**Response:**
```typescript
{
  data: Array<{
    id: string
    name: string
    description: string | null
    price: number
    costPrice: number | null
    gstRate: number
    isAvailable: boolean
    isVeg: boolean
    sortOrder: number
    category: {
      id: string
      name: string
    } | null
    inventoryItem: {
      id: string
      name: string
      quantity: number
      unit: string
    } | null
  }>
}
```

---

### `POST /api/menu`
**Role:** OWNER, MANAGER

**Request:**
```typescript
{
  name: string
  categoryId?: string
  description?: string
  price: number          // must be > 0
  costPrice?: number
  gstRate: 0 | 5 | 12 | 18 | 28
  isAvailable?: boolean  // default true
  isVeg?: boolean        // default true
  inventoryItemId?: string
}
```

---

### `PATCH /api/menu/[id]`
**Role:** OWNER, MANAGER

All POST fields optional, plus:
```typescript
{
  isAvailable?: boolean  // quick toggle
}
```

---

### `DELETE /api/menu/[id]`
**Role:** OWNER

Checks for order history first. Returns error if item has orders.

---

## Categories

### `GET /api/categories`
Returns all categories for the tenant, sorted by `sortOrder`.

### `POST /api/categories`
**Role:** OWNER, MANAGER
```typescript
{ name: string, sortOrder?: number }
```

### `PATCH /api/categories/[id]`
**Role:** OWNER, MANAGER

### `DELETE /api/categories/[id]`
**Role:** OWNER
Fails if category has menu items.

---

## Inventory

### `GET /api/inventory`
**Role:** OWNER, MANAGER

**Query params:**
```
lowStock?: boolean   // return only items below minimum
search?: string
```

**Response:**
```typescript
{
  data: Array<{
    id: string
    name: string
    unit: string
    quantity: number
    minStockLevel: number
    costPerUnit: number
    supplier: string | null
    lastRestockedAt: string | null
    isLowStock: boolean      // computed: quantity <= minStockLevel
    stockValue: number       // computed: quantity * costPerUnit
    linkedMenuItems: Array<{ id: string; name: string }>
  }>
  summary: {
    totalItems: number
    lowStockCount: number
    totalValue: number
  }
}
```

---

### `POST /api/inventory`
**Role:** OWNER, MANAGER
```typescript
{
  name: string
  unit: string
  quantity: number
  minStockLevel: number
  costPerUnit: number
  supplier?: string
}
```

---

### `PATCH /api/inventory/[id]`
**Role:** OWNER, MANAGER

All fields optional, plus:
```typescript
{
  action?: 'RESTOCK'    // special action to add stock
  addQuantity?: number  // used with RESTOCK action
  restockNote?: string
}
```

When `action: 'RESTOCK'`:
- Adds `addQuantity` to current `quantity`
- Creates `RestockLog` record
- Updates `lastRestockedAt`

---

### `DELETE /api/inventory/[id]`
**Role:** OWNER
Fails if item is linked to menu items.

---

## Reports

### `GET /api/reports`
**Role:** OWNER, MANAGER

**Query params:**
```
period: 'today' | 'week' | 'month' | 'all'
dateFrom?: string   // for custom range (future)
dateTo?: string
```

**Response:**
```typescript
{
  data: {
    summary: {
      grossRevenue: number        // grand total of paid orders
      taxableRevenue: number      // subtotal of paid orders
      totalGSTCollected: number
      totalCGST: number
      totalSGST: number
      totalOrders: number
      paidOrders: number
      avgOrderValue: number
    }
    gstByRate: Array<{
      rate: number
      base: number
      gstAmount: number
      cgst: number
      sgst: number
      orderCount: number
    }>
    topItems: Array<{
      menuItemId: string
      name: string
      quantitySold: number
      revenue: number
    }>
    paymentBreakdown: Array<{
      method: string
      count: number
      amount: number
    }>
    monthlyRevenue: Array<{
      month: string      // "Jan 2025"
      revenue: number
      gst: number
      orderCount: number
    }>
    statusBreakdown: Array<{
      status: string
      count: number
    }>
  }
}
```

---

## Settings

### `GET /api/settings`
**Role:** OWNER, MANAGER

Returns tenant info + GST config.

### `PATCH /api/settings`
**Role:** OWNER

```typescript
{
  name?: string
  phone?: string
  email?: string
  address?: string
  gstin?: string
  gstName?: string
  defaultGSTRate?: 0 | 5 | 12 | 18 | 28
  isGSTRegistered?: boolean
}
```

---

## Team

### `GET /api/team`
**Role:** OWNER, MANAGER

Returns all users for tenant.

### `PATCH /api/team/[userId]`
**Role:** OWNER

```typescript
{
  role?: UserRole
  isActive?: boolean
}
```

Cannot change own role. Cannot deactivate self.

### `DELETE /api/invite/[inviteId]`
**Role:** OWNER, MANAGER

Cancels a pending invite.
