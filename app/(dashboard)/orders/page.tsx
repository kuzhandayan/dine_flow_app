'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrency } from '@/hooks/useCurrency'
import { PageHeader } from '@/components/shared/PageHeader'
import {
  Search,
  RefreshCw,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  UtensilsCrossed,
  Package,
} from 'lucide-react'

interface OrderItem {
  name: string
  quantity: number
  total: number
}

interface Order {
  id: string
  orderNumber: string
  type: 'DINE_IN' | 'PARCEL' | 'DELIVERY'
  status: string
  paymentStatus: string
  grandTotal: number
  tableNumber: string | null
  createdAt: string
  customer: { name: string; phone: string }
  items: OrderItem[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:     { label: 'Pending',     color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  READY:       { label: 'Ready',       color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  SERVED:      { label: 'Served',      color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  DELIVERED:   { label: 'Delivered',   color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  COMPLETED:   { label: 'Completed',   color: 'text-[rgb(var(--df-text-3))] bg-[rgb(var(--df-surface-2))] border-[rgb(var(--df-border))]' },
  CANCELLED:   { label: 'Cancelled',   color: 'text-red-400 bg-red-400/10 border-red-400/20' },
}

const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  UNPAID:  { label: 'Unpaid',  color: 'text-red-400' },
  PARTIAL: { label: 'Partial', color: 'text-yellow-400' },
  PAID:    { label: 'Paid',    color: 'text-green-400' },
  REFUNDED:{ label: 'Refunded',color: 'text-[rgb(var(--df-text-3))]' },
}

const TYPE_ICON = {
  DINE_IN:  <UtensilsCrossed className="w-3.5 h-3.5" />,
  PARCEL:   <Package className="w-3.5 h-3.5" />,
  DELIVERY: <Package className="w-3.5 h-3.5" />,
}

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'READY', label: 'Ready' },
  { value: 'SERVED', label: 'Served' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

export default function OrdersPage(): React.JSX.Element {
  const router = useRouter()
  const { format: fmt } = useCurrency()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const fetchOrders = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const url = new URL('/api/orders', window.location.origin)
      if (statusFilter) url.searchParams.set('status', statusFilter)
      const res = await fetch(url.toString())
      if (!res.ok) throw new Error('Failed')
      const data = (await res.json()) as { orders: Order[] }
      setOrders(data.orders)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    void fetchOrders()
  }, [fetchOrders])

  const filtered = orders.filter((o) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) ||
      o.customer.phone.includes(q)
    )
  })

  return (
    <div>
      <PageHeader title="Orders" subtitle="View and manage all orders" />

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--df-text-3))]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order or customer…"
            className="w-full pl-9 pr-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))]"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-[12px] rounded-lg border transition-all ${
                statusFilter === f.value
                  ? 'bg-[rgb(var(--df-accent))] text-white border-transparent'
                  : 'bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-2))] border-[rgb(var(--df-border))] hover:border-[rgb(var(--df-accent))]/40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => void fetchOrders()}
          className="p-2 rounded-xl border border-[rgb(var(--df-border))] hover:border-[rgb(var(--df-accent))]/40 text-[rgb(var(--df-text-2))] transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--df-text-3))]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--df-surface-2))] flex items-center justify-center mx-auto mb-4">
            <Clock className="w-6 h-6 text-[rgb(var(--df-text-3))]" />
          </div>
          <p className="text-[14px] font-medium text-[rgb(var(--df-text))]">No orders found</p>
          <p className="text-[12px] text-[rgb(var(--df-text-2))] mt-1">
            {search || statusFilter ? 'Try changing your filters' : 'Create your first order'}
          </p>
        </div>
      ) : (
        <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1.5fr_auto_auto_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-[rgb(var(--df-border))] text-[11px] font-medium text-[rgb(var(--df-text-3))] uppercase tracking-wide">
            <span>Order</span>
            <span>Customer</span>
            <span>Type</span>
            <span>Amount</span>
            <span>Payment</span>
            <span>Status</span>
            <span></span>
          </div>

          {filtered.map((order) => {
            const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['PENDING']
            const pt = PAYMENT_CONFIG[order.paymentStatus] ?? PAYMENT_CONFIG['UNPAID']
            return (
              <button
                key={order.id}
                onClick={() => router.push(`/orders/${order.id}`)}
                className="w-full grid grid-cols-[1fr_1.5fr_auto_auto_auto_auto_auto] gap-4 px-4 py-3.5 items-center border-b border-[rgb(var(--df-border))] last:border-b-0 hover:bg-[rgb(var(--df-surface-2))]/50 transition-colors text-left"
              >
                <div>
                  <p className="text-[13px] font-medium text-[rgb(var(--df-accent))]">{order.orderNumber}</p>
                  <p className="text-[11px] text-[rgb(var(--df-text-3))] mt-0.5">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div>
                  <p className="text-[13px] text-[rgb(var(--df-text))]">{order.customer.name}</p>
                  <p className="text-[11px] text-[rgb(var(--df-text-3))]">{order.customer.phone}</p>
                </div>
                <span className="flex items-center gap-1.5 text-[12px] text-[rgb(var(--df-text-2))]">
                  {TYPE_ICON[order.type]}
                  {order.tableNumber ? `T-${order.tableNumber}` : order.type === 'DINE_IN' ? 'Dine In' : 'Parcel'}
                </span>
                <span className="text-[13px] font-medium text-[rgb(var(--df-text))]">
                  {fmt(order.grandTotal)}
                </span>
                <span className={`text-[12px] font-medium ${pt.color}`}>{pt.label}</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border ${st.color}`}>
                  {st.label}
                </span>
                <ChevronRight className="w-4 h-4 text-[rgb(var(--df-text-3))]" />
              </button>
            )
          })}
        </div>
      )}

      <p className="text-[11px] text-[rgb(var(--df-text-3))] mt-3 text-right">
        {filtered.length} order{filtered.length !== 1 ? 's' : ''}
        {statusFilter || search ? ' (filtered)' : ''}
      </p>
    </div>
  )
}
