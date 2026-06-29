import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, AuthError } from '@/lib/middleware-helpers'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import type { UserRole } from '@prisma/client'

const MANAGEABLE_ROLES: UserRole[] = ['WAITER', 'KITCHEN', 'CASHIER', 'MANAGER']

const createUserSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(6).max(64),
  role: z.enum(['WAITER', 'KITCHEN', 'CASHIER', 'MANAGER']),
})

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireRole(['OWNER', 'MANAGER', 'SUPER_ADMIN'])

    const users = await prisma.user.findMany({
      where: {
        tenantId: session.tenantId,
        role: { in: MANAGEABLE_ROLES },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode })
    return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole(['OWNER', 'MANAGER', 'SUPER_ADMIN'])

    const body: unknown = await req.json()
    const parsed = createUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }

    const { name, email, password, role } = parsed.data

    // MANAGER can only create WAITER, KITCHEN, CASHIER — not another MANAGER
    if (session.role === 'MANAGER' && role === 'MANAGER') {
      return NextResponse.json({ error: 'Managers cannot create other managers' }, { status: 403 })
    }

    const existing = await prisma.user.findFirst({
      where: { tenantId: session.tenantId, email: email.toLowerCase() },
    })
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        tenantId: session.tenantId,
        name,
        email: email.toLowerCase(),
        password: hashed,
        role: role as UserRole,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode })
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
