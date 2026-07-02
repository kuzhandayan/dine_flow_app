'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { useCurrency } from '@/hooks/useCurrency'
import {
  Search, Loader2, Receipt, UtensilsCrossed, Package,
  X, ChevronLeft, ChevronRight,
} from 'lucide-react'

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

const PAGE_SIZE = 9

export default function CheckOrderPage(): React.JSX.Element {
  const { format: fmt } = useCurrency()
  const [query, setQuery] = useState('')
  const [lastQuery, setLastQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [allResults, setAllResults] = useState<Order[]>([])
  const [searched, setSearched] = useState(false)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Order | null>(null)

  async function lookup(p = 1): Promise<void> {
    const q = query.trim().replace(/[*%]/g, '')
    if (!q) return
    setLoading(true)
    if (p === 1) { setAllResults([]); setSearched(false) }
    setLastQuery(q)
    try {
      const res = await fetch(`/api/orders?search=${encodeURIComponent(q)}&page=${p}&limit=${PAGE_SIZE}`)
      const data = (await res.json()) as { orders: Order[] }
      setAllResults(data.orders ?? [])
      setPage(p)
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(allResults.length / PAGE_SIZE) || 1
  // Since we fetch PAGE_SIZE per page, use hasMore heuristic
  const hasMore = allResults.length === PAGE_SIZE

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Check Order" subtitle="Look up any order by order number or partial text" />

      {/* Search bar */}
      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--df-text-3))]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void lookup(1)}
            placeholder="e.g. ORD-00001 or partial like 01"
            className="w-full pl-9 pr-3 py-2.5 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))]"
          />
        </div>
        <button
          onClick={() => void lookup(1)}
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-xl text-[13px] font-medium transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Lookup
        </button>
      </div>

      {/* No results */}
      {searched && allResults.length === 0 && !loading && (
        <div className="text-center py-16 bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl">
          <Search className="w-10 h-10 opacity-20 mx-auto mb-3" />
          <p className="text-[14px] font-medium">No orders found</p>
          <p className="text-[12px] text-[rgb(var(--df-text-2))] mt-1">No orders matching &quot;{lastQuery}&quot;</p>
        </div>
      )}

      {/* Results grid */}
      {allResults.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-[rgb(var(--df-text-3))]">
              {allResults.length} order{allResults.length !== 1 ? 's' : ''} found for &quot;{lastQuery}&quot;
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allResults.map((order) => {
              const st = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['PENDING']!
              return (
                <button
                  key={order.id}
                  onClick={() => setSelected(order)}
                  className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-4 text-left hover:border-[rgb(var(--df-accent))]/40 hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[15px] font-bold text-[rgb(var(--df-accent))]">{order.orderNumber}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${st.color}`}>{st.label}</span>
                  </div>
                  <p className="text-[13px] font-medium text-[rgb(var(--df-text))]">{order.customer.name}</p>
                  <p className="text-[12px] text-[rgb(var(--df-text-3))] mt-0.5">{order.customer.phone}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgb(var(--df-border))]">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      {order.type === 'DINE_IN'
                        ? <><UtensilsCrossed className="w-3.5 h-3.5 text-[rgb(var(--df-text-3))]" /><span className="text-[rgb(var(--df-text-3))]">Dine In{order.tableNumber ? ` · T${order.tableNumber}` : ''}</span></>
                        : <><Package className="w-3.5 h-3.5 text-[rgb(var(--df-text-3))]" /><span className="text-[rgb(var(--df-text-3))]">Parcel</span></>
                      }
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-bold text-[rgb(var(--df-text))]">{fmt(order.grandTotal)}</p>
                      <p className={`text-[10px] font-medium ${order.paymentStatus === 'PAID' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {order.paymentStatus}
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[rgb(var(--df-text-3))] mt-2">
                    {new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => void lookup(page - 1)}
              disabled={page === 1 || loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium border border-[rgb(var(--df-border))] text-[rgb(var(--df-text-2))] hover:bg-[rgb(var(--df-surface-2))] disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-[13px] text-[rgb(var(--df-text-3))] px-2">Page {page}</span>
            <button
              onClick={() => void lookup(page + 1)}
              disabled={!hasMore || loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-medium border border-[rgb(var(--df-border))] text-[rgb(var(--df-text-2))] hover:bg-[rgb(var(--df-surface-2))] disabled:opacity-40 transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-[rgb(var(--df-border))]">
              <div>
                <p className="text-[18px] font-bold text-[rgb(var(--df-accent))]">{selected.orderNumber}</p>
                <p className="text-[12px] text-[rgb(var(--df-text-2))] mt-0.5">{new Date(selected.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${(STATUS_CONFIG[selected.status] ?? STATUS_CONFIG['PENDING']!).color}`}>
                  {(STATUS_CONFIG[selected.status] ?? STATUS_CONFIG['PENDING']!).label}
                </span>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-3))]">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Customer + type */}
            <div className="grid grid-cols-2 gap-3 px-5 py-4 border-b border-[rgb(var(--df-border))]">
              <div>
                <p className="text-[11px] text-[rgb(var(--df-text-3))] uppercase tracking-wide">Customer</p>
                <p className="text-[13px] font-medium mt-0.5">{selected.customer.name}</p>
                <p className="text-[12px] text-[rgb(var(--df-text-2))]">{selected.customer.phone}</p>
              </div>
              <div>
                <p className="text-[11px] text-[rgb(var(--df-text-3))] uppercase tracking-wide">Type</p>
                <p className="text-[13px] font-medium mt-0.5 flex items-center gap-1.5">
                  {selected.type === 'DINE_IN' ? <UtensilsCrossed className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                  {selected.type === 'DINE_IN' ? `Dine In${selected.tableNumber ? ` — Table ${selected.tableNumber}` : ''}` : 'Parcel'}
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="px-5 py-4 border-b border-[rgb(var(--df-border))]">
              <p className="text-[11px] font-medium text-[rgb(var(--df-text-3))] uppercase tracking-wide mb-3">Items</p>
              <div className="space-y-2">
                {selected.items.map((item, i) => (
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
              <div className="flex justify-between text-[rgb(var(--df-text-2))]"><span>Subtotal</span><span>{fmt(selected.subtotal)}</span></div>
              <div className="flex justify-between text-[rgb(var(--df-text-2))]"><span>CGST</span><span>{fmt(selected.totalCGST)}</span></div>
              <div className="flex justify-between text-[rgb(var(--df-text-2))]"><span>SGST</span><span>{fmt(selected.totalSGST)}</span></div>
              <div className="flex justify-between font-bold text-[15px] pt-2 border-t border-[rgb(var(--df-border))]">
                <span>Grand Total</span>
                <span className="text-[rgb(var(--df-accent))]">{fmt(selected.grandTotal)}</span>
              </div>
              <div className="flex items-center gap-1.5 pt-1">
                <Receipt className="w-3.5 h-3.5" />
                <span className={`text-[12px] font-medium ${selected.paymentStatus === 'PAID' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {selected.paymentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
