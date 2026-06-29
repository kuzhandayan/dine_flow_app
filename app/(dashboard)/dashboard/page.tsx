import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { formatINR, formatINRCompact } from '@/lib/currency'
import { ShoppingCart, IndianRupee, Users, AlertTriangle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const session = await auth()
  if (!session) redirect('/login')

  const tenantId = session.user.tenantId
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const [todayOrders, totalCustomers, inventoryItems, todayRevenue] = await Promise.all([
    prisma.order.count({
      where: { tenantId, createdAt: { gte: startOfDay } },
    }),
    prisma.customer.count({ where: { tenantId } }),
    prisma.inventoryItem.findMany({
      where: { tenantId },
      select: { quantity: true, minStockLevel: true },
    }),
    prisma.order.aggregate({
      where: { tenantId, paymentStatus: 'PAID', createdAt: { gte: startOfDay } },
      _sum: { grandTotal: true },
    }),
  ])

  const lowStockCount = inventoryItems.filter((i) => i.quantity <= i.minStockLevel).length

  const revenue = todayRevenue._sum.grandTotal ?? 0

  const activeOrders = await prisma.order.count({
    where: {
      tenantId,
      status: { in: ['PENDING', 'IN_PROGRESS', 'READY'] },
    },
  })

  const recentOrders = await prisma.order.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { customer: { select: { name: true } } },
  })

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Good ${getGreeting()}, ${session.user.name?.split(' ')[0]}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Today's Revenue"
          value={formatINRCompact(revenue)}
          subtitle={formatINR(revenue)}
          color="rgb(var(--df-accent))"
          icon={<IndianRupee className="w-5 h-5" />}
        />
        <StatCard
          label="Today's Orders"
          value={String(todayOrders)}
          subtitle={`${activeOrders} active now`}
          color="rgb(var(--df-blue))"
          icon={<ShoppingCart className="w-5 h-5" />}
        />
        <StatCard
          label="Customers"
          value={String(totalCustomers)}
          subtitle="Total registered"
          color="rgb(var(--df-green))"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Low Stock"
          value={String(lowStockCount)}
          subtitle="Items need restock"
          color={lowStockCount > 0 ? 'rgb(var(--df-red))' : 'rgb(var(--df-green))'}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
      </div>

      <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-xl p-5">
        <h2 className="text-[15px] font-semibold mb-4">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-[13px] text-[rgb(var(--df-text-2))] text-center py-8">
            No orders yet today
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr>
                  {['Order', 'Customer', 'Type', 'Total', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2.5 text-[11px] font-medium text-[rgb(var(--df-text-2))] border-b border-[rgb(var(--df-border))] whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/[0.015] transition-colors">
                    <td className="px-3 py-2.5 border-b border-[rgba(45,49,73,0.4)] font-medium">
                      {order.orderNumber}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[rgba(45,49,73,0.4)] text-[rgb(var(--df-text-2))]">
                      {order.customer.name}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[rgba(45,49,73,0.4)] text-[rgb(var(--df-text-2))]">
                      {order.type.replace('_', ' ')}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[rgba(45,49,73,0.4)] font-medium">
                      {formatINR(order.grandTotal)}
                    </td>
                    <td className="px-3 py-2.5 border-b border-[rgba(45,49,73,0.4)]">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/15 text-yellow-400">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
