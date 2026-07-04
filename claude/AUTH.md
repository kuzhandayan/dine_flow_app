# AUTH.md — Authentication & Session Handling

## Version reality check

`package.json` lists `"next-auth": "beta"`, but that currently **resolves to `next-auth@4.24.14`** — a stable v4 release, not the v5 beta the stack was originally planned around. `lib/auth.ts` is written against the **v4 API surface**: `NextAuth(authOptions)` handler, `getServerSession(authOptions)`, `NextAuthOptions` type. To keep the rest of the codebase (API routes, server components) calling `await auth()` the same way v5 would, `lib/auth.ts` exports a thin shim:

```ts
export async function auth(): Promise<Session | null> {
  return getServerSession(authOptions)
}
```

Everywhere else in the app calls `auth()`, not `getServerSession()` directly — if next-auth is ever actually upgraded to v5, this shim is the only place that needs to change.

`app/api/auth/[...nextauth]/route.ts` uses the classic v4 route handler pattern:
```ts
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

`@auth/prisma-adapter` is installed but **not used** — the Credentials + JWT strategy doesn't need a database session adapter.

## Session config

```ts
const FIFTEEN_DAYS = 15 * 24 * 60 * 60
const ONE_DAY = 24 * 60 * 60
const REVALIDATE_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

session: { strategy: 'jwt', maxAge: FIFTEEN_DAYS, updateAge: ONE_DAY }
secret: process.env.NEXTAUTH_SECRET   // explicit, not left to next-auth's implicit env pickup
pages: { signIn: '/login', error: '/login' }
```

- **Session lifetime: 15 days, sliding.** As long as the user is active at least once every 15 days, they stay logged in. `updateAge: 1 day` means the underlying JWT `iat`/`exp` gets re-signed roughly once a day during activity, extending the 15-day window forward each time.
- **JWT is stored in an httpOnly cookie**, contains `id, role, tenantId, tenantName, tenantSlug, currency, permissions, lastCheckedAt, error?`.
- Rotate all active sessions instantly by rotating `NEXTAUTH_SECRET`.

## Credentials provider (`authorize()`)

1. Looks up the user by `email` (lowercased) with `isActive: true`, joined with `tenant { id, name, slug, isActive, isSuspended, currency }`.
2. No match → returns `null` (client sees a generic "invalid email or password").
3. `bcrypt.compare` against the stored hash (12 rounds) → mismatch → `null`.
4. **Tenant gate, before returning success** — these `throw`, not return `null`, so the client can distinguish them:
   - `user.tenant.isSuspended` → `throw new Error('ACCOUNT_SUSPENDED')`
   - `!user.tenant.isActive` → `throw new Error('ACCOUNT_INACTIVE')`
5. Resolves effective `permissions`: the user's own `permissions[]` if non-empty, else `DEFAULT_PERMISSIONS[role]` from `constants/ROLES.ts`.
6. Returns `{id, email, name, role, tenantId, tenantName, tenantSlug, currency, permissions}`.

`app/(auth)/login/LoginClient.tsx` calls `signIn('credentials', {..., redirect: false})` and branches on `result.error`:
- `'ACCOUNT_SUSPENDED'` → amber inline banner: "Your restaurant account has been suspended. Please contact the platform admin."
- `'ACCOUNT_INACTIVE'` → amber inline banner: "Your restaurant account has been deactivated..."
- anything else → red inline banner: "Invalid email or password"

This is the **login-attempt-time** error path — distinct from the mid-session forced-logout path below.

## JWT callback — the revalidation lifecycle

This is the core mechanism that keeps a JWT session honest against DB state without hitting the database on every single request.

```
on sign-in (user present):
  copy id/role/tenantId/tenantName/tenantSlug/currency/permissions onto the token
  token.lastCheckedAt = Date.now()
  clear token.error

on every other invocation (user absent, i.e. an existing session being read):
  dueForRevalidation = !token.lastCheckedAt || (now - token.lastCheckedAt > 1 hour)
  if trigger === 'update' (explicit client refresh) OR dueForRevalidation:
    fetch tenant {name, currency, isActive, isSuspended} and user {permissions, role, isActive} from DB
    token.lastCheckedAt = now
    if tenant missing/inactive/suspended:
        token.error = 'TenantSuspended'
    elif user missing/inactive:
        token.error = 'AccountDisabled'
    else:
        clear token.error
        refresh token.tenantName / currency / role / permissions from the fresh DB row
