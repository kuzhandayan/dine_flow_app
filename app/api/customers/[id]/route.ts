import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const { id } = await params

    const customer = await prisma.customer.findFirst({
      where: { id, tenantId: session.tenantId },
    })
    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    const orders = await prisma.order.findMany({
      where: { customerId: id, tenantId: session.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        items: { select: { name: true, quantity: true, total: true } },
      },
    })

    const totalSpent = orders
      .filter((o) => o.paymentStatus === 'PAID')
      .reduce((s, o) => s + o.grandTotal, 0)

    return NextResponse.json({ customer, orders, totalSpent })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode })
    return NextResponse.json({ error: 'Failed to load customer' }, { status: 500 })
  }
}
