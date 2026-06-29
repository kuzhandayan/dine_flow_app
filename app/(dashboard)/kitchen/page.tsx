'use client'

import { useState, useEffect, useCallback } from 'react'
import { UtensilsCrossed, Package, Clock, RefreshCw, Loader2, ChevronRight, Flame } from 'lucide-react'

interface OrderItem { name: string; quantity: number; notes: string | null }

interface Order {
  id: string
  orderNumber: string
  type: 'DINE_IN' | 'PARCEL' | 'DELIVERY'
  status: 'PENDING' | 'IN_PROGRESS' | 'READY'
  tableNumber: string | null
  notes: string | null
  createdAt: string
  customer: { name: string }
  items: OrderItem[]
}

const COLUMNS: { status: Order['status']; label: string; accent: string; cardBorder: string; badge: string }[] = [
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

function elapsed(createdAt: string): string {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
}

function ElapsedTimer({ createdAt }: { createdAt: string }): React.JSX.Element {
  const [, tick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  const urgent = diff > 600 // > 10 min
  const warning = diff > 300 // > 5 min
  return (
    <span className={`text-[11px] font-mono font-medium ${urgent ? 'text-red-400' : warning ? 'text-yellow-400' : 'text-[rgb(var(--df-text-3))]'}`}>
      {elapsed(createdAt)}
    </span>
  )
}

export default function KitchenPage(): React.JSX.Element {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

  const fetchOrders = useCallback(async (): Promise<void> => {
    try {
      const [pending, inProgress, ready] = await Promise.all([
        fetch('/api/orders?status=PENDING').then((r) => r.json() as Promise<{ orders: Order[] }>),
        fetch('/api/orders?status=IN_PROGRESS').then((r) => r.json() as Promise<{ orders: Order[] }>),
        fetch('/api/orders?status=READY').then((r) => r.json() as Promise<{ orders: Order[] }>),
      ])
      setOrders([
        ...(pending.orders ?? []),
        ...(inProgress.orders ?? []),
        ...(ready.orders ?? []),
      ])
      setLastRefreshed(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial load
  useEffect(() => { void fetchOrders() }, [fetchOrders])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(() => void fetchOrders(), 30000)
    return () => clearInterval(id)
  }, [fetchOrders])

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

  const byStatus = (status: Order['status']): Order[] =>
    orders
      .filter((o) => o.status === status)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[rgb(var(--df-accent))]/10 flex items-center justify-center">
            <Flame className="w-5 h-5 text-[rgb(var(--df-accent))]" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold tracking-tight">Kitchen View</h1>
            <p className="text-[12px] text-[rgb(var(--df-text-3))]">
              Last updated {lastRefreshed.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              &nbsp;· auto-refreshes every 30s
            </p>
          </div>
        </div>
        <button
          onClick={() => void fetchOrders()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 border border-[rgb(var(--df-border))] hover:border-[rgb(var(--df-accent))]/40 rounded-xl text-[12px] text-[rgb(var(--df-text-2))] transition-all"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
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
          {COLUMNS.map((col) => {
            const colOrders = byStatus(col.status)
            return (
              <div key={col.status} className="flex flex-col gap-3">
                {/* Column header */}
                <div className="flex items-center justify-between px-1">
                  <span className={`text-[13px] font-bold ${col.accent}`}>{col.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${col.badge}`}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Empty state */}
                {colOrders.length === 0 && (
                  <div className="bg-[rgb(var(--df-surface))]/40 border border-dashed border-[rgb(var(--df-border))] rounded-2xl py-10 text-center">
                    <p className="text-[12px] text-[rgb(var(--df-text-3))]">No orders</p>
                  </div>
                )}

                {/* Order cards */}
                {colOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`bg-[rgb(var(--df-card))] border ${col.cardBorder} rounded-2xl overflow-hidden`}
                  >
                    {/* Card header */}
                    <div className="px-4 py-3 border-b border-[rgb(var(--df-border))] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-[rgb(var(--df-accent))]">
                          {order.orderNumber}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-[rgb(var(--df-text-2))]">
                          {order.type === 'DINE_IN'
                            ? <><UtensilsCrossed className="w-3 h-3" /> {order.tableNumber ? `Table ${order.tableNumber}` : 'Dine In'}</>
                            : <><Package className="w-3 h-3" /> Parcel</>
                          }
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[rgb(var(--df-text-3))]">
                        <Clock className="w-3 h-3" />
                        <ElapsedTimer createdAt={order.createdAt} />
                      </div>
                    </div>

                    {/* Items */}
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

                    {/* Action */}
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
                        {updatingId === order.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <ChevronRight className="w-4 h-4" />
                        }
                        {NEXT_LABEL[order.status]}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
