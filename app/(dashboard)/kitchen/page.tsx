'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  UtensilsCrossed, Package, Clock, RefreshCw, Loader2,
  ChevronRight, Flame, CheckCircle2, X, ChefHat,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCurrency } from '@/hooks/useCurrency'

interface OrderItem { name: string; quantity: number; notes: string | null }

interface Order {
  id: string
  orderNumber: string
  type: 'DINE_IN' | 'PARCEL' | 'DELIVERY'
  status: 'PENDING' | 'IN_PROGRESS' | 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED'
  tableNumber: string | null
  notes: string | null
  grandTotal: number
  createdAt: string
  updatedAt: string
  customer: { name: string }
  items: OrderItem[]
}

const ACTIVE_COLUMNS: { status: 'PENDING' | 'IN_PROGRESS' | 'READY'; label: string; accent: string; cardBorder: string; badge: string }[] = [
  {
    status: 'PENDING',
    label: 'New Orders',
    accent: 'text-yellow-400',
    cardBorder: 'border-yellow-500/30',
    badge: 'bg-yellow-400/15 text-yellow-400 border-yellow-400/25',
  },
  {
    status: 'IN_PROGRESS',
    label: 'Cooking',
    accent: 'text-blue-400',
    cardBorder: 'border-blue-500/30',
    badge: 'bg-blue-400/15 text-blue-400 border-blue-400/25',
  },
  {
    status: 'READY',
    label: 'Ready to Serve',
    accent: 'text-green-400',
    cardBorder: 'border-green-500/30',
    badge: 'bg-green-400/15 text-green-400 border-green-400/25',
  },
]

const NEXT_STATUS: Record<string, string> = {
  PENDING: 'IN_PROGRESS',
  IN_PROGRESS: 'READY',
  READY: 'SERVED',
}

const NEXT_LABEL: Record<string, string> = {
  PENDING: 'Start Cooking',
  IN_PROGRESS: 'Mark Ready',
  READY: 'Mark Served',
}

const STATUS_ORDER: ('PENDING' | 'IN_PROGRESS' | 'READY')[] = ['PENDING', 'IN_PROGRESS', 'READY']

type BucketStatus = 'PENDING' | 'IN_PROGRESS' | 'READY' | 'SERVED' | 'COMPLETED'
const BUCKET_STATUSES: BucketStatus[] = ['PENDING', 'IN_PROGRESS', 'READY', 'SERVED', 'COMPLETED']
const PAGE_SIZE = 10

interface StatusBucket {
  items: Order[]
  page: number
  hasMore: boolean
  loadingMore: boolean
}

function emptyBucket(): StatusBucket {
  return { items: [], page: 1, hasMore: true, loadingMore: false }
}

async function fetchStatusPage(status: BucketStatus, page: number): Promise<Order[]> {
  const res = await fetch(`/api/orders?status=${status}&page=${page}&limit=${PAGE_SIZE}`)
  const data = (await res.json()) as { orders?: Order[] }
  return data.orders ?? []
}

function elapsed(createdAt: string): string {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
}

function timeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

function ElapsedTimer({ createdAt }: { createdAt: string }): React.JSX.Element {
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  const urgent = diff > 600
  const warning = diff > 300
  return (
    <span className={`text-[11px] font-mono font-medium ${urgent ? 'text-red-400' : warning ? 'text-yellow-400' : 'text-[rgb(var(--df-text-3))]'}`}>
      {elapsed(createdAt)}
    </span>
  )
}

function LoadMoreSentinel({ onVisible, loading }: { onVisible: () => void; loading: boolean }): React.JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) onVisible() },
      { rootMargin: '150px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [onVisible])

  return (
    <div ref={ref} className="flex justify-center py-2">
      {loading && <Loader2 className="w-4 h-4 animate-spin text-[rgb(var(--df-text-3))]" />}
    </div>
  )
}

// ── Completed orders modal ────────────────────────────────────────────────────

