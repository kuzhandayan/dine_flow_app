# UI.md — Design System

## Design Philosophy

DineFlow is a **dark-first, warm-toned POS system** built for restaurant staff who work in low-light environments.
The design must feel premium, not generic. Every component follows this system strictly.

---

## Color Tokens

### globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* DineFlow Dark Theme (default) */
    --df-bg: 15 17 23;           /* #0f1117 — page background */
    --df-surface: 26 29 46;      /* #1a1d2e — sidebar, topbar */
    --df-surface-2: 37 40 64;    /* #252840 — hover states, inputs */
    --df-card: 30 34 53;         /* #1e2235 — cards */
    --df-border: 45 49 73;       /* #2d3149 — borders */

    --df-accent: 249 115 22;     /* #f97316 — orange, primary CTA */
    --df-accent-hover: 251 146 60; /* #fb923c */
    --df-green: 34 197 94;       /* #22c55e — success, paid */
    --df-red: 239 68 68;         /* #ef4444 — danger, error, unpaid */
    --df-blue: 59 130 246;       /* #3b82f6 — info, GST amounts */
    --df-yellow: 234 179 8;      /* #eab308 — warning, pending */
    --df-purple: 168 85 247;     /* #a855f7 — highlight */

    --df-text: 226 232 240;      /* #e2e8f0 — primary text */
    --df-text-2: 148 163 184;    /* #94a3b8 — secondary/muted text */
    --df-text-3: 71 85 105;      /* #475569 — placeholder text */

    --radius: 0.5rem;
  }

  /* Light theme override (toggled via .light class on html) */
  .light {
    --df-bg: 248 250 252;
    --df-surface: 255 255 255;
    --df-surface-2: 241 245 249;
    --df-card: 255 255 255;
    --df-border: 226 232 240;
    --df-text: 15 23 42;
    --df-text-2: 71 85 105;
    --df-text-3: 148 163 184;
  }

  * {
    box-sizing: border-box;
  }

  body {
    background-color: rgb(var(--df-bg));
    color: rgb(var(--df-text));
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
}
```

---

## Typography Scale

```
Display:    28px / weight 800 / tracking -0.5px   (logo, page hero)
Heading 1:  22px / weight 700 / tracking -0.3px   (modal titles, section headers)
Heading 2:  18px / weight 600                     (card titles)
Heading 3:  15px / weight 600                     (subsection titles)
Body:       14px / weight 400                     (default)
Small:      13px / weight 400                     (table content, descriptions)
Caption:    12px / weight 400                     (labels, metadata)
Tiny:       11px / weight 500                     (badges, tags)
Micro:      10px / weight 600 / tracking 0.5px    (section group labels in nav)
```

---

## Spacing System

Use Tailwind spacing. Key values:
```
2   = 8px
3   = 12px
4   = 16px
5   = 20px
6   = 24px
8   = 32px
```

Component internal padding: `p-4` (16px) for cards, `p-3` (12px) for compact
Gap between elements: `gap-3` (12px) default, `gap-2` (8px) for tight groups

---

## Component Specifications

### Sidebar
```tsx
<aside className="w-[216px] bg-[rgb(var(--df-surface))] border-r border-[rgb(var(--df-border))] flex flex-col h-screen fixed left-0 top-0">
  {/* Logo area */}
  <div className="px-4 py-[18px] border-b border-[rgb(var(--df-border))]">
    <h1 className="text-[17px] font-extrabold text-[rgb(var(--df-accent))] tracking-tight">
      🍽 DineFlow
    </h1>
    <p className="text-[11px] text-[rgb(var(--df-text-2))] mt-0.5">
      {tenantName}
    </p>
  </div>

  {/* Nav groups */}
  <nav className="flex-1 overflow-y-auto px-2 py-3">
    {/* Group label */}
    <p className="text-[10px] font-semibold text-[rgb(var(--df-text-2))] tracking-[0.8px] uppercase px-3 pt-2 pb-1">
      Operations
    </p>

    {/* Nav item */}
    <button className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-[13px] text-[rgb(var(--df-text-2))] hover:bg-[rgb(var(--df-surface-2))] hover:text-[rgb(var(--df-text))] transition-colors">
      {/* Active state */}
      {/* className="bg-[rgba(249,115,22,0.15)] text-[rgb(var(--df-accent))] font-medium" */}
    </button>
  </nav>
</aside>
```

### Topbar
```tsx
<header className="h-14 bg-[rgb(var(--df-surface))] border-b border-[rgb(var(--df-border))] flex items-center justify-between px-6 sticky top-0 z-10">
  <h2 className="text-[15px] font-semibold">{pageTitle}</h2>
  <div className="flex items-center gap-2">
    {/* date, alerts, new order button, user menu */}
  </div>
