import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateInventoryItemSchema = z.object({
  name: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  quantity: z.number().min(0).optional(),
  minStockLevel: z.number().min(0).optional(),
  costPerUnit: z.number().positive().optional(),
  supplier: z.string().nullable().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const { id } = await params
    const body: unknown = await req.json()
    const parsed = updateInventoryItemSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    const inventoryItem = await prisma.inventoryItem.update({
      where: { id, tenantId: session.tenantId },
      data: parsed.data,
    })

    return NextResponse.json({ inventoryItem })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const { id } = await params

    await prisma.inventoryItem.delete({
      where: { id, tenantId: session.tenantId },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 })
  }
}
