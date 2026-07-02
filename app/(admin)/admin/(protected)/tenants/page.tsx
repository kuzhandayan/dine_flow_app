'use client'

import { useState, useEffect } from 'react'
import {
  Store, Users, ShoppingCart, TrendingUp, Search,
  X, CheckCircle2, XCircle, Clock, CreditCard,
  Phone, Mail, MapPin, Hash, UtensilsCrossed,
  Calendar, Package, PauseCircle, PlayCircle, Loader2, Plus,
} from 'lucide-react'

interface Subscription {
  type: string
  status: string
  expiresAt: string | null
}

interface Tenant {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  address: string | null
  gstin: string | null
  currency: string
  isActive: boolean
  isSuspended: boolean
  createdAt: string
  staffCount: number
  totalOrders: number
  customerCount: number
  menuItemCount: number
  totalRevenue: number
  paidOrders: number
  subscription: Subscription | null
}

function fmt(n: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

function subStatusColor(sub: Subscription | null): string {
  if (!sub) return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
  if (sub.status === 'ACTIVE') return 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
  if (sub.status === 'EXPIRED') return 'bg-red-400/10 text-red-400 border-red-400/20'
  return 'bg-amber-400/10 text-amber-400 border-amber-400/20'
}

const SUB_TYPES = ['LIFETIME', 'DURATION']
const SUB_STATUSES = ['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CLOSED']

// ── Create Restaurant Modal ───────────────────────────────────────────────────

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (t: Tenant) => void }): React.JSX.Element {
  const [form, setForm] = useState({ restaurantName: '', ownerName: '', email: '', password: '', phone: '', gstin: '', address: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPwd, setShowPwd] = useState(false)

  function set(field: string, value: string): void {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: form.restaurantName,
          ownerName: form.ownerName,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          gstin: form.gstin || undefined,
          address: form.address || undefined,
        }),
      })
      const data = (await res.json()) as { tenant?: { id: string; name: string; slug: string }; error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed to create restaurant'); return }
      onCreated({
        id: data.tenant!.id,
        name: form.restaurantName,
        slug: data.tenant!.slug,
        email: form.email,
        phone: form.phone || null,
        address: form.address || null,
        gstin: form.gstin || null,
        currency: 'INR',
        isActive: true,
        isSuspended: false,
        createdAt: new Date().toISOString(),
        staffCount: 1,
        totalOrders: 0,
        customerCount: 0,
        menuItemCount: 2,
        totalRevenue: 0,
        paidOrders: 0,
        subscription: { type: 'LIFETIME', status: 'ACTIVE', expiresAt: null },
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--df-accent))]/60 text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))] transition-colors'
  const labelCls = 'block text-[11px] font-semibold text-[rgb(var(--df-text-3))] uppercase tracking-wider mb-1.5'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[rgb(var(--df-border))]">
          <div>
            <h2 className="text-[16px] font-bold text-[rgb(var(--df-text))]">New Restaurant</h2>
            <p className="text-[12px] text-[rgb(var(--df-text-3))] mt-0.5">Create a tenant and owner account</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-3))] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Restaurant Name *</label>
              <input required value={form.restaurantName} onChange={(e) => set('restaurantName', e.target.value)} placeholder="Spice Garden" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Owner Name *</label>
              <input required value={form.ownerName} onChange={(e) => set('ownerName', e.target.value)} placeholder="John Doe" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Owner Email *</label>
            <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="owner@restaurant.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Password *</label>
            <div className="relative">
              <input required type={showPwd ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min 6 characters" className={inputCls + ' pr-10'} />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--df-text-3))] text-[11px] font-medium hover:text-[rgb(var(--df-text-2))]">
                {showPwd ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Phone</label>
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="9999999999" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>GSTIN</label>
              <input value={form.gstin} onChange={(e) => set('gstin', e.target.value)} placeholder="22AAAAA0000A1Z5" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Address</label>
            <input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street, City, State" className={inputCls} />
          </div>

          {error && <p className="text-[12px] text-red-400 bg-red-500/10 px-3 py-2 rounded-xl">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-[13px] font-semibold border border-[rgb(var(--df-border))] text-[rgb(var(--df-text-2))] hover:bg-[rgb(var(--df-surface-2))] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white transition-colors disabled:opacity-50">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create Restaurant
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function TenantModal({
  tenant: initial,
  onClose,
  onUpdated,
}: {
  tenant: Tenant
  onClose: () => void
  onUpdated: (t: Tenant) => void
}): React.JSX.Element {
  const [tenant, setTenant] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [subType, setSubType] = useState(tenant.subscription?.type ?? 'TRIAL')
  const [subStatus, setSubStatus] = useState(tenant.subscription?.status ?? 'ACTIVE')
  const [expiresAt, setExpiresAt] = useState(
    tenant.subscription?.expiresAt ? tenant.subscription.expiresAt.slice(0, 10) : ''
  )

  async function patch(payload: Record<string, unknown>): Promise<void> {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const updated = { ...tenant, ...payload } as Tenant
        setTenant(updated)
        onUpdated(updated)
      }
    } finally {
      setSaving(false)
    }
  }

  async function saveSubscription(): Promise<void> {
    await patch({
      subscription: {
        type: subType,
        status: subStatus,
        endDate: expiresAt || null,
      },
    })
  }

  const sub = tenant.subscription

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-[rgb(var(--df-border))]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--df-accent))]/15 flex items-center justify-center text-[20px] font-bold text-[rgb(var(--df-accent))]">
              {tenant.name[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-[16px] font-bold text-[rgb(var(--df-text))]">{tenant.name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  tenant.isSuspended
                    ? 'bg-red-400/10 text-red-400 border-red-400/20'
                    : tenant.isActive
                    ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                    : 'bg-gray-400/10 text-gray-400 border-gray-400/20'
                }`}>
                  {tenant.isSuspended ? 'Suspended' : tenant.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-[12px] text-[rgb(var(--df-text-3))] mt-0.5">/{tenant.slug}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-3))] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-[rgb(var(--df-border))] border-b border-[rgb(var(--df-border))]">
          {[
            { icon: <TrendingUp className="w-4 h-4 text-[rgb(var(--df-accent))]" />, label: 'Revenue', value: fmt(tenant.totalRevenue, tenant.currency) },
            { icon: <ShoppingCart className="w-4 h-4 text-blue-400" />, label: 'Total Orders', value: tenant.totalOrders.toString() },
            { icon: <Users className="w-4 h-4 text-purple-400" />, label: 'Customers', value: tenant.customerCount.toString() },
            { icon: <UtensilsCrossed className="w-4 h-4 text-amber-400" />, label: 'Menu Items', value: tenant.menuItemCount.toString() },
          ].map((s) => (
            <div key={s.label} className="px-4 py-4 flex flex-col items-center gap-1">
              {s.icon}
              <p className="text-[18px] font-bold text-[rgb(var(--df-text))]">{s.value}</p>
              <p className="text-[10px] text-[rgb(var(--df-text-3))] uppercase tracking-wide">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="px-6 py-5 space-y-5">

          {/* Access control */}
          <div>
            <p className="text-[11px] font-semibold text-[rgb(var(--df-text-3))] uppercase tracking-wider mb-3">Access Control</p>
            <div className="flex gap-2 flex-wrap">
              {/* Suspend / Activate toggle */}
              {tenant.isSuspended ? (
                <button
                  onClick={() => void patch({ isSuspended: false, isActive: true })}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 border border-emerald-400/25 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                  Restore Access
                </button>
              ) : (
                <button
                  onClick={() => void patch({ isSuspended: true })}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 border border-amber-400/25 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <PauseCircle className="w-4 h-4" />}
                  Suspend Access
                </button>
              )}

              {/* Deactivate / Activate */}
              {tenant.isActive ? (
                <button
                  onClick={() => void patch({ isActive: false })}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold bg-red-400/10 hover:bg-red-400/20 text-red-400 border border-red-400/25 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => void patch({ isActive: true, isSuspended: false })}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-400 border border-emerald-400/25 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Activate
                </button>
              )}
            </div>
            <p className="text-[11px] text-[rgb(var(--df-text-3))] mt-2">
              {tenant.isSuspended
                ? 'Restaurant is suspended — staff cannot log in or take orders.'
                : tenant.isActive
                ? 'Restaurant is active and fully operational.'
                : 'Restaurant is deactivated — no access allowed.'}
            </p>
          </div>

          {/* Subscription management */}
          <div>
            <p className="text-[11px] font-semibold text-[rgb(var(--df-text-3))] uppercase tracking-wider mb-3">Subscription</p>
            <div className="bg-[rgb(var(--df-surface-2))]/50 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">Plan Type</label>
                  <select
                    value={subType}
                    onChange={(e) => setSubType(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))]/60 text-[rgb(var(--df-text))]"
                  >
                    {SUB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">Status</label>
                  <select
                    value={subStatus}
                    onChange={(e) => setSubStatus(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))]/60 text-[rgb(var(--df-text))]"
                  >
                    {SUB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">Valid Till (leave empty for lifetime)</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))]/60 text-[rgb(var(--df-text))]"
                />
              </div>
              <button
                onClick={() => void saveSubscription()}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Subscription
              </button>
            </div>
            {sub && (
              <p className="text-[11px] text-[rgb(var(--df-text-3))] mt-2">
                Current: <strong className="text-[rgb(var(--df-text-2))]">{sub.type}</strong> · {sub.status}
                {sub.expiresAt && ` · Expires ${new Date(sub.expiresAt).toLocaleDateString('en-IN')}`}
              </p>
            )}
          </div>

          {/* Contact details */}
          <div>
            <p className="text-[11px] font-semibold text-[rgb(var(--df-text-3))] uppercase tracking-wider mb-3">Contact & Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { icon: <Mail className="w-3.5 h-3.5" />, label: 'Email', value: tenant.email ?? '—' },
                { icon: <Phone className="w-3.5 h-3.5" />, label: 'Phone', value: tenant.phone ?? '—' },
                { icon: <Hash className="w-3.5 h-3.5" />, label: 'GSTIN', value: tenant.gstin ?? '—' },
                { icon: <CreditCard className="w-3.5 h-3.5" />, label: 'Currency', value: tenant.currency },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-2.5 bg-[rgb(var(--df-surface-2))]/50 px-3 py-2.5 rounded-xl">
                  <span className="text-[rgb(var(--df-text-3))]">{f.icon}</span>
                  <div>
                    <p className="text-[10px] text-[rgb(var(--df-text-3))] uppercase tracking-wide">{f.label}</p>
                    <p className="text-[13px] text-[rgb(var(--df-text-2))] font-medium">{f.value}</p>
                  </div>
                </div>
              ))}
              {tenant.address && (
                <div className="flex items-start gap-2.5 bg-[rgb(var(--df-surface-2))]/50 px-3 py-2.5 rounded-xl sm:col-span-2">
                  <MapPin className="w-3.5 h-3.5 text-[rgb(var(--df-text-3))] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-[rgb(var(--df-text-3))] uppercase tracking-wide">Address</p>
                    <p className="text-[13px] text-[rgb(var(--df-text-2))]">{tenant.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 text-[11px] text-[rgb(var(--df-text-3))] pt-1 border-t border-[rgb(var(--df-border))]">
            <Calendar className="w-3.5 h-3.5" />
            Registered: {new Date(tenant.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            <span className="mx-2">·</span>
            <Package className="w-3.5 h-3.5" />
            {tenant.staffCount} staff
            <span className="mx-2">·</span>
            {tenant.paidOrders} paid orders
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RestaurantsPage(): React.JSX.Element {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Tenant | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/tenants')
        const data = (await res.json()) as { tenants?: Tenant[]; error?: string }
        if (!res.ok) {
          setError(data.error ?? 'Failed to load restaurants')
          return
        }
        setTenants(data.tenants ?? [])
      } catch {
        setError('Network error — please refresh')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  function handleCreated(t: Tenant): void {
    setTenants((prev) => [t, ...prev])
  }

  function handleUpdated(updated: Tenant): void {
    setTenants((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t))
    setSelected((prev) => prev?.id === updated.id ? { ...prev, ...updated } : prev)
  }

  const filtered = tenants.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (t.phone ?? '').includes(search)
  )

  const totalRevenue = tenants.reduce((s, t) => s + t.totalRevenue, 0)
  const activeCount = tenants.filter((t) => t.isActive && !t.isSuspended).length

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-[22px] font-bold tracking-tight mb-4">Restaurants</h1>
        <div className="bg-red-400/10 border border-red-400/20 rounded-2xl px-5 py-4 text-red-400 text-[13px]">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Restaurants</h1>
          <p className="text-[13px] text-[rgb(var(--df-text-3))] mt-0.5">All registered tenants on DineFlow</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-xl text-[13px] font-semibold transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Restaurant
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Restaurants', value: tenants.length.toString(), icon: <Store className="w-4 h-4" />, color: 'bg-[rgb(var(--df-accent))]/15 text-[rgb(var(--df-accent))]' },
          { label: 'Active', value: activeCount.toString(), icon: <CheckCircle2 className="w-4 h-4" />, color: 'bg-emerald-400/15 text-emerald-400' },
          { label: 'Platform Revenue', value: fmt(totalRevenue), icon: <TrendingUp className="w-4 h-4" />, color: 'bg-blue-400/15 text-blue-400' },
          { label: 'Total Orders', value: tenants.reduce((s, t) => s + t.totalOrders, 0).toString(), icon: <ShoppingCart className="w-4 h-4" />, color: 'bg-purple-400/15 text-purple-400' },
        ].map((s) => (
          <div key={s.label} className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-4">
            <div className="flex items-start justify-between mb-2">
              <p className="text-[11px] font-semibold text-[rgb(var(--df-text-3))] uppercase tracking-wider">{s.label}</p>
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</span>
            </div>
            <p className="text-[22px] font-bold text-[rgb(var(--df-text))]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--df-text-3))]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone…"
          className="w-full pl-9 pr-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl focus:outline-none focus:border-[rgb(var(--df-accent))]/60 text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))]"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-[rgb(var(--df-accent))] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-[rgb(var(--df-text-3))]">
          <Store className="w-10 h-10 opacity-30 mx-auto mb-3" />
          <p className="text-[14px]">{search ? 'No restaurants match your search' : 'No restaurants registered yet'}</p>
        </div>
      ) : (
        <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] gap-4 px-5 py-3 border-b border-[rgb(var(--df-border))] text-[11px] font-semibold text-[rgb(var(--df-text-3))] uppercase tracking-wide">
            <span>Restaurant</span>
            <span>Contact</span>
            <span className="text-right">Revenue</span>
            <span className="text-right">Orders</span>
            <span className="text-center">Subscription</span>
            <span className="text-center">Status</span>
          </div>

          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t)}
              className="w-full grid grid-cols-[2fr_1fr_1fr_1fr_1fr_100px] gap-4 px-5 py-4 items-center border-b border-[rgb(var(--df-border))] last:border-b-0 hover:bg-[rgb(var(--df-surface-2))]/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[rgb(var(--df-accent))]/15 flex items-center justify-center text-[13px] font-bold text-[rgb(var(--df-accent))] shrink-0">
                  {t.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[rgb(var(--df-text))] truncate">{t.name}</p>
                  <p className="text-[11px] text-[rgb(var(--df-text-3))] truncate">/{t.slug}</p>
                </div>
              </div>
              <div className="min-w-0">
                <p className="text-[12px] text-[rgb(var(--df-text-2))] truncate">{t.email ?? '—'}</p>
                <p className="text-[11px] text-[rgb(var(--df-text-3))]">{t.phone ?? '—'}</p>
              </div>
              <p className="text-[13px] font-semibold text-emerald-400 text-right">{fmt(t.totalRevenue, t.currency)}</p>
              <div className="text-right">
                <p className="text-[13px] font-semibold text-[rgb(var(--df-text))]">{t.totalOrders}</p>
                <p className="text-[11px] text-[rgb(var(--df-text-3))]">{t.paidOrders} paid</p>
              </div>
              <div className="flex justify-center">
                {t.subscription ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${subStatusColor(t.subscription)}`}>
                    {t.subscription.type}
                  </span>
                ) : (
                  <span className="text-[11px] text-[rgb(var(--df-text-3))]">None</span>
                )}
              </div>
              <div className="flex justify-center">
                {t.isSuspended ? (
                  <span className="flex items-center gap-1 text-[11px] text-amber-400"><PauseCircle className="w-3.5 h-3.5" />Suspended</span>
                ) : t.isActive ? (
                  <span className="flex items-center gap-1 text-[11px] text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" />Active</span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-gray-400"><Clock className="w-3.5 h-3.5" />Inactive</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <TenantModal
          tenant={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