</header>
```

### Stat Card
```tsx
<div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-xl p-4">
  <p className="text-[11px] text-[rgb(var(--df-text-2))]">{label}</p>
  <p className="text-[26px] font-bold mt-1 mb-0.5" style={{ color }}>{value}</p>
  <p className="text-[11px] text-[rgb(var(--df-text-2))]">{subtitle}</p>
</div>
```

### Button Variants
```tsx
// Primary — orange CTA
<button className="px-4 py-2 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">

// Secondary — ghost
<button className="px-4 py-2 bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] hover:border-[rgb(var(--df-accent))] hover:text-[rgb(var(--df-accent))] text-[rgb(var(--df-text))] rounded-lg text-[13px] font-medium transition-colors">

// Danger
<button className="px-4 py-2 bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.25)] hover:bg-[rgba(239,68,68,0.2)] text-[#f87171] rounded-lg text-[13px] font-medium transition-colors">

// Success
<button className="px-4 py-2 bg-[rgba(34,197,94,0.12)] border border-[rgba(34,197,94,0.25)] hover:bg-[rgba(34,197,94,0.2)] text-[#4ade80] rounded-lg text-[13px] font-medium transition-colors">

// Sizes: default | sm (text-[12px] px-3 py-1.5) | xs (text-[11px] px-2 py-1)
```

### Input / Select
```tsx
<input className="w-full bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] focus:border-[rgb(var(--df-accent))] focus:outline-none rounded-lg px-3 py-2 text-[13px] text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))] transition-colors" />
```

### Card
```tsx
<div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-xl p-5">
```

### Table
```tsx
<div className="overflow-x-auto">
  <table className="w-full text-[12px]">
    <thead>
      <tr>
        <th className="text-left px-3 py-2.5 text-[11px] font-medium text-[rgb(var(--df-text-2))] border-b border-[rgb(var(--df-border))] whitespace-nowrap">
      </tr>
    </thead>
    <tbody>
      <tr className="hover:bg-[rgba(255,255,255,0.015)] transition-colors">
        <td className="px-3 py-2.5 border-b border-[rgba(45,49,73,0.4)]">
      </tr>
    </tbody>
  </table>
</div>
```

### Status Badges
```tsx
// Pending
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[rgba(234,179,8,0.15)] text-yellow-400">
  ⏳ Pending
</span>

// In Progress
<span className="... bg-[rgba(59,130,246,0.15)] text-blue-400">
  👨‍🍳 Cooking
</span>

// Ready
<span className="... bg-[rgba(168,85,247,0.15)] text-purple-400">
  ✅ Ready
</span>

// Served/Delivered
<span className="... bg-[rgba(34,197,94,0.15)] text-green-400">
  🍽 Served
</span>

// Completed
<span className="... bg-[rgba(34,197,94,0.2)] text-green-400">
  ✔ Done
</span>

// Paid
<span className="... bg-[rgba(34,197,94,0.2)] text-green-400">
  ✓ Paid
</span>

// Unpaid
<span className="... bg-[rgba(239,68,68,0.15)] text-red-400">
  ✗ Unpaid
</span>
```

### GST Rate Badge
```tsx
// Color-code by rate
const gstColors = {
  0:  'bg-[rgba(148,163,184,0.1)] text-slate-400',
  5:  'bg-[rgba(34,197,94,0.1)] text-green-400',
  12: 'bg-[rgba(59,130,246,0.1)] text-blue-400',
  18: 'bg-[rgba(168,85,247,0.1)] text-purple-400',
  28: 'bg-[rgba(239,68,68,0.1)] text-red-400',
}

<span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${gstColors[rate]}`}>
  GST {rate}%
</span>
```

### Modal
```tsx
// Use Radix Dialog via shadcn/ui
<Dialog>
  <DialogContent className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl max-w-lg">
    <DialogHeader>
      <DialogTitle className="text-[15px] font-semibold">Title</DialogTitle>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>
```

### Toast Notifications
```tsx
// Use shadcn/ui Toast
// Success: green background
// Error: red background
// Warning: yellow background
// Duration: 3000ms
```

### Loading States
```tsx
// Skeleton for table rows
<div className="animate-pulse">
  <div className="h-4 bg-[rgb(var(--df-surface-2))] rounded mb-2 w-3/4" />
</div>

// Spinner for buttons
<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
```

### Empty State
```tsx
<div className="text-center py-12 px-6">
  <div className="text-4xl mb-3">{icon}</div>
  <p className="text-[14px] font-medium text-[rgb(var(--df-text))]">{title}</p>
  <p className="text-[12px] text-[rgb(var(--df-text-2))] mt-1">{subtitle}</p>
  {action && <button className="mt-4 btn-primary">{action}</button>}
</div>
```