function CompletedModal({
  orders,
  onClose,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  orders: Order[]
  onClose: () => void
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
}): React.JSX.Element {
  const { format: fmt } = useCurrency()
  const totalItems = orders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0)
  const totalRevenue = orders.reduce((s, o) => s + (o.grandTotal ?? 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(var(--df-border))]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-400/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-[14px] font-bold">Completed Today</p>
              <p className="text-[11px] text-[rgb(var(--df-text-3))]">{orders.length} orders · {totalItems} items served</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-3))] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 divide-x divide-[rgb(var(--df-border))] border-b border-[rgb(var(--df-border))]">
          {[
            { label: 'Orders Done', value: orders.length.toString() },
            { label: 'Items Served', value: totalItems.toString() },
            { label: 'Revenue', value: fmt(totalRevenue) },
          ].map((s) => (
            <div key={s.label} className="px-4 py-3 text-center">
              <p className="text-[18px] font-bold text-[rgb(var(--df-text))]">{s.value}</p>
              <p className="text-[10px] text-[rgb(var(--df-text-3))] uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Order list */}
        <div className="overflow-y-auto flex-1 divide-y divide-[rgb(var(--df-border))]">
          {orders.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-[rgb(var(--df-text-3))]">
              <ChefHat className="w-10 h-10 opacity-30" />
              <p className="text-[13px]">No completed orders yet today</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="px-5 py-3.5 hover:bg-[rgb(var(--df-surface-2))]/40 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-bold text-[rgb(var(--df-accent))]">{order.orderNumber}</span>
                      <span className="flex items-center gap-1 text-[11px] text-[rgb(var(--df-text-3))]">
                        {order.type === 'DINE_IN'
                          ? <><UtensilsCrossed className="w-3 h-3" />{order.tableNumber ? `Table ${order.tableNumber}` : 'Dine In'}</>
                          : <><Package className="w-3 h-3" />Parcel</>
                        }
                      </span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        order.status === 'COMPLETED'
                          ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                          : 'bg-teal-400/10 text-teal-400 border-teal-400/20'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[12px] text-[rgb(var(--df-text-2))]">{order.customer.name}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {order.items.map((item, i) => (
                        <span key={i} className="text-[11px] bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-2))] px-2 py-0.5 rounded-md">
                          {item.name} ×{item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-semibold text-[rgb(var(--df-text))]">{fmt(order.grandTotal ?? 0)}</p>
                    <p className="text-[10px] text-[rgb(var(--df-text-3))] mt-0.5">{timeOnly(order.updatedAt)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
          {hasMore && <LoadMoreSentinel onVisible={onLoadMore} loading={loadingMore} />}
        </div>
      </div>
    </div>
  )
}

// ── Move-back reason modal ─────────────────────────────────────────────────────

function MoveBackModal({
  order,
  targetLabel,
  submitting,
  onCancel,
  onConfirm,
}: {
  order: Order
  targetLabel: string
  submitting: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}): React.JSX.Element {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div
        className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <ChevronRight className="w-4 h-4 text-amber-400 rotate-180" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-[rgb(var(--df-text))]">Move {order.orderNumber} back?</p>
              <p className="text-[12px] text-[rgb(var(--df-text-3))] mt-0.5 leading-relaxed">
                This sends the order back to <span className="font-semibold">{targetLabel}</span>. Add a reason so it doesn't look like a mistouch.
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-3))] transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pb-2">
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for moving this order back…"
            rows={3}
            className="w-full resize-none rounded-xl border border-[rgb(var(--df-border))] bg-[rgb(var(--df-surface))] px-3 py-2 text-[13px] text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))] focus:outline-none focus:ring-2 focus:ring-amber-400/30"
          />
        </div>

        <div className="flex gap-2 px-5 pb-5 pt-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium border border-[rgb(var(--df-border))] text-[rgb(var(--df-text-2))] hover:bg-[rgb(var(--df-surface-2))] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason.trim())}
            disabled={!reason.trim() || submitting}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm Move'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function KitchenPage(): React.JSX.Element {
  const [buckets, setBuckets] = useState<Record<BucketStatus, StatusBucket>>({
    PENDING: emptyBucket(),
    IN_PROGRESS: emptyBucket(),
    READY: emptyBucket(),
    SERVED: emptyBucket(),
    COMPLETED: emptyBucket(),
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null)
  const [moveBack, setMoveBack] = useState<{ order: Order; targetStatus: 'PENDING' | 'IN_PROGRESS' | 'READY' } | null>(null)
  const [movingBack, setMovingBack] = useState(false)

  const fetchOrders = useCallback(async (): Promise<void> => {
    setRefreshing(true)
    try {
      const results = await Promise.all(BUCKET_STATUSES.map((s) => fetchStatusPage(s, 1)))
      setBuckets((prev) => {
        const next = { ...prev }
        BUCKET_STATUSES.forEach((s, i) => {
          const items = results[i] ?? []
          next[s] = { items, page: 1, hasMore: items.length === PAGE_SIZE, loadingMore: false }
        })
        return next
      })
      setLastRefreshed(new Date())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { void fetchOrders() }, [fetchOrders])

  async function loadMore(status: BucketStatus): Promise<void> {
    const bucket = buckets[status]
    if (bucket.loadingMore || !bucket.hasMore) return
    setBuckets((prev) => ({ ...prev, [status]: { ...prev[status], loadingMore: true } }))
    try {
      const nextPage = bucket.page + 1
      const items = await fetchStatusPage(status, nextPage)
      setBuckets((prev) => ({
        ...prev,
        [status]: {
          items: [...prev[status].items, ...items],
          page: nextPage,
          hasMore: items.length === PAGE_SIZE,
          loadingMore: false,
        },
      }))
    } catch {
      setBuckets((prev) => ({ ...prev, [status]: { ...prev[status], loadingMore: false } }))
    }
  }

  async function loadMoreCompleted(): Promise<void> {
    await Promise.all([loadMore('SERVED'), loadMore('COMPLETED')])
  }

  async function advance(order: Order): Promise<void> {
    const next = NEXT_STATUS[order.status]
    if (!next) return
    setUpdatingId(order.id)
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      void fetchOrders()
    } finally {
      setUpdatingId(null)
    }
  }

  async function changeStatus(order: Order, targetStatus: string, reason?: string): Promise<void> {
    setUpdatingId(order.id)
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus, ...(reason ? { reason } : {}) }),
      })
      void fetchOrders()
    } finally {
      setUpdatingId(null)
    }
  }

  function handleDrop(targetStatus: 'PENDING' | 'IN_PROGRESS' | 'READY'): void {
    setDragOverStatus(null)
    const order = STATUS_ORDER.flatMap((s) => buckets[s].items).find((o) => o.id === draggingId)
    setDraggingId(null)
    if (!order) return

    const sourceIndex = STATUS_ORDER.indexOf(order.status as (typeof STATUS_ORDER)[number])
    const targetIndex = STATUS_ORDER.indexOf(targetStatus)
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return

    if (targetIndex > sourceIndex) {
      void changeStatus(order, targetStatus)
    } else {
      setMoveBack({ order, targetStatus })
    }
  }

  async function confirmMoveBack(reason: string): Promise<void> {
    if (!moveBack) return
    setMovingBack(true)
    try {
      await changeStatus(moveBack.order, moveBack.targetStatus, reason)
      setMoveBack(null)
    } finally {
      setMovingBack(false)
    }
  }

  const byStatus = (status: 'PENDING' | 'IN_PROGRESS' | 'READY'): Order[] =>
    [...buckets[status].items].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const completed = [...buckets.SERVED.items, ...buckets.COMPLETED.items]
    .filter((o) => new Date(o.updatedAt) >= todayStart)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  const completedHasMore = buckets.SERVED.hasMore || buckets.COMPLETED.hasMore
  const completedLoadingMore = buckets.SERVED.loadingMore || buckets.COMPLETED.loadingMore

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[rgb(var(--df-accent))]/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-[rgb(var(--df-accent))]" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold tracking-tight">Kitchen View</h1>
            <p className="text-[12px] text-[rgb(var(--df-text-3))]">
              {lastRefreshed
                ? `Last updated ${lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
                : 'Loading…'}
            </p>
          </div>
        </div>
        <button
          onClick={() => void fetchOrders()}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 border border-[rgb(var(--df-border))] hover:border-[rgb(var(--df-accent))]/40 rounded-xl text-[12px] text-[rgb(var(--df-text-2))] transition-all disabled:opacity-60"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Kanban columns */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--df-text-3))]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 items-start">
          {ACTIVE_COLUMNS.map((col) => {
            const colOrders = byStatus(col.status)
            const isDragOver = dragOverStatus === col.status
            return (
              <div
                key={col.status}
                className={`flex flex-col gap-3 rounded-2xl transition-colors ${isDragOver ? 'bg-[rgb(var(--df-accent))]/5 ring-2 ring-[rgb(var(--df-accent))]/30' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverStatus(col.status) }}
                onDragLeave={() => setDragOverStatus((s) => (s === col.status ? null : s))}
                onDrop={(e) => { e.preventDefault(); handleDrop(col.status) }}
              >
                <div className="flex items-center justify-between px-1">
                  <span className={`text-[13px] font-bold ${col.accent}`}>{col.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${col.badge}`}>
                    {colOrders.length}
                  </span>
                </div>

                {colOrders.length === 0 && (
                  <div className="bg-[rgb(var(--df-surface))]/40 border border-dashed border-[rgb(var(--df-border))] rounded-2xl py-10 text-center">
                    <p className="text-[12px] text-[rgb(var(--df-text-3))]">No orders</p>
                  </div>
                )}

                {colOrders.map((order) => (
                  <div
                    key={order.id}
                    draggable
                    onDragStart={(e) => { setDraggingId(order.id); e.dataTransfer.effectAllowed = 'move' }}
                    onDragEnd={() => { setDraggingId(null); setDragOverStatus(null) }}
                    className={`bg-[rgb(var(--df-card))] border ${col.cardBorder} rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing transition-opacity ${draggingId === order.id ? 'opacity-40' : ''}`}
                  >
                    <div className="px-4 py-3 border-b border-[rgb(var(--df-border))] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-[rgb(var(--df-accent))]">{order.orderNumber}</span>
                        <span className="flex items-center gap-1 text-[11px] text-[rgb(var(--df-text-2))]">
                          {order.type === 'DINE_IN'
                            ? <><UtensilsCrossed className="w-3 h-3" />{order.tableNumber ? `Table ${order.tableNumber}` : 'Dine In'}</>
                            : <><Package className="w-3 h-3" />Parcel</>
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[rgb(var(--df-text-3))]">
                        <Clock className="w-3 h-3" />
                        <ElapsedTimer createdAt={order.createdAt} />
                      </div>
                    </div>

                    <div className="px-4 py-3 space-y-2">
                      {order.items.map((item, i) => (
                        <div key={i} className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-[rgb(var(--df-text))] leading-tight">{item.name}</p>
                            {item.notes && (
                              <p className="text-[11px] text-[rgb(var(--df-text-3))] mt-0.5 italic">{item.notes}</p>
                            )}
                          </div>
                          <span className="text-[13px] font-bold text-[rgb(var(--df-text))] bg-[rgb(var(--df-surface-2))] px-2 py-0.5 rounded-lg flex-shrink-0">
                            ×{item.quantity}
                          </span>
                        </div>
                      ))}
                      {order.notes && (
                        <p className="text-[11px] text-[rgb(var(--df-text-2))] bg-[rgb(var(--df-surface-2))] rounded-lg px-2.5 py-1.5 mt-1">
                          Note: {order.notes}
                        </p>
                      )}
                    </div>

                    <div className="px-4 pb-3">
                      <button
                        onClick={() => void advance(order)}
                        disabled={updatingId === order.id}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-50 ${
                          col.status === 'PENDING'
                            ? 'bg-yellow-400/15 hover:bg-yellow-400/25 text-yellow-400 border border-yellow-400/25'
                            : col.status === 'IN_PROGRESS'
                            ? 'bg-blue-400/15 hover:bg-blue-400/25 text-blue-400 border border-blue-400/25'
                            : 'bg-green-400/15 hover:bg-green-400/25 text-green-400 border border-green-400/25'
                        }`}
                      >
                        {updatingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                        {NEXT_LABEL[order.status]}
                      </button>
                    </div>
                  </div>
                ))}

                {buckets[col.status].hasMore && (
                  <LoadMoreSentinel onVisible={() => void loadMore(col.status)} loading={buckets[col.status].loadingMore} />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Completed Today bar ─────────────────────────────────────────────── */}
      <div
        className="mt-auto border border-[rgb(var(--df-border))] rounded-2xl bg-[rgb(var(--df-card))] overflow-hidden"
      >
        {/* Summary row — always visible */}
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-400/10 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[rgb(var(--df-text))]">Completed Today</p>
              <p className="text-[11px] text-[rgb(var(--df-text-3))]">
                {completed.length} orders ·{' '}
                {completed.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0)} items
              </p>
            </div>
          </div>

          {/* Mini order pills — last 5 */}
          <div className="hidden sm:flex items-center gap-1.5 flex-1 mx-4 overflow-hidden">
            {completed.slice(0, 5).map((o) => (
              <span
                key={o.id}
                className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
              >
                {o.orderNumber}
              </span>
            ))}
            {completed.length > 5 && (
              <span className="text-[11px] text-[rgb(var(--df-text-3))] shrink-0">+{completed.length - 5} more</span>
            )}
          </div>

          <button
            onClick={() => setShowCompleted(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 border border-emerald-400/25 transition-colors shrink-0"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            View All
          </button>
        </div>
      </div>

      {/* Modal */}
      {showCompleted && (
        <CompletedModal
          orders={completed}
          onClose={() => setShowCompleted(false)}
          hasMore={completedHasMore}
          loadingMore={completedLoadingMore}
          onLoadMore={() => void loadMoreCompleted()}
        />
      )}

      {moveBack && (
        <MoveBackModal
          order={moveBack.order}
          targetLabel={ACTIVE_COLUMNS.find((c) => c.status === moveBack.targetStatus)?.label ?? moveBack.targetStatus}
          submitting={movingBack}
          onCancel={() => setMoveBack(null)}
          onConfirm={(reason) => void confirmMoveBack(reason)}
        />
      )}
    </div>
  )
}
