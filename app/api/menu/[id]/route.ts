import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { UserRole } from '@prisma/client'

const updateMenuItemSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().positive().optional(),
  gstRate: z.number().min(0).max(100).optional(),
  isVeg: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  categoryId: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireRole(['OWNER', 'MANAGER'] as UserRole[])
    const { id } = await params
    const body: unknown = await req.json()
    const parsed = updateMenuItemSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    const menuItem = await prisma.menuItem.update({
      where: { id, tenantId: session.tenantId },
      data: parsed.data,
    })

    return NextResponse.json({ menuItem })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireRole(['OWNER', 'MANAGER'] as UserRole[])
    const { id } = await params

    await prisma.menuItem.delete({
      where: { id, tenantId: session.tenantId },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 })
  }
}
