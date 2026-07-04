import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, AuthError } from '@/lib/middleware-helpers'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import type { UserRole } from '@prisma/client'

const updateSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).max(64).optional(),
  role: z.enum(['WAITER', 'KITCHEN', 'CASHIER', 'MANAGER']).optional(),
  permissions: z.array(z.string()).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const session = await requireRole(['OWNER', 'MANAGER', 'SUPER_ADMIN'])
    const { id } = await params

    const target = await prisma.user.findFirst({
      where: { id, tenantId: session.tenantId },
    })
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Cannot modify OWNER
    if (target.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot modify the owner account' }, { status: 403 })
    }

    // MANAGER cannot modify another MANAGER
    if (session.role === 'MANAGER' && target.role === 'MANAGER') {
      return NextResponse.json({ error: 'Managers cannot modify other managers' }, { status: 403 })
    }

    const body: unknown = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 })
    }

    const { name, isActive, password, role, permissions } = parsed.data
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData['name'] = name
    if (isActive !== undefined) updateData['isActive'] = isActive
    if (role !== undefined) updateData['role'] = role as UserRole
    if (password !== undefined) updateData['password'] = await bcrypt.hash(password, 12)
    if (permissions !== undefined) updateData['permissions'] = permissions
    updateData['updatedById'] = session.userId

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, permissions: true, isActive: true, createdAt: true },
    })

    return NextResponse.json({ user: updated })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode })
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const session = await requireRole(['OWNER', 'SUPER_ADMIN'])
    const { id } = await params

    const target = await prisma.user.findFirst({
      where: { id, tenantId: session.tenantId },
    })
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (target.role === 'OWNER') return NextResponse.json({ error: 'Cannot delete the owner account' }, { status: 403 })

    await prisma.user.update({ where: { id }, data: { isActive: false, updatedById: session.userId } })
    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode })
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
