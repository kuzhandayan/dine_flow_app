import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ inventoryItems })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 401 })
  }
}

const createInventoryItemSchema = z.object({
  name: z.string().min(1),
  unit: z.string().min(1),
  quantity: z.number().min(0),
  minStockLevel: z.number().min(0),
  costPerUnit: z.number().positive(),
  supplier: z.string().optional(),
})

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const body: unknown = await req.json()
    const parsed = createInventoryItemSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    const { name, unit, quantity, minStockLevel, costPerUnit, supplier } = parsed.data

    const inventoryItem = await prisma.inventoryItem.create({
      data: {
        tenantId: session.tenantId,
        name,
        unit,
        quantity,
        minStockLevel,
        costPerUnit,
        supplier: supplier ?? null,
        createdById: session.userId,
        updatedById: session.userId,
      },
    })

    return NextResponse.json({ inventoryItem }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 })
  }
}
