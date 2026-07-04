# UI.md — Design System

## Design philosophy

DineFlow is dark-first, with a genuinely distinct light mode — not an inverted palette. Brand color is **indigo/violet**, not orange (orange was the original color and was deliberately replaced — see the "why" note below). Dark mode uses an indigo-tinted near-black; light mode uses a warm ivory background rather than stark white/slate. The intent is for both themes to read as the same design system with two different moods, not "dark mode" and "light mode = dark mode inverted."

**Why indigo, not orange:** orange/dark is an extremely common default for dashboard-style SaaS and food-delivery apps specifically — it read as generic rather than deliberate. Indigo/violet was chosen to be distinct while still working as a confident, modern primary color across both themes.

## Color system — `app/globals.css`

Everything is CSS custom properties, consumed via Tailwind arbitrary values like `bg-[rgb(var(--df-accent))]`. **Never hardcode a hex/Tailwind color for brand elements** — always go through a `--df-*` variable so both themes stay in sync automatically. (Categorical colors — role badges, status chips — are the one deliberate exception; see below.)

```css
@import "tailwindcss";
@plugin "tailwindcss-animate";

@layer base {
  :root {
    /* dark theme (default) */
    --df-bg: 13 14 23;          /* indigo-tinted near-black, not flat gray */
    --df-surface: 20 21 36;
    --df-surface-2: 30 31 52;
    --df-card: 24 25 42;
    --df-border: 40 41 66;

    --df-accent: 99 102 241;       /* indigo-500 */
    --df-accent-hover: 129 140 248; /* indigo-400 */
    --df-green: 34 197 94;
    --df-red: 239 68 68;
    --df-blue: 59 130 246;
    --df-yellow: 234 179 8;
    --df-purple: 168 85 247;

    --df-text: 226 232 240;
    --df-text-2: 148 163 184;
    --df-text-3: 71 85 105;

    --radius: 0.5rem;

    /* shadcn/ui-compatible variable set, mirrors the df-* tokens */
    --background: 13 14 23;
    --foreground: 226 232 240;
    --card: 24 25 42;
    --primary: 99 102 241;
    --primary-foreground: 255 255 255;
    --secondary: 30 31 52;
    --muted: 30 31 52;
    --accent: 30 31 52;
    --destructive: 239 68 68;
    --border: 40 41 66;
    --input: 30 31 52;
    --ring: 99 102 241;
    /* ...card-foreground/popover/popover-foreground/secondary-foreground/muted-foreground/accent-foreground/destructive-foreground mirror the pattern */
  }

  .light {
    --df-bg: 250 249 246;       /* warm ivory, not stark white/slate */
    --df-surface: 255 255 255;
    --df-surface-2: 243 242 237;
    --df-card: 255 255 255;
    --df-border: 231 229 221;   /* warm gray-beige, not cool slate */
    --df-text: 23 23 37;
    --df-text-2: 91 88 105;
    --df-text-3: 156 152 168;

    --df-accent: 79 70 229;        /* indigo-600, darker for contrast on light bg */
    --df-accent-hover: 99 102 241; /* indigo-500 */

    /* shadcn vars mirror the light df-* tokens the same way */
  }

  * { box-sizing: border-box; border-color: rgb(var(--df-border)); }
  body {
    background-color: rgb(var(--df-bg));
    color: rgb(var(--df-text));
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    line-height: 1.6;
  }

  /* custom scrollbar, ::-webkit-scrollbar* rules using df-surface/df-border/df-text-3 */
}

/* toast animations, used by ToastProvider */
@keyframes slide-in { from { opacity: 0; transform: translateX(100%) scale(0.95); } to { opacity: 1; transform: translateX(0) scale(1); } }
@keyframes shrink   { from { width: 100%; } to { width: 0%; } }
.animate-slide-in { animation: slide-in 0.25s ease-out forwards; }
.animate-shrink   { animation: shrink 4s linear forwards; }
```

