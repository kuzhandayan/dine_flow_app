import NextAuth, { type NextAuthOptions } from 'next-auth'
import type { Session } from 'next-auth'
import { getServerSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { loginSchema } from '@/lib/validations/auth'
import type { UserRole } from '@prisma/client'
import { DEFAULT_PERMISSIONS } from '@/constants/ROLES'

const FIFTEEN_DAYS = 15 * 24 * 60 * 60
const ONE_DAY = 24 * 60 * 60
const REVALIDATE_INTERVAL_MS = 60 * 60 * 1000 // re-check account/tenant status at most once per hour

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt', maxAge: FIFTEEN_DAYS, updateAge: ONE_DAY },
  pages: { signIn: '/login', error: '/login' },
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
          where: { email: email.toLowerCase(), isActive: true },
          include: {
            tenant: {
              select: { id: true, name: true, slug: true, isActive: true, isSuspended: true, currency: true },
            },
          },
        })

        if (!user) return null

        const passwordMatch = await bcrypt.compare(password, user.password)
        if (!passwordMatch) return null

        // Valid credentials — now check tenant access
        if (user.tenant.isSuspended) throw new Error('ACCOUNT_SUSPENDED')
        if (!user.tenant.isActive) throw new Error('ACCOUNT_INACTIVE')

        // Use stored permissions, fall back to role defaults for staff
        const permissions: string[] =
          user.permissions.length > 0
            ? user.permissions
            : (DEFAULT_PERMISSIONS[user.role] ?? [])

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantName: user.tenant.name,
          tenantSlug: user.tenant.slug,
          currency: user.tenant.currency,
          permissions,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const u = user as unknown as Record<string, unknown>
        token.id = u['id'] as string
        token.role = u['role'] as UserRole
        token.tenantId = u['tenantId'] as string
        token.tenantName = u['tenantName'] as string
        token.tenantSlug = u['tenantSlug'] as string
        token.currency = u['currency'] as string
        token.permissions = u['permissions'] as string[]
        token.lastCheckedAt = Date.now()
        delete token.error
      }

      // Re-verify account/tenant status: on explicit client refresh (route change,
      // tab focus — see SessionSyncProvider) or at most once per hour otherwise.
      // This bounds how long a deactivated user or suspended tenant keeps API access.
      const dueForRevalidation =
        !token.lastCheckedAt || Date.now() - token.lastCheckedAt > REVALIDATE_INTERVAL_MS
      if (!user && token.tenantId && (trigger === 'update' || dueForRevalidation)) {
        const [tenant, freshUser] = await Promise.all([
          prisma.tenant.findUnique({
            where: { id: token.tenantId as string },
            select: { name: true, currency: true, isActive: true, isSuspended: true },
          }),
          prisma.user.findUnique({
            where: { id: token.id as string },
            select: { permissions: true, role: true, isActive: true },
          }),
        ])

        token.lastCheckedAt = Date.now()

        if (!tenant || !tenant.isActive || tenant.isSuspended) {
          token.error = 'TenantSuspended'
        } else if (!freshUser || !freshUser.isActive) {
          token.error = 'AccountDisabled'
        } else {
          delete token.error
          token.tenantName = tenant.name
          token.currency = tenant.currency
          token.role = freshUser.role
          token.permissions =
            freshUser.permissions.length > 0
              ? freshUser.permissions
              : (DEFAULT_PERMISSIONS[freshUser.role] ?? [])
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as UserRole
        session.user.tenantId = token.tenantId as string
        session.user.tenantName = token.tenantName as string
        session.user.tenantSlug = token.tenantSlug as string
        session.user.currency = token.currency as string
        session.user.permissions = (token.permissions as string[]) ?? []
      }
      if (token?.error) {
        session.error = token.error
      }
      return session
    },
  },
}

// v5-compatible shim — server components and API routes call auth() as before
export async function auth(): Promise<Session | null> {
  return getServerSession(authOptions)
}
