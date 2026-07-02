import { NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import type { UserRole } from '@prisma/client'

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const categories = await prisma.category.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      include: {
        menuItems: {
          where: { tenantId: session.tenantId, isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json({ categories })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 401 })
  }
}

const createMenuItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  gstRate: z.number().min(0).max(100).default(5),
  isVeg: z.boolean(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  costPrice: z.number().positive().optional(),
})

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const session = await requireRole(['OWNER', 'MANAGER'] as UserRole[])
    const body: unknown = await req.json()
    const parsed = createMenuItemSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    const { name, price, gstRate, isVeg, categoryId, description, costPrice } = parsed.data

    const menuItem = await prisma.menuItem.create({
      data: {
        tenantId: session.tenantId,
        name,
        price,
        gstRate,
        isVeg,
        categoryId: categoryId ?? null,
        description: description ?? null,
        costPrice: costPrice ?? null,
      },
    })

    return NextResponse.json({ menuItem }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 })
  }
}
