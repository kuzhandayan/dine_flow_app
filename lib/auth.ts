import NextAuth, { type NextAuthOptions } from 'next-auth'
import type { Session } from 'next-auth'
import { getServerSession } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { loginSchema } from '@/lib/validations/auth'
import type { UserRole } from '@prisma/client'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
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
              select: { id: true, name: true, slug: true, isActive: true, isSuspended: true },
            },
          },
        })

        if (!user || !user.tenant.isActive || user.tenant.isSuspended) return null

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
      if (user) {
        const u = user as unknown as Record<string, unknown>
        token.id = u['id'] as string
        token.role = u['role'] as UserRole
        token.tenantId = u['tenantId'] as string
        token.tenantName = u['tenantName'] as string
        token.tenantSlug = u['tenantSlug'] as string
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
      }
      return session
    },
  },
}

// v5-compatible shim — server components and API routes call auth() as before
export async function auth(): Promise<Session | null> {
  return getServerSession(authOptions)
}
