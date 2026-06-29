# FEATURES.md — Feature Specifications

## Build Order
Build features strictly in this order. Do not skip ahead.

```
1. Project setup + config
2. Database + Prisma
3. Auth (login, register, session)
4. Dashboard layout (sidebar, topbar)
5. Dashboard page (stats)
6. New Order flow
7. Orders list + management
8. Check Order page
9. Menu CRUD
10. Inventory CRUD
11. Customers page
12. GST config + billing
13. Print bill / PDF
14. Reports page
15. Staff invite + team settings
16. GitHub Actions CI/CD
```

---

## Feature 1 — Auth Pages

### `/login`
- Email + password form
- Zod validation with react-hook-form
- Show password toggle
- "Forgot password?" link
- Error messages inline (not toast)
- On success → redirect to `/dashboard`
- If already logged in → redirect to `/dashboard`
- Loading state on submit button

### `/register`
- Fields: Restaurant Name, Your Name, Email, Password, Confirm Password
- Zod validation
- On submit → create Tenant + Owner User in transaction
- Auto-login after registration
- Redirect to `/dashboard`
- Link back to `/login`

### `/forgot-password`
- Email input
- Send reset email via Resend
- Show success message (don't reveal if email exists or not)

### `/reset-password?token=xxx`
- Validate token from query param
- New password + confirm password
- On success → redirect to `/login`

### `/invite/[token]`
- Show restaurant name and role from invite
- Name + password + confirm password fields
- Validate invite not expired/used
- Create user on submit
- Redirect to `/login` with success message

---

## Feature 2 — Dashboard Layout

### Sidebar (`components/layout/Sidebar.tsx`)
- Logo + restaurant name at top
- Navigation groups:
  - **Operations:** Dashboard, New Order, Orders (badge: active count), Check Order
  - **Management:** Menu, Inventory (badge: low stock count in yellow), GST Config, Customers
  - **Insights:** Reports
  - **Settings:** Team, General Settings
- Logout button at bottom
- Collapsed mobile version
- Active route highlighted
- Badges auto-update from live counts

### Topbar (`components/layout/Topbar.tsx`)
- Page title (dynamic)
- Current date
- Low stock warning badge (click → goes to inventory)
- "+ New Order" button (everywhere except new-order page)
- User avatar + name dropdown (profile, logout)

### Layout wrapper
- Sidebar + main content
- Mobile: hamburger menu → slide-out drawer
- Scrollable main content area

---

## Feature 3 — Dashboard Page (`/dashboard`)

### Stats Row (4 cards)
- Today's Orders (count)
- Today's Revenue (₹, paid orders only)
- Total GST Collected (₹, all time)
- Active Orders (pending + in progress + ready count)

### Live Orders panel
- Shows up to 6 active orders
- Order ID, customer name, item count, status badge, total
- "View All" → goes to `/orders`
- Auto-refreshes every 30 seconds (React Query)

### Order Pipeline
- Progress bars for: Pending, In Kitchen, Ready, Completed
- Shows count per status

### Low Stock Alert panel
- Only shows if any inventory below minimum
- Lists items with current qty

---

## Feature 4 — New Order Flow (`/new-order`)

### Step 1 — Customer Search
- Large phone number input (autofocus)
- Press Enter or click Search
- If found → show customer card → proceed to Step 2
- If not found → show "New Customer" form

### New Customer Form
- Name (required), Phone (required, pre-filled), Email (optional), Address (optional)
- Save → creates customer → proceed to Step 2

### Step 2 — Order Details + Menu
**Top bar:**
- Customer info card (name, phone)
- Order type toggle: Dine-in / Parcel
- Table number input (shows only for Dine-in)

**Menu panel (left, 55% width):**
- Search box
- Category filter pills (horizontal scroll on mobile)
- Each item shows: name, category, GST rate badge, price
- Quantity controls (-, qty, +)
- Items grouped by category

**Bill Preview panel (right, 45% width):**
- Live updates as items added
- Per item: name × qty → base price
- Per item: GST% → +₹amount (shown in muted text)
- Divider
- Subtotal (base)
- Total GST
- Grand Total (bold, accent color)
- Notes field
- "Collect Payment Now" checkbox
  - If checked → show payment method (Cash / Card / UPI)
  - UPI → show QR placeholder + amount
- "Place Order ₹X.XX" button (disabled if no items)

### On Place Order
- Create order with all billing data
- Update customer's totalOrders + totalSpent + lastVisitAt
- Show success toast with Order ID
- Redirect to `/orders`

---

## Feature 5 — Orders Page (`/orders`)

### Filters
- Status tabs: All | Pending | In Kitchen | Ready | Done
- Search box: order ID, customer name, phone number

### Orders Table
Columns: Order ID | Customer | Type | Items | Subtotal | GST | Grand Total | Payment | Status | Actions

- Order ID is clickable → opens order detail modal
- Payment badge: Paid (green) / Unpaid (red) / Partial (yellow)
- Status badge: color-coded
- Actions: View button + Next Status button (contextual label)

### Status Progression Buttons
- Pending → "Start Cooking"
- In Kitchen → "Mark Ready"
- Ready → "Mark Served" (dine-in) or "Mark Delivered" (parcel)
- Served/Delivered → auto or manual complete

### Auto-refresh
- React Query: refetch every 30 seconds
- Optimistic updates on status change

---

## Feature 6 — Order Detail Modal

Triggered from: Orders table, Check Order page, anywhere Order ID is clicked.

### Content
- Order ID + timestamp
- Customer name + phone
- Order type + table number
- Status badge
- Items list with per-item GST breakdown
- Bill summary:
  - Subtotal
  - GST by slab (CGST X% + SGST X%)
  - Grand Total
- Payment status + method
- Notes

### Actions
- Next status button (contextual)
- Mark as Paid via: Cash | Card | UPI buttons (shows if unpaid)
- Print Tax Bill button
- Close button

---

## Feature 7 — Check Order Page (`/check-order`)

- Order ID search input
- Show full order detail (same as modal but full page)
- Same status update + payment mark actions
- "View Full Bill" button

---

## Feature 8 — Menu CRUD (`/menu`)

### Category tabs
- Tab per category + "All" tab
- Category tab shows item count

### Items Table
Columns: Item | Category | Price | Cost | GST Rate | GST/unit | Inv Link | Status | Actions

### Add/Edit Item Modal
Fields:
- Item Name (required)
- Category (text input with datalist suggestions)
- Selling Price ₹ (required)
- Cost Price ₹ (optional, for profit calc)
- GST Rate (select: 0% Exempt / 5% Food / 12% Packaged / 18% Premium / 28% Luxury)
- GST Preview: "₹280 + 5% = ₹294 per unit" (live calc)
- Link to Inventory Item (dropdown, optional)
- Veg / Non-veg toggle
- Available toggle
- Save button

### Delete
- Confirm dialog before delete
- Cannot delete if item has orders (show error)

### Toggle Availability
- Quick toggle button on each row
- No modal needed

---

## Feature 9 — Inventory CRUD (`/inventory`)

### Summary Cards (3)
- Total Items
- Low Stock Alerts (yellow if > 0)
- Total Inventory Value (₹)

### Low Stock Alert Banner
- Shows at top if any items below minimum stock

### Items Table
Columns: Item | Unit | Stock | Min Stock | Stock Level Bar | Cost/Unit | Value | Supplier | Last Restock | Actions

### Stock Level Bar
- Visual progress bar
- Green: above 60% of min*3
- Yellow: between min and 60%
- Red: at or below minimum

### Add/Edit Item Modal
Fields:
- Item Name (required)
- Unit (select: kg, g, litre, ml, pcs, dozen, box, bag, bottle)
- Current Quantity
- Minimum Stock Level (alert threshold)
- Cost Per Unit ₹
- Supplier (optional)

### Quick Restock
- "+ Stock" button inline on each row
- Opens inline input (not modal): quantity to add
- Confirm → updates stock + creates RestockLog
- Last Restocked date updates

### Delete
- Confirm dialog
- Cannot delete if linked to menu items (show error + list of items)

---

## Feature 10 — Customers Page (`/customers`)

### Search
- Search by name or phone number

### Table
Columns: Customer | Phone | Email | Total Orders | Total Spent | Last Visit

### Customer Detail (future: `/customers/[id]`)
- Full order history for this customer
- All-time stats

---

## Feature 11 — GST Configuration (`/settings/gst`)

### Business Details Card
- Restaurant name
- GST Registration Name (legal name)
- GSTIN (15 character input with format validation)
- GSTIN validation: show state code + PAN preview when valid
- Save button → updates GSTConfig + Tenant

### Menu GST Breakdown Card
- Group menu items by GST slab
- Show count per slab
- Show CGST/SGST split per slab

### GST Rates Reference Card
- 0% — Exempt (unprocessed food)
- 5% — Standard (non-AC restaurants)
- 12% — Packaged / Catering
- 18% — Premium (AC + liquor license)
- 28% — Luxury

---

## Feature 12 — GST Billing Logic

### File: `lib/gst.ts`

```typescript
export interface GSTCalculation {
  base: number       // price × qty
  gstAmount: number  // GST on base
  cgst: number       // gstAmount / 2
  sgst: number       // gstAmount / 2
  total: number      // base + gstAmount
}

export interface OrderTotals {
  subtotal: number       // sum of all base amounts
  totalGST: number       // sum of all GST amounts
  totalCGST: number      // sum of all CGST
  totalSGST: number      // sum of all SGST
  grandTotal: number     // subtotal + totalGST
  gstBreakup: GSTBreakup // grouped by rate
}

export interface GSTBreakup {
  [rate: number]: {
    base: number
    gstAmount: number
    cgst: number
    sgst: number
  }
}

export function calculateItemGST(
  price: number,
  quantity: number,
  gstRate: number
): GSTCalculation {
  const base = round2(price * quantity)
  const gstAmount = round2(base * (gstRate / 100))
  const cgst = round2(gstAmount / 2)
  const sgst = round2(gstAmount / 2)
  return {
    base,
    gstAmount,
    cgst,
    sgst,
    total: round2(base + gstAmount),
  }
}

export function calculateOrderTotals(
  items: Array<{ price: number; quantity: number; gstRate: number }>
): OrderTotals {
  const gstBreakup: GSTBreakup = {}
  let subtotal = 0
  let totalGST = 0
  let totalCGST = 0
  let totalSGST = 0

  for (const item of items) {
    const calc = calculateItemGST(item.price, item.quantity, item.gstRate)
    subtotal += calc.base
    totalGST += calc.gstAmount
    totalCGST += calc.cgst
    totalSGST += calc.sgst

    if (!gstBreakup[item.gstRate]) {
      gstBreakup[item.gstRate] = { base: 0, gstAmount: 0, cgst: 0, sgst: 0 }
    }
    gstBreakup[item.gstRate].base += calc.base
    gstBreakup[item.gstRate].gstAmount += calc.gstAmount
    gstBreakup[item.gstRate].cgst += calc.cgst
    gstBreakup[item.gstRate].sgst += calc.sgst
  }

  return {
    subtotal: round2(subtotal),
    totalGST: round2(totalGST),
    totalCGST: round2(totalCGST),
    totalSGST: round2(totalSGST),
    grandTotal: round2(subtotal + totalGST),
    gstBreakup,
  }
}

function round2(num: number): number {
  return Math.round(num * 100) / 100
}
```

---

## Feature 13 — Print Tax Bill

### Print-ready receipt:
- Restaurant name + GSTIN (if registered)
- Order ID + timestamp
- Customer name + phone
- Order type + table number
- Item list with base prices
- GST breakup per slab (CGST % + SGST %)
- Subtotal + Total GST + Grand Total
- Payment status + method
- "Thank you! Visit again" footer
- Opens in new tab → `window.print()`
- CSS: `@media print` — clean black/white

### Future Phase 2 — PDF via @react-pdf/renderer
- Downloadable PDF file
- Same content as print bill
- Save to device or email to customer

---

## Feature 14 — Reports Page (`/reports`)

### Period filter: Today | This Week | This Month | All Time

### Summary Cards (4)
- Gross Revenue (incl. GST)
- Taxable Revenue (excl. GST)
- GST Collected
- Avg Order Value

### Monthly Revenue Chart
- Last 6 months bar chart
- Built with Recharts or simple CSS bars
- Hover shows: Revenue + GST for that month

### GST by Slab table
- Per GST rate: Base Amount, CGST, SGST, Total GST
- Summary row at bottom

### Top Selling Items
- Top 6 items by quantity sold
- Medal icons for top 3

### Payment Method Breakdown
- Cash / Card / UPI
- Count + Revenue per method

### Inventory Value
- Current total inventory value
- Per item breakdown (top 5)

---

## Feature 15 — Team Management (`/settings/team`)

### Current Team table
- Name, Email, Role badge, Status, Last Login, Actions
- Actions: Change Role, Deactivate, Remove

### Invite Staff
- Email input + Role selector
- Send Invite button
- Shows pending invites list with: email, role, sent date, expiry, Resend/Cancel options

### Roles section
- Visual explanation of what each role can do

---

## Feature 16 — GitHub Actions CI/CD

### `.github/workflows/ci.yml`
Triggers: Pull Requests to `main` and `staging`

Steps:
1. Checkout code
2. Setup Node.js 20
3. Cache node_modules
4. Install dependencies (`npm ci`)
5. Generate Prisma client (`npx prisma generate`)
6. Type check (`npm run type-check`)
7. Lint (`npm run lint`)
8. Build (`npm run build`)

### `.github/workflows/deploy.yml`
Triggers: Push to `main` (production) and `staging`

Steps:
1. All CI steps above
2. Run Prisma migrations (`npx prisma migrate deploy`)
3. Deploy to Vercel (via Vercel GitHub integration — auto)

### Branch Protection Rules (set in GitHub)
- `main` requires: CI passing + 1 review
- `staging` requires: CI passing
- No direct push to `main`
