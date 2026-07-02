'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { useCurrency } from '@/hooks/useCurrency'
import {
  Search, Plus, Loader2, Users, X,
  UtensilsCrossed, Package, ShoppingBag, TrendingUp, Clock,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Customer {
  id: string
  name: string
  phone: string
  email: string | null
  totalOrders: number
  totalSpent: number
  lastVisitAt: string | null
  createdAt: string
}

interface OrderItem { name: string; quantity: number; total: number }
interface CustomerOrder {
  id: string
  orderNumber: string
  type: 'DINE_IN' | 'PARCEL' | 'DELIVERY'
  status: string
  paymentStatus: string
  paymentMethod: string | null
  grandTotal: number
  tableNumber: string | null
  createdAt: string
  items: OrderItem[]
}

interface CustomerDetail {
  customer: Customer
  orders: CustomerOrder[]
  totalSpent: number
}

// ── Customer Detail Modal ─────────────────────────────────────────────────────

function CustomerModal({
  customerId,
  onClose,
}: {
  customerId: string
  onClose: () => void
}): React.JSX.Element {
  const { format: fmt } = useCurrency()
  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/customers/${customerId}`)
        const data = (await res.json()) as CustomerDetail
        setDetail(data)
      } finally {
        setLoading(false)
      }
    })()
  }, [customerId])

  const c = detail?.customer
  const orders = detail?.orders ?? []
  const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID')

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgb(var(--df-border))]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[rgb(var(--df-accent))]/15 flex items-center justify-center text-[16px] font-bold text-[rgb(var(--df-accent))]">
              {c?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-[14px] font-bold text-[rgb(var(--df-text))]">{c?.name ?? '…'}</p>
              <p className="text-[12px] text-[rgb(var(--df-text-3))]">{c?.phone}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-3))] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--df-text-3))]" />
          </div>
        ) : (
          <>
            {/* Stats strip */}
            <div className="grid grid-cols-3 divide-x divide-[rgb(var(--df-border))] border-b border-[rgb(var(--df-border))]">
              {[
                {
                  icon: <ShoppingBag className="w-4 h-4 text-[rgb(var(--df-accent))]" />,
                  label: 'Total Orders',
                  value: orders.length.toString(),
                },
                {
                  icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
                  label: 'Total Spent',
                  value: fmt(detail?.totalSpent ?? 0),
                },
                {
                  icon: <Clock className="w-4 h-4 text-blue-400" />,
                  label: 'Last Visit',
                  value: c?.lastVisitAt
                    ? new Date(c.lastVisitAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                    : '—',
                },
              ].map((s) => (
                <div key={s.label} className="px-4 py-3 flex flex-col items-center gap-1">
                  {s.icon}
                  <p className="text-[16px] font-bold text-[rgb(var(--df-text))]">{s.value}</p>
                  <p className="text-[10px] text-[rgb(var(--df-text-3))] uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Paid vs unpaid note */}
            {orders.length > paidOrders.length && (
              <div className="px-5 py-2.5 bg-amber-400/5 border-b border-[rgb(var(--df-border))]">
                <p className="text-[11px] text-amber-400">
                  {orders.length - paidOrders.length} order{orders.length - paidOrders.length > 1 ? 's' : ''} pending payment
                </p>
              </div>
            )}

            {/* Order list */}
            <div className="overflow-y-auto flex-1 divide-y divide-[rgb(var(--df-border))]">
              {orders.length === 0 ? (
                <div className="py-14 flex flex-col items-center gap-3 text-[rgb(var(--df-text-3))]">
                  <ShoppingBag className="w-10 h-10 opacity-30" />
                  <p className="text-[13px]">No orders yet</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="px-5 py-3.5 hover:bg-[rgb(var(--df-surface-2))]/40 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Order number + type + status */}
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className="text-[13px] font-bold text-[rgb(var(--df-accent))]">{order.orderNumber}</span>
                          <span className="flex items-center gap-1 text-[11px] text-[rgb(var(--df-text-3))]">
                            {order.type === 'DINE_IN'
                              ? <><UtensilsCrossed className="w-3 h-3" />{order.tableNumber ? `Table ${order.tableNumber}` : 'Dine In'}</>
                              : <><Package className="w-3 h-3" />Parcel</>
                            }
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            order.paymentStatus === 'PAID'
                              ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                              : 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                          }`}>
                            {order.paymentStatus === 'PAID' ? `Paid · ${order.paymentMethod ?? 'CASH'}` : 'Unpaid'}
                          </span>
                        </div>

                        {/* Items */}
                        <div className="flex flex-wrap gap-1">
                          {order.items.map((item, i) => (
                            <span key={i} className="text-[11px] bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-2))] px-2 py-0.5 rounded-md">
                              {item.name} ×{item.quantity}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Amount + date */}
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-bold text-[rgb(var(--df-text))]">{fmt(order.grandTotal)}</p>
                        <p className="text-[10px] text-[rgb(var(--df-text-3))] mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {c?.email && (
              <div className="px-5 py-3 border-t border-[rgb(var(--df-border))]">
                <p className="text-[11px] text-[rgb(var(--df-text-3))]">Email: <span className="text-[rgb(var(--df-text-2))]">{c.email}</span></p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CustomersPage(): React.JSX.Element {
  const { format: fmt } = useCurrency()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchCustomers = useCallback(async (q?: string): Promise<void> => {
    setLoading(true)
    try {
      const url = new URL('/api/customers', window.location.origin)
      if (q) url.searchParams.set('q', q)
      const res = await fetch(url.toString())
      const data = (await res.json()) as { customers: Customer[] }
      setCustomers(data.customers)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchCustomers() }, [fetchCustomers])

  useEffect(() => {
    const t = setTimeout(() => void fetchCustomers(search || undefined), 300)
    return () => clearTimeout(t)
  }, [search, fetchCustomers])

  async function createCustomer(): Promise<void> {
    if (!form.name || !form.phone) { setFormError('Name and phone required'); return }
    setSaving(true)
    setFormError('')
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = (await res.json()) as { customer?: Customer; error?: string }
      if (!res.ok) { setFormError(data.error ?? 'Failed'); return }
      setCustomers((prev) => [{ ...data.customer!, totalOrders: 0, totalSpent: 0, lastVisitAt: null }, ...prev])
      setShowForm(false)
      setForm({ name: '', phone: '', email: '' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <PageHeader title="Customers" subtitle="Manage customer profiles and history" />

      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--df-text-3))]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            className="w-full pl-9 pr-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))]"
          />
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-xl text-[13px] font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Add customer form */}
      {showForm && (
        <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-accent))]/30 rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[14px]">New Customer</h3>
            <button onClick={() => setShowForm(false)} className="text-[rgb(var(--df-text-3))] hover:text-[rgb(var(--df-text))]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: 'name', label: 'Name *', type: 'text' },
              { key: 'phone', label: 'Phone *', type: 'tel' },
              { key: 'email', label: 'Email', type: 'email' },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))]"
                />
              </div>
            ))}
          </div>
          {formError && <p className="text-[12px] text-red-400 mt-2">{formError}</p>}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => void createCustomer()}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-lg text-[13px] font-medium transition-all disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-[13px] text-[rgb(var(--df-text-2))] hover:text-[rgb(var(--df-text))] transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--df-text-3))]" />
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--df-surface-2))] flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-[rgb(var(--df-text-3))]" />
          </div>
          <p className="text-[14px] font-medium">No customers yet</p>
          <p className="text-[12px] text-[rgb(var(--df-text-2))] mt-1">Add customers manually or they are created during order flow</p>
        </div>
      ) : (
        <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_80px_120px] gap-4 px-4 py-2.5 border-b border-[rgb(var(--df-border))] text-[11px] font-semibold text-[rgb(var(--df-text-3))] uppercase tracking-wide">
            <span>Customer</span>
            <span>Phone</span>
            <span>Email</span>
            <span className="text-right">Orders</span>
            <span className="text-right">Total Spent</span>
          </div>
          {customers.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className="w-full grid grid-cols-[2fr_1fr_1fr_80px_120px] gap-4 px-4 py-3.5 items-center border-b border-[rgb(var(--df-border))] last:border-b-0 hover:bg-[rgb(var(--df-surface-2))]/50 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 shrink-0 rounded-full bg-[rgb(var(--df-accent))]/15 flex items-center justify-center text-[12px] font-bold text-[rgb(var(--df-accent))]">
                  {c.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[rgb(var(--df-text))] truncate">{c.name}</p>
                  {c.lastVisitAt && (
                    <p className="text-[11px] text-[rgb(var(--df-text-3))]">
                      Last: {new Date(c.lastVisitAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-[13px] text-[rgb(var(--df-text-2))]">{c.phone}</p>
              <p className="text-[13px] text-[rgb(var(--df-text-2))] truncate">{c.email ?? '—'}</p>
              <div className="text-right">
                <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-bold ${
                  c.totalOrders > 0
                    ? 'bg-[rgb(var(--df-accent))]/15 text-[rgb(var(--df-accent))]'
                    : 'bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-3))]'
                }`}>
                  {c.totalOrders}
                </span>
              </div>
              <p className={`text-[13px] font-semibold text-right ${c.totalSpent > 0 ? 'text-emerald-400' : 'text-[rgb(var(--df-text-3))]'}`}>
                {fmt(c.totalSpent)}
              </p>
            </button>
          ))}
        </div>
      )}

      {/* Customer detail modal */}
      {selectedId && (
        <CustomerModal customerId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  )
}
