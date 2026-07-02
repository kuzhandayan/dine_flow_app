'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { useCurrency } from '@/hooks/useCurrency'
import { Search, Loader2, Receipt, UtensilsCrossed, Package, ChevronDown, ChevronUp } from 'lucide-react'

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
  const [results, setResults] = useState<Order[]>([])
  const [searched, setSearched] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function lookup(): Promise<void> {
    const q = query.trim()
    if (!q) return
    setLoading(true)
    setResults([])
    setSearched(false)
    setExpandedId(null)
    try {
      const res = await fetch(`/api/orders?search=${encodeURIComponent(q)}&page=1`)
      const data = (await res.json()) as { orders: Order[] }
      setResults(data.orders ?? [])
      setSearched(true)
      // Auto-expand if only one result
      if (data.orders?.length === 1) setExpandedId(data.orders[0]!.id)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Check Order" subtitle="Look up any order by order number" />

      <div className="max-w-2xl">
        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--df-text-3))]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void lookup()}
              placeholder="e.g. ORD-00001 or partial like 01"
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

        {searched && results.length === 0 && (
          <div className="text-center py-10 bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl">
            <p className="text-[14px] font-medium">No orders found</p>
            <p className="text-[12px] text-[rgb(var(--df-text-2))] mt-1">No orders matching &quot;{query}&quot;</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            {results.length > 1 && (
              <p className="text-[12px] text-[rgb(var(--df-text-3))] mb-3">{results.length} orders found — click to expand</p>
            )}
            {results.map((order) => {
              const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['PENDING']!
              const expanded = expandedId === order.id
              return (
                <div key={order.id} className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl overflow-hidden">
                  {/* Row — always visible */}
                  <button
                    onClick={() => setExpandedId(expanded ? null : order.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-[rgb(var(--df-surface-2))]/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-[15px] font-bold text-[rgb(var(--df-accent))]">{order.orderNumber}</p>
                        <p className="text-[12px] text-[rgb(var(--df-text-3))] mt-0.5">{order.customer.name} · {order.customer.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${st!.color}`}>{st!.label}</span>
                      <span className={`text-[12px] font-medium ${order.paymentStatus === 'PAID' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {order.paymentStatus}
                      </span>
                      <span className="text-[14px] font-bold text-[rgb(var(--df-text))]">{fmt(order.grandTotal)}</span>
                      {expanded ? <ChevronUp className="w-4 h-4 text-[rgb(var(--df-text-3))]" /> : <ChevronDown className="w-4 h-4 text-[rgb(var(--df-text-3))]" />}
                    </div>
                  </button>

                  {/* Expanded detail */}
                  {expanded && (
                    <div className="border-t border-[rgb(var(--df-border))]">
                      {/* Meta */}
                      <div className="px-5 py-4 border-b border-[rgb(var(--df-border))] grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-[11px] text-[rgb(var(--df-text-3))] uppercase tracking-wide">Date</p>
                          <p className="text-[13px] font-medium mt-0.5">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-[rgb(var(--df-text-3))] uppercase tracking-wide">Type</p>
                          <p className="text-[13px] font-medium mt-0.5 flex items-center gap-1.5">
                            {order.type === 'DINE_IN' ? <UtensilsCrossed className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                            {order.type === 'DINE_IN' ? `Dine In${order.tableNumber ? ` — Table ${order.tableNumber}` : ''}` : 'Parcel'}
                          </p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="px-5 py-4 border-b border-[rgb(var(--df-border))]">
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
                      <div className="px-5 py-4 space-y-1.5 text-[13px]">
                        <div className="flex justify-between text-[rgb(var(--df-text-2))]"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
                        <div className="flex justify-between text-[rgb(var(--df-text-2))]"><span>CGST</span><span>{fmt(order.totalCGST)}</span></div>
                        <div className="flex justify-between text-[rgb(var(--df-text-2))]"><span>SGST</span><span>{fmt(order.totalSGST)}</span></div>
                        <div className="flex justify-between font-bold text-[15px] pt-2 border-t border-[rgb(var(--df-border))]">
                          <span>Grand Total</span>
                          <span className="text-[rgb(var(--df-accent))]">{fmt(order.grandTotal)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 pt-1">
                          <Receipt className="w-3.5 h-3.5" />
                          <span className={`text-[12px] font-medium ${order.paymentStatus === 'PAID' ? 'text-green-400' : 'text-yellow-400'}`}>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
