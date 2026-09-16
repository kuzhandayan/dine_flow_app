import { NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireRole(['OWNER'])
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { isOnline: true },
    })
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    return NextResponse.json({ isOnline: tenant.isOnline })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode })
    return NextResponse.json({ error: 'Failed to load status' }, { status: 500 })
  }
}

const updateSchema = z.object({
  isOnline: z.boolean(),
})

export async function PATCH(req: Request): Promise<NextResponse> {
  try {
    const session = await requireRole(['OWNER'])
    const body: unknown = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    const tenant = await prisma.tenant.update({
      where: { id: session.tenantId },
      data: { isOnline: parsed.data.isOnline, updatedById: session.userId },
      select: { isOnline: true },
    })
    return NextResponse.json({ isOnline: tenant.isOnline })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode })
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
