import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { UserRole } from '@prisma/client'

export interface AuthSession {
  userId: string
  tenantId: string
  tenantName: string
  role: UserRole
  name: string
  email: string
}

export async function requireAuth(): Promise<AuthSession> {
  const session = await auth()

  if (!session?.user?.tenantId) {
    throw new AuthError('Unauthorized', 401)
  }

  if (session.error) {
    throw new AuthError(session.error, 401)
  }

  return {
    userId: session.user.id,
    tenantId: session.user.tenantId,
    tenantName: session.user.tenantName ?? '',
    role: session.user.role,
    name: session.user.name ?? '',
    email: session.user.email ?? '',
  }
}

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

export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function forbidden(): NextResponse {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
