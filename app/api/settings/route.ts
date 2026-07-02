import { NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireRole(['OWNER', 'MANAGER', 'SUPER_ADMIN'])
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { id: true, name: true, slug: true, address: true, phone: true, email: true, currency: true, timezone: true },
    })
    if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    return NextResponse.json({ tenant })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode })
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

const updateSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().max(300).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  currency: z.string().length(3).optional(),
  timezone: z.string().max(60).optional(),
})

export async function PATCH(req: Request): Promise<NextResponse> {
  try {
    const session = await requireRole(['OWNER', 'SUPER_ADMIN'])
    const body: unknown = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    const { name, address, phone, email, currency, timezone } = parsed.data
    const tenant = await prisma.tenant.update({
      where: { id: session.tenantId },
      data: {
        name,
        address: address ?? null,
        phone: phone ?? null,
        email: email || null,
        ...(currency ? { currency } : {}),
        ...(timezone ? { timezone } : {}),
      },
      select: { id: true, name: true, slug: true, address: true, phone: true, email: true, currency: true, timezone: true },
    })
    return NextResponse.json({ tenant })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode })
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
