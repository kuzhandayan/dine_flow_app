import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const url = new URL(req.url)
    const q = url.searchParams.get('q')?.trim()

    const customers = await prisma.customer.findMany({
      where: {
        tenantId: session.tenantId,
        isActive: true,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: 50,
      include: {
        _count: { select: { orders: true } },
        orders: {
          where: { paymentStatus: 'PAID' },
          select: { grandTotal: true, updatedAt: true },
          orderBy: { updatedAt: 'desc' },
          take: 1,
        },
      },
    })

    // Aggregate total spent per customer from paid orders
    const customerIds = customers.map((c) => c.id)
    const spentAgg = await prisma.order.groupBy({
      by: ['customerId'],
      where: { customerId: { in: customerIds }, paymentStatus: 'PAID' },
      _sum: { grandTotal: true },
      _count: { id: true },
    })
    const spentMap = new Map(spentAgg.map((a) => [a.customerId, { total: a._sum.grandTotal ?? 0, count: a._count.id }]))

    const result = customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      createdAt: c.createdAt,
      lastVisitAt: c.orders[0]?.updatedAt ?? null,
      totalOrders: spentMap.get(c.id)?.count ?? 0,
      totalSpent: spentMap.get(c.id)?.total ?? 0,
    }))

    return NextResponse.json({ customers: result })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 401 })
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const body: unknown = await req.json()
    const schema = z.object({
      name: z.string().min(1),
      phone: z.string().min(10).max(15),
      email: z.string().email().optional().or(z.literal('')),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }
    const customer = await prisma.customer.create({
      data: {
        tenantId: session.tenantId,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
      },
    })
    return NextResponse.json({ customer }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 })
  }
}
