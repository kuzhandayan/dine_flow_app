import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const orderItemSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().int().min(1),
  notes: z.string().optional(),
})

const createOrderSchema = z.object({
  customerId: z.string(),
  type: z.enum(['DINE_IN', 'PARCEL', 'DELIVERY']),
  tableNumber: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
})

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')?.trim()
    const page = parseInt(url.searchParams.get('page') ?? '1')
    const limit = parseInt(url.searchParams.get('limit') ?? '20')

    const orders = await prisma.order.findMany({
      where: {
        tenantId: session.tenantId,
        isActive: true,
        ...(status ? { status: status as never } : {}),
        ...(search ? { orderNumber: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      include: {
        customer: { select: { name: true, phone: true } },
        items: { select: { name: true, quantity: true, total: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    })

    return NextResponse.json({ orders })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 401 })
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const body: unknown = await req.json()
    const parsed = createOrderSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    const { customerId, type, tableNumber, notes, items } = parsed.data

    const menuItems = await prisma.menuItem.findMany({
      where: {
        tenantId: session.tenantId,
        id: { in: items.map((i) => i.menuItemId) },
        isAvailable: true,
        isActive: true,
      },
    })

    const menuMap = new Map(menuItems.map((m) => [m.id, m]))

    let subtotal = 0
    let totalCGST = 0
    let totalSGST = 0

    const orderItems = items.map((item) => {
      const menuItem = menuMap.get(item.menuItemId)
      if (!menuItem) throw new Error(`Menu item not found: ${item.menuItemId}`)

      const itemSubtotal = menuItem.price * item.quantity
      const gstAmount = itemSubtotal * (menuItem.gstRate / 100)
      const cgst = gstAmount / 2
      const sgst = gstAmount / 2
      const total = itemSubtotal + gstAmount

      subtotal += itemSubtotal
      totalCGST += cgst
      totalSGST += sgst

      return {
        menuItemId: item.menuItemId,
        name: menuItem.name,
        price: menuItem.price,
        gstRate: menuItem.gstRate,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        gstAmount,
        cgst,
        sgst,
        total,
        notes: item.notes,
        createdById: session.userId,
        updatedById: session.userId,
      }
    })

    const totalGST = totalCGST + totalSGST
    const grandTotal = subtotal + totalGST

    const orderCount = await prisma.order.count({ where: { tenantId: session.tenantId } })
    const orderNumber = `ORD-${String(orderCount + 1).padStart(5, '0')}`

    const order = await prisma.order.create({
      data: {
        tenantId: session.tenantId,
        customerId,
        createdById: session.userId,
        updatedById: session.userId,
        orderNumber,
        type,
        tableNumber: tableNumber ?? null,
        notes,
        subtotal,
        totalGST,
        totalCGST,
        totalSGST,
        grandTotal,
        items: { create: orderItems },
      },
      include: {
        customer: { select: { name: true, phone: true } },
        items: true,
      },
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 })
  }
}