### Stock Level Bar
```tsx
<div className="h-1.5 bg-[rgb(var(--df-surface-2))] rounded-full overflow-hidden w-20">
  <div
    className="h-full rounded-full transition-all duration-300"
    style={{
      width: `${pct}%`,
      backgroundColor: isLow ? '#ef4444' : pct < 60 ? '#eab308' : '#22c55e'
    }}
  />
</div>
```

### Bill Preview (in New Order)
```tsx
<div className="bg-[rgb(var(--df-surface))] border border-[rgb(var(--df-border))] rounded-xl p-4">
  {/* Item lines */}
  <div className="flex justify-between py-1.5 border-b border-[rgba(45,49,73,0.4)] text-[12px]">
    <span>Butter Chicken ×2</span>
    <span>₹560</span>
  </div>
  {/* GST line per item */}
  <div className="flex justify-between py-1 text-[11px] text-[rgb(var(--df-text-2))]">
    <span className="pl-3">GST 5% (CGST 2.5%+SGST 2.5%)</span>
    <span>+₹28.00</span>
  </div>

  {/* Dashed divider */}
  <hr className="border-dashed border-[rgb(var(--df-border))] my-2.5" />

  {/* Totals */}
  <div className="flex justify-between text-[11px] text-[rgb(var(--df-text-2))] py-1">
    <span>Subtotal</span>
    <span>₹560.00</span>
  </div>
  <div className="flex justify-between text-[11px] text-blue-400 py-1">
    <span>Total GST</span>
    <span>₹28.00</span>
  </div>
  <div className="flex justify-between text-[15px] font-bold text-[rgb(var(--df-accent))] pt-2">
    <span>Grand Total</span>
    <span>₹588.00</span>
  </div>
</div>
```

---

## Layout Grid

```tsx
// Dashboard stats — 4 columns
<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">

// Two column — main content + sidebar
<div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">

// Three columns — reports
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
```

---

## Page Layout Wrapper

```tsx
// app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[rgb(var(--df-bg))]">
      <Sidebar />
      <div className="flex-1 flex flex--col ml-[216px]">
        <Topbar />
        <main className="flex-1 p-5 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## Page Header Component

```tsx
interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-[18px] font-semibold">{title}</h1>
        {subtitle && (
          <p className="text-[12px] text-[rgb(var(--df-text-2))] mt-0.5">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
```

---

## Tabs Component

```tsx
// Use shadcn/ui Tabs with custom styling
<Tabs defaultValue="all">
  <TabsList className="bg-[rgb(var(--df-surface-2))] p-1 rounded-xl mb-4">
    <TabsTrigger
      value="all"
      className="text-[12px] data-[state=active]:bg-[rgb(var(--df-card))] data-[state=active]:text-[rgb(var(--df-text))] data-[state=active]:font-medium rounded-lg"
    >
      All (24)
    </TabsTrigger>
  </TabsList>
</Tabs>
```

---

## Currency Formatting

```typescript
// lib/currency.ts
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  // Output: ₹1,23,456.78
}

export function formatINRCompact(amount: number): string {
  if (amount >= 100000) return '₹' + (amount / 100000).toFixed(1) + 'L'
  if (amount >= 1000) return '₹' + (amount / 1000).toFixed(1) + 'K'
  return '₹' + amount.toFixed(0)
}
```

---

## Print Bill Styles

```css
/* In the print bill component */
@media print {
  body { background: white; color: black; font-family: monospace; }
  .no-print { display: none; }
  .print-bill { max-width: 300px; margin: 0 auto; }
}
```

---

## Responsive Breakpoints

- Mobile: < 768px — sidebar collapses to bottom nav or hamburger drawer
- Tablet: 768px–1024px — sidebar visible, some grid columns reduce
- Desktop: > 1024px — full layout

---

## Dark/Light Mode Toggle

Store preference in `localStorage` key `dineflow-theme`.
Toggle via `html` element class: `.light` for light mode, default is dark.

```typescript
// hooks/useTheme.ts
export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('dineflow-theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('dineflow-theme', next)
    document.documentElement.classList.toggle('light', next === 'light')
  }

  return { theme, toggle }
}
```

---

## Icon System

Use **Lucide React** exclusively. No emoji in production UI components (only in seed data and examples).

```tsx
import { ShoppingCart, ChefHat, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'

// Sizing
<ShoppingCart className="w-4 h-4" />   // inline / nav
<ShoppingCart className="w-5 h-5" />   // buttons
<ShoppingCart className="w-6 h-6" />   // stat cards
```