```

Net effect: a deactivated staff account or a suspended tenant loses effective access **within at most 1 hour automatically**, or **immediately** the next time the client calls `update()` (see below) — without querying the DB on every single page load in between.

The `session()` callback mirrors token fields onto `session.user`, and additionally sets `session.error = token.error` when present — this is the only field consumed outside `lib/auth.ts` to detect a revoked session.

## Client-side forced sign-out (`components/providers/SessionSyncProvider.tsx`)

Mounted once, wrapping the authenticated app shell. Uses `useSession()`:

- **Route change** (`usePathname()` changes) → calls `update()`, forcing an immediate JWT revalidation pass instead of waiting up to an hour.
- **Tab becomes visible again** (`visibilitychange` listener) → same `update()` call.
- **`status === 'unauthenticated'`** → `signOut({ callbackUrl: '/login?reason=SessionExpired' })`.
- **`session.error` becomes truthy** (`'AccountDisabled'` or `'TenantSuspended'`) → `signOut({ callbackUrl: '/login?reason=' + session.error })`.

`app/(auth)/login/LoginClient.tsx` reads `?reason=` once on mount and shows a toast via `useToast()` (see `UI.md`):

| `reason` | Toast |
|---|---|
| `SessionExpired` | "Session expired — please sign in again." |
| `AccountDisabled` | "Account deactivated — contact your restaurant owner." |
| `TenantSuspended` | "Restaurant account suspended — contact the platform admin." |

## Server-side enforcement (`lib/middleware-helpers.ts`)

Every API route calls one of these — never `auth()` directly:

```ts
export async function requireAuth(): Promise<AuthSession> {
  const session = await auth()
  if (!session?.user?.tenantId) throw new AuthError('Unauthorized', 401)
  if (session.error) throw new AuthError(session.error, 401)   // honors the revocation flag
  return { userId, tenantId, tenantName, role, name, email }
}

export async function requireRole(allowedRoles: UserRole[]): Promise<AuthSession> {
  const session = await requireAuth()
  if (!allowedRoles.includes(session.role)) throw new AuthError('Forbidden', 403)
  return session
}
```

`session.tenantId` is guaranteed present and safe to use in every `where: { tenantId }` clause after `requireAuth()`/`requireRole()` succeeds. `AuthSession` also carries `tenantName` (used for chat/announcement sender names) alongside `userId`, `role`, `name`, `email`.

Because `requireAuth()` checks `session.error`, an API caller whose account was just deactivated is locked out of every route the moment their token carries the error flag — which happens on the next `update()` trigger or within an hour, whichever comes first — even before the client-side forced sign-out kicks in.

## Route-level protection (`proxy.ts`)

Next.js 16 renamed `middleware.ts` to `proxy.ts` (same mechanism). Uses `getToken` from `next-auth/jwt` directly:
- `/admin*` paths require `role === 'SUPER_ADMIN'`, else redirect to `/admin/login`.
- `/admin/login` itself redirects to `/admin/dashboard` if already a `SUPER_ADMIN`.

## Registration (`app/api/auth/register`)

Public `POST`. Validates with `registerSchema`, rejects if the email already exists for *any* tenant, generates a unique slug from the restaurant name, then in one `$transaction`:
1. Creates `Tenant`
2. Creates `User` (role `OWNER`, `hashPassword()` from `lib/password.ts`) — no `createdById` set, since no authenticated actor exists yet
3. Creates `GSTConfig` (default 5%, not GST-registered)
4. Creates `Subscription` (`LIFETIME`/`ACTIVE`)
5. Calls `seedTenantDefaults(tx, tenantId)` (`lib/tenant-defaults.ts`) — seeds 2 categories, 2 menu items, 2 inventory items, 2 tables so a new restaurant isn't a blank slate

## Roles & permissions (`constants/ROLES.ts`)

`UserRole` enum: `SUPER_ADMIN, OWNER, MANAGER, WAITER, KITCHEN, CASHIER`.

- `ROLE_PERMISSIONS` — static, coarse default page-list per role (used for reference/UI, not the actual gate).
- `INVITABLE_ROLES = ['MANAGER', 'WAITER', 'KITCHEN', 'CASHIER']` — roles an owner/manager can create via `POST /api/team` (OWNER/SUPER_ADMIN are never created this way).
- `CUSTOMIZABLE_ROLES = ['WAITER', 'KITCHEN', 'CASHIER']` — the only roles whose per-user `permissions[]` an owner/manager can hand-edit.
- `DEFAULT_PERMISSIONS: Partial<Record<UserRole, string[]>>` — fallback module list used both in `authorize()` and when a staff account is created without explicit `permissions`.
- `ASSIGNABLE_MODULES: ModuleDef[]` — the fine-grained module catalogue for the permission-editor UI, grouped into `Operations` (dashboard, new-order, orders, kitchen, check-order), `Management` (menu, inventory, customers), `Insights` (reports), `Updates` (announcements, chat).

This is a real two-layer RBAC: a coarse role, plus a per-user `permissions: String[]` override stored directly on `User` — not just a static role→pages map.

## Email — not a current feature at all (deliberately deferred)

`lib/email.ts` (`sendInviteEmail`, `sendPasswordResetEmail`, built on Resend) exists but is **never imported or called anywhere in the app**. Confirmed dead code, not a hidden dependency. `RESEND_API_KEY`/`RESEND_FROM_EMAIL` being unset in any environment is a non-issue today because of this — don't treat it as a build blocker or a gap to urgently fix.

- **No staff-invite-by-email flow.** `Invite` model exists in the schema, but `app/api/invite/**` doesn't exist. Staff onboarding is `POST /api/team` with an owner/manager typing a password directly.
- **`/forgot-password` is broken, not just unimplemented.** The page (`app/(auth)/forgot-password/page.tsx`) submits to `POST /api/auth/forgot-password`, which doesn't exist (404). The client code doesn't check the response status — it unconditionally shows "Check your email" after any submit, so a user is told a reset email was sent when nothing happened. If/when email is built as a real feature, either wire up that route for real or remove the page until it's ready — don't leave it silently lying to users in the meantime.
