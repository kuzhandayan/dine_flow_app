'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { useCurrency } from '@/hooks/useCurrency'
import { Search, Loader2, Receipt, UtensilsCrossed, Package } from 'lucide-react'

interface OrderItem { name: string; quantity: number; price: number; gstRate: number; total: number; cgst: number; sgst: number }
interface Order {
  id: string
  orderNumber: string
  type: string
  status: string
  paymentStatus: string
  tableNumber: string | null
  grandTotal: number
  subtotal: number
  totalCGST: number
  totalSGST: number
  totalGST: number
  createdAt: string
  notes: string | null
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

export default function CheckOrderPage(): React.JSX.Element {
  const { format: fmt } = useCurrency()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [notFound, setNotFound] = useState(false)

  async function lookup(): Promise<void> {
    const q = query.trim().toUpperCase()
    if (!q) return
    setLoading(true)
    setOrder(null)
    setNotFound(false)
    try {
      const res = await fetch(`/api/orders?search=${encodeURIComponent(q)}`)
      const data = (await res.json()) as { orders: Order[] }
      const found = data.orders.find(
        (o) => o.orderNumber.toUpperCase() === q,
      )
      if (found) {
        // fetch full details
        const detail = await fetch(`/api/orders/${found.id}`)
        const d = (await detail.json()) as { order: Order }
        setOrder(d.order)
      } else {
        setNotFound(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const st = order ? (STATUS_CONFIG[order.status] ?? STATUS_CONFIG['PENDING']) : null

  return (
    <div>
      <PageHeader title="Check Order" subtitle="Look up any order by order number" />

      <div className="max-w-lg">
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--df-text-3))]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void lookup()}
              placeholder="e.g. ORD-00001"
              className="w-full pl-9 pr-3 py-2.5 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))]"
            />
          </div>
          <button
            onClick={() => void lookup()}
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-xl text-[13px] font-medium transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Lookup
          </button>
        </div>

        {notFound && (
          <div className="text-center py-10 bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl">
            <p className="text-[14px] font-medium">Order not found</p>
            <p className="text-[12px] text-[rgb(var(--df-text-2))] mt-1">No order with number &quot;{query}&quot;</p>
          </div>
        )}

        {order && st && (
          <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-[rgb(var(--df-border))]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[18px] font-bold text-[rgb(var(--df-accent))]">{order.orderNumber}</p>
                  <p className="text-[12px] text-[rgb(var(--df-text-2))] mt-0.5">
                    {new Date(order.createdAt).toLocaleString('en-IN')}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[12px] font-medium border ${st.color}`}>
                  {st.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div>
                  <p className="text-[11px] text-[rgb(var(--df-text-3))] uppercase tracking-wide">Customer</p>
                  <p className="text-[13px] font-medium mt-0.5">{order.customer.name}</p>
                  <p className="text-[12px] text-[rgb(var(--df-text-2))]">{order.customer.phone}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[rgb(var(--df-text-3))] uppercase tracking-wide">Type</p>
                  <p className="text-[13px] font-medium mt-0.5 flex items-center gap-1.5">
                    {order.type === 'DINE_IN' ? <UtensilsCrossed className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                    {order.type === 'DINE_IN' ? `Dine In${order.tableNumber ? ` — Table ${order.tableNumber}` : ''}` : 'Parcel'}
                  </p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="p-5 border-b border-[rgb(var(--df-border))]">
              <p className="text-[11px] font-medium text-[rgb(var(--df-text-3))] uppercase tracking-wide mb-3">Items</p>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div>
                      <span className="text-[13px] text-[rgb(var(--df-text))]">{item.name}</span>
                      <span className="text-[12px] text-[rgb(var(--df-text-3))] ml-2">× {item.quantity}</span>
                    </div>
                    <span className="text-[13px] font-medium">{fmt(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="p-5">
              <div className="space-y-1.5 text-[13px]">
                <div className="flex justify-between text-[rgb(var(--df-text-2))]">
                  <span>Subtotal</span>
                  <span>{fmt(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[rgb(var(--df-text-2))]">
                  <span>CGST</span>
                  <span>{fmt(order.totalCGST)}</span>
                </div>
                <div className="flex justify-between text-[rgb(var(--df-text-2))]">
                  <span>SGST</span>
                  <span>{fmt(order.totalSGST)}</span>
                </div>
                <div className="flex justify-between font-bold text-[15px] pt-2 border-t border-[rgb(var(--df-border))]">
                  <span>Grand Total</span>
                  <span className="text-[rgb(var(--df-accent))]">{fmt(order.grandTotal)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-[12px] font-medium ${order.paymentStatus === 'PAID' ? 'text-green-400' : 'text-yellow-400'}`}>
                  <Receipt className="w-3.5 h-3.5 inline mr-1" />
                  {order.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
