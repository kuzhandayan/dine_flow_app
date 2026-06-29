# AUTH.md — Authentication & Authorization

## Overview

- **Framework:** NextAuth.js v5 (Auth.js) — latest beta
- **Strategy:** JWT sessions (no database sessions — faster, stateless)
- **Adapter:** Prisma (for user/account storage only)
- **Password:** bcryptjs (12 rounds)
- **Session contains:** userId, tenantId, role, name, email
- **Route protection:** Next.js middleware (`middleware.ts`)

---

## How It Works

```
User submits login form
        ↓
NextAuth credentials provider
        ↓
Find user in DB by email + tenantId (or by email globally)
        ↓
bcrypt.compare(password, hashedPassword)
        ↓
If valid → create JWT with: userId, tenantId, role, name, email
        ↓
JWT stored in httpOnly cookie
        ↓
Every request → middleware reads JWT → checks role → allows/redirects
        ↓
Every API route → getServerSession() → extracts tenantId → filters data
```

---

## File: `lib/auth.ts`

```typescript
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { loginSchema } from '@/lib/validations/auth'
import type { UserRole } from '@prisma/client'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const user = await prisma.user.findFirst({
          where: {
            email: email.toLowerCase(),
            isActive: true,
          },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
              },
            },
          },
        })

        if (!user || !user.tenant.isActive) return null

        const passwordMatch = await bcrypt.compare(password, user.password)
        if (!passwordMatch) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenant.name,
          tenantSlug: user.tenant.slug,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign in, user object is available
      if (user) {
        token.id = user.id
        token.role = user.role as UserRole
        token.tenantId = user.tenantId as string
        token.tenantName = user.tenantName as string
        token.tenantSlug = user.tenantSlug as string
      }
      return token
    },
    async session({ session, token }) {
      // Attach custom fields to session
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.tenantId = token.tenantId as string
        session.user.tenantName = token.tenantName as string
        session.user.tenantSlug = token.tenantSlug as string
      }
      return session
    },
  },
})
```

---

## File: `types/next-auth.d.ts`

```typescript
import type { UserRole } from '@prisma/client'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      tenantId: string
      tenantName: string
      tenantSlug: string
    } & DefaultSession['user']
  }

  interface User {
    role: UserRole
    tenantId: string
    tenantName: string
    tenantSlug: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    tenantId: string
    tenantName: string
    tenantSlug: string
  }
}
```

---

## File: `app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from '@/lib/auth'

export const { GET, POST } = handlers
```

---

## File: `middleware.ts` (root of project)

```typescript
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { ROLE_PERMISSIONS } from '@/constants/ROLES'

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']
const INVITE_ROUTE = '/invite'
const AUTH_ROUTES = ['/login', '/register']