- **No `tailwind.config.ts` exists.** Tailwind v4 is CSS-first — everything is configured directly in `globals.css` (`@import`, `@plugin`) plus `postcss.config.mjs` wiring `@tailwindcss/postcss`.
- Categorical colors (`--df-green/red/blue/yellow/purple`) are deliberately unchanged across the rebrand — used for status/role badges (e.g. `KITCHEN` role chip is orange, `IN_PROGRESS` order status is orange) where a multi-color categorical palette is the point, not a brand statement. Don't "fix" these to indigo — that would remove the visual distinction between categories.

## Theme toggle

- `hooks/useTheme.ts` — `useTheme(): { theme: 'dark'|'light', toggle: () => void, isDark: boolean }`. Persists to `localStorage` key `dineflow-theme`. Applies by adding/removing the `.light` class on `document.documentElement`. Defaults to `'dark'` if nothing saved.
- `components/ui/ThemeToggle.tsx` — the actual toggle UI: a pill-shaped switch with Moon/Sun icons and an animated thumb, styled entirely from `--df-accent`/`--df-surface-2`/`--df-border` tokens (so it re-themes automatically).
- An inline `<script>` in `app/layout.tsx`'s `<head>` reads `localStorage.getItem('dineflow-theme')` and adds `.light` before hydration, avoiding a flash of the wrong theme.

## Toast notifications — one system only

`components/providers/ToastProvider.tsx` is the **only** toast implementation in the codebase. It's a React context provider (`useToast()` hook returning `{ success, error, warning, info }`, each `(title, message?) => void`), mounted once app-wide in `components/providers.tsx`.

```tsx
const toast = useToast()
toast.success('Order placed!', 'ORD-00042')
toast.error('Failed to load menu')
```

- Renders bottom-right, stacks up to 5, auto-dismisses after 4000ms with a shrinking progress bar (`.animate-shrink`).
- Icons from lucide (`CheckCircle2`, `XCircle`, `AlertTriangle`, `Info`); colored via literal Tailwind opacity utility classes (emerald/red/amber/blue), not `--df-*` tokens — this is an intentional exception since toast semantic colors (success/error/warning/info) are a different axis from brand color.
- The context value is memoized (`useMemo`) so `toast` has a stable reference — safe to put in a `useEffect` dependency array without causing re-render loops.

**There used to be a second, parallel toast system** (`hooks/useToast.ts`, a Zustand store, plus a `components/ui/Toaster.tsx` renderer) — it was deleted because its renderer was never mounted anywhere, so every call into it silently did nothing. If you ever see code importing `toast` from `@/hooks/useToast`, that's stale — the only correct import is `useToast` from `@/components/providers/ToastProvider`.

## Layout components

- `components/layout/DashboardShell.tsx` — wraps the tenant dashboard; mounts `SessionSyncProvider` (see `AUTH.md`) plus `Sidebar`/`Topbar`/`MobileNav`.
- `components/layout/Sidebar.tsx` — desktop nav.
- `components/layout/Topbar.tsx` — top bar (user menu, notifications).
- `components/layout/MobileNav.tsx` — mobile navigation (a distinct component, not inline hamburger logic in Sidebar).
- `components/admin/AdminShell.tsx` — separate shell for the `/admin/*` panel, independent of the tenant `DashboardShell`.

Read these components directly for exact spacing/width values before hand-writing new layout code that needs to match — don't trust an inline mockup in a doc to be pixel-accurate.

## Shared UI helpers (`components/shared/`)

- `PageHeader.tsx` — page title + subtitle + action slot, used at the top of every dashboard page.
- `StatCard.tsx` — dashboard stat tiles.
- `EmptyState.tsx` — empty-list placeholder.
- `LoadingSpinner.tsx`
- `ConfirmDialog.tsx` — exposes a `useConfirm()` hook for delete confirmations; several pages (e.g. `settings/tables`) use this instead of the browser's native `confirm()`.
- `UnreadDot.tsx` — small badge dot used for chat/announcement unread indicators.

## Other UI-adjacent hooks

`hooks/useCurrency.ts` (INR formatting, tenant-aware), `hooks/useAnnouncements.ts`, `hooks/useChat.ts` — not just theming. Check these directly before reimplementing currency formatting or unread-count polling elsewhere.
