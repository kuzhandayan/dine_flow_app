import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const { id } = await params

    const order = await prisma.order.findFirst({
      where: { id, tenantId: session.tenantId },
      include: {
        customer: true,
        items: true,
        payments: true,
      },
    })

    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      include: { gstConfig: true },
    })

    return NextResponse.json({ order, tenant })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 })
  }
}

const updateOrderSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'READY', 'SERVED', 'DELIVERED', 'COMPLETED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED']).optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI']).optional(),
  paidAmount: z.number().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const { id } = await params
    const body: unknown = await req.json()
    const parsed = updateOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    const update = parsed.data
    const now = new Date()

    const order = await prisma.order.update({
      where: { id, tenantId: session.tenantId },
      data: {
        ...update,
        ...(update.status === 'COMPLETED' ? { completedAt: now } : {}),
        ...(update.paymentStatus === 'PAID' ? { paidAt: now } : {}),
      },
    })

    return NextResponse.json({ order })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 })
  }
}