export default auth(async function middleware(req: NextRequest) {
  const { nextUrl, auth: session } = req as NextRequest & { auth: Awaited<ReturnType<typeof auth>> }
  const pathname = nextUrl.pathname

  // Allow public routes always
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    // If already logged in, redirect away from auth pages
    if (session && AUTH_ROUTES.some(r => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Allow invite routes
  if (pathname.startsWith(INVITE_ROUTE)) {
    return NextResponse.next()
  }

  // All other routes require auth
  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based route protection
  const userRole = session.user.role
  const isAllowed = checkRoutePermission(pathname, userRole)

  if (!isAllowed) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

function checkRoutePermission(pathname: string, role: string): boolean {
  // Settings/team management — owner + manager only
  if (pathname.startsWith('/settings/team') && !['OWNER', 'MANAGER', 'SUPER_ADMIN'].includes(role)) {
    return false
  }
  // Reports — owner + manager only
  if (pathname.startsWith('/reports') && !['OWNER', 'MANAGER', 'SUPER_ADMIN'].includes(role)) {
    return false
  }
  // Menu management — owner + manager only
  if (pathname.startsWith('/menu') && !['OWNER', 'MANAGER', 'SUPER_ADMIN'].includes(role)) {
    return false
  }
  // Inventory — owner + manager only
  if (pathname.startsWith('/inventory') && !['OWNER', 'MANAGER', 'SUPER_ADMIN'].includes(role)) {
    return false
  }
  // GST settings — owner only
  if (pathname.startsWith('/settings/gst') && !['OWNER', 'SUPER_ADMIN'].includes(role)) {
    return false
  }
  return true
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
```

---

## File: `lib/middleware-helpers.ts`

```typescript
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { UserRole } from '@prisma/client'

export interface AuthSession {
  userId: string
  tenantId: string
  role: UserRole
  name: string
  email: string
}

// Use in every API route
export async function requireAuth(): Promise<AuthSession> {
  const session = await auth()

  if (!session?.user?.tenantId) {
    throw new AuthError('Unauthorized', 401)
  }

  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    role: session.user.role,
    name: session.user.name ?? '',
    email: session.user.email ?? '',
  }
}

// Use for role-restricted API routes
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthSession> {
  const session = await requireAuth()

  if (!allowedRoles.includes(session.role)) {
    throw new AuthError('Forbidden', 403)
  }

  return session
}

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

// Standard API error response
export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function forbidden(): NextResponse {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

---

## File: `constants/ROLES.ts`

```typescript
import type { UserRole } from '@prisma/client'

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  WAITER: 'WAITER',
  KITCHEN: 'KITCHEN',
} as const

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'Owner',
  MANAGER: 'Manager',
  WAITER: 'Waiter',
  KITCHEN: 'Kitchen Staff',
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['*'],
  OWNER: [
    'dashboard', 'orders', 'new-order', 'check-order',
    'menu', 'inventory', 'customers',
    'reports', 'settings', 'settings/gst', 'settings/team',
  ],
  MANAGER: [
    'dashboard', 'orders', 'new-order', 'check-order',
    'menu', 'inventory', 'customers', 'reports', 'settings/team',
  ],
  WAITER: [
    'dashboard', 'orders', 'new-order', 'check-order', 'customers',
  ],
  KITCHEN: [
    'dashboard', 'orders', 'check-order',
  ],
}

// Staff roles that can be invited (owners cannot be invited, they register)
export const INVITABLE_ROLES: UserRole[] = ['MANAGER', 'WAITER', 'KITCHEN']
```

---

## Registration Flow

### File: `app/(auth)/register/page.tsx` logic

```typescript
// When a new restaurant registers:
// 1. Validate input (Zod)
// 2. Check email not already used in this "new tenant" context
// 3. Create Tenant + Owner User in a single Prisma transaction
// 4. Create default GSTConfig for tenant
// 5. Auto-login after registration

async function registerRestaurant(data: RegisterInput): Promise<void> {
  const { restaurantName, ownerName, email, password } = data

  // Generate unique slug from restaurant name
  const slug = generateSlug(restaurantName)

  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: restaurantName,
        slug: await ensureUniqueSlug(slug, tx),
      },
    })

    const hashedPassword = await bcrypt.hash(password, 12)

    await tx.user.create({
      data: {
        tenantId: tenant.id,
        name: ownerName,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'OWNER',
      },
    })

    await tx.gSTConfig.create({
      data: {
        tenantId: tenant.id,
        defaultGSTRate: 5,
        isGSTRegistered: false,
      },
    })
  })
}
```

---

## Invite Flow

### Creating an Invite

```typescript
// POST /api/invite
// Role: OWNER or MANAGER only

async function createInvite(tenantId: string, email: string, role: UserRole) {
  // Check user doesn't already exist in this tenant
  const existing = await prisma.user.findFirst({
    where: { tenantId, email: email.toLowerCase() }
  })
  if (existing) throw new Error('User already exists')

  // Create invite with 48-hour expiry
  const invite = await prisma.invite.create({
    data: {
      tenantId,
      email: email.toLowerCase(),
      role,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  })

  // Send email via Resend
  await sendInviteEmail(email, invite.token, tenantName)
}
```

### Accepting an Invite

```typescript
// POST /api/invite/[token]

async function acceptInvite(token: string, name: string, password: string) {
  const invite = await prisma.invite.findUnique({ where: { token } })

  if (!invite) throw new Error('Invalid invite')
  if (invite.usedAt) throw new Error('Invite already used')
  if (invite.expiresAt < new Date()) throw new Error('Invite expired')

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.$transaction(async (tx) => {
    await tx.user.create({
      data: {
        tenantId: invite.tenantId,
        name,
        email: invite.email,
        password: hashedPassword,
        role: invite.role,
      },
    })

    await tx.invite.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    })
  })
}
```

---

## Email: `lib/email.ts`

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInviteEmail(
  to: string,
  token: string,
  restaurantName: string
): Promise<void> {
  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: `You're invited to join ${restaurantName} on DineFlow`,
    html: `
      <h2>You've been invited!</h2>
      <p>You have been invited to join <strong>${restaurantName}</strong> on DineFlow POS.</p>
      <p>Click the link below to set up your account. This link expires in 48 hours.</p>
      <a href="${inviteUrl}" style="background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Accept Invite</a>
      <p>If you did not expect this email, please ignore it.</p>
    `,
  })
}

export async function sendPasswordResetEmail(
  to: string,
  token: string
): Promise<void> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`

  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: 'Reset your DineFlow password',
    html: `
      <h2>Password Reset Request</h2>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  })
}
```

---

## Password Hashing Utility

```typescript
// lib/password.ts
import bcrypt from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
```

---

## Validation Schemas

```typescript
// lib/validations/auth.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  restaurantName: z.string().min(2, 'Restaurant name too short').max(100),
  ownerName: z.string().min(2, 'Name too short').max(100),
  email: z.string().email('Invalid email').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const inviteAcceptSchema = z.object({
  name: z.string().min(2).max(100),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email().toLowerCase(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type InviteAcceptInput = z.infer<typeof inviteAcceptSchema>
```

---

## API Route Pattern — Always Use This

```typescript
// Every single API route follows this exact pattern
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole, AuthError } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    // For role-restricted: const session = await requireRole(['OWNER', 'MANAGER'])

    const data = await prisma.order.findMany({
      where: { tenantId: session.tenantId }, // ALWAYS filter by tenantId
    })

    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }
    console.error('[GET /api/orders]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

---

## Session in Server Components

```typescript
// app/(dashboard)/orders/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function OrdersPage() {
  const session = await auth()

  if (!session) redirect('/login')

  // session.user.tenantId is available here
  const orders = await prisma.order.findMany({
    where: { tenantId: session.user.tenantId },
  })

  return <OrdersClient orders={orders} />
}
```

## Session in Client Components

```typescript
'use client'
import { useSession } from 'next-auth/react'

export function OrderActions() {
  const { data: session } = useSession()

  if (!session) return null

  // session.user.role is available
  const canManage = ['OWNER', 'MANAGER'].includes(session.user.role)

  return (
    <div>
      {canManage && <button>Edit Menu</button>}
    </div>
  )
}
```
