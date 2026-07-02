import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await requireRole(['OWNER', 'MANAGER', 'SUPER_ADMIN'])
    const { searchParams } = req.nextUrl

    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    const from = fromParam ? new Date(fromParam) : (() => {
      const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d
    })()
    const to = toParam ? new Date(toParam + 'T23:59:59.999Z') : (() => {
      const d = new Date(); d.setHours(23, 59, 59, 999); return d
    })()

    const [orders, restockLogs, inventoryItems] = await Promise.all([
      prisma.order.findMany({
        where: {
          tenantId: session.tenantId,
          // Filter by updatedAt so orders paid/completed in this period are counted
          // regardless of when they were originally created
          updatedAt: { gte: from, lte: to },
        },
        include: {
          items: { select: { name: true, quantity: true, total: true, gstRate: true, gstAmount: true, cgst: true, sgst: true, subtotal: true } },
        },
        orderBy: { updatedAt: 'asc' },
      }),
      prisma.restockLog.findMany({
        where: {
          inventoryItem: { tenantId: session.tenantId },
          createdAt: { gte: from, lte: to },
        },
        select: { quantityAdded: true, costPerUnit: true, createdAt: true },
      }),
      prisma.inventoryItem.findMany({
        where: { tenantId: session.tenantId },
        select: { name: true, quantity: true, costPerUnit: true, minStockLevel: true },
      }),
    ])

    // Only PAID orders count as revenue
    const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID' || o.status === 'COMPLETED')

    // Summary totals
    const totalRevenue = paidOrders.reduce((s, o) => s + o.grandTotal, 0)
    const netRevenue   = paidOrders.reduce((s, o) => s + o.subtotal, 0)
    const totalGST     = paidOrders.reduce((s, o) => s + o.totalGST, 0)
    const totalCGST    = paidOrders.reduce((s, o) => s + o.totalCGST, 0)
    const totalSGST    = paidOrders.reduce((s, o) => s + o.totalSGST, 0)

    // Restock expenses
    const inventoryExpenses = restockLogs.reduce((s, r) => s + (r.costPerUnit ?? 0) * r.quantityAdded, 0)
    const currentInventoryValue = inventoryItems.reduce((s, i) => s + i.costPerUnit * i.quantity, 0)

    const completedOrders = paidOrders.length
    const cancelledOrders = orders.filter((o) => o.status === 'CANCELLED').length
    const avgOrderValue   = completedOrders > 0 ? totalRevenue / completedOrders : 0

    // Daily breakdown
    const dailyMap = new Map<string, { orders: number; revenue: number; gst: number }>()
    for (const o of paidOrders) {
      const key = o.updatedAt.toISOString().slice(0, 10)
      const existing = dailyMap.get(key) ?? { orders: 0, revenue: 0, gst: 0 }
      dailyMap.set(key, {
        orders: existing.orders + 1,
        revenue: existing.revenue + o.grandTotal,
        gst: existing.gst + o.totalGST,
      })
    }
    const daily = Array.from(dailyMap.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Top items
    const itemMap = new Map<string, { quantity: number; revenue: number }>()
    for (const o of paidOrders) {
      for (const item of o.items) {
        const existing = itemMap.get(item.name) ?? { quantity: 0, revenue: 0 }
        itemMap.set(item.name, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.total,
        })
      }
    }
    const topItems = Array.from(itemMap.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // GST breakdown by rate
    const gstRateMap = new Map<number, { taxable: number; gst: number; cgst: number; sgst: number }>()
    for (const o of paidOrders) {
      for (const item of o.items) {
        const existing = gstRateMap.get(item.gstRate) ?? { taxable: 0, gst: 0, cgst: 0, sgst: 0 }
        gstRateMap.set(item.gstRate, {
          taxable: existing.taxable + item.subtotal,
          gst: existing.gst + item.gstAmount,
          cgst: existing.cgst + item.cgst,
          sgst: existing.sgst + item.sgst,
        })
      }
    }
    const gstBreakup = Array.from(gstRateMap.entries())
      .map(([rate, v]) => ({ rate, ...v }))
      .sort((a, b) => a.rate - b.rate)

    // Orders by status
    const ordersByStatus: Record<string, number> = {}
    for (const o of orders) {
      ordersByStatus[o.status] = (ordersByStatus[o.status] ?? 0) + 1
    }

    return NextResponse.json({
      summary: {
        totalRevenue, netRevenue, totalGST, totalCGST, totalSGST,
        totalOrders: orders.length, completedOrders, cancelledOrders, avgOrderValue,
        inventoryExpenses, currentInventoryValue,
        grossProfit: totalRevenue - inventoryExpenses,
      },
      daily,
      topItems,
      gstBreakup,
      ordersByStatus,
      period: { from: from.toISOString(), to: to.toISOString() },
    })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode })
    return NextResponse.json({ error: 'Failed to load reports' }, { status: 500 })
  }
}
