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
      currency: string
      permissions: string[]
    } & DefaultSession['user']
    error?: 'AccountDisabled' | 'TenantSuspended'
  }

  interface User {
    role: UserRole
    tenantId: string
    tenantName: string
    tenantSlug: string
    currency: string
    permissions: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
    tenantId: string
    tenantName: string
    tenantSlug: string
    currency: string
    permissions: string[]
    lastCheckedAt?: number
    error?: 'AccountDisabled' | 'TenantSuspended'
  }
}
