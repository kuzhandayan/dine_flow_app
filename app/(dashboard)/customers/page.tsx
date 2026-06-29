'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Search, Plus, Loader2, Users, X } from 'lucide-react'

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

export default function CustomersPage(): React.JSX.Element {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

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

  useEffect(() => {
    void fetchCustomers()
  }, [fetchCustomers])

  useEffect(() => {
    const t = setTimeout(() => void fetchCustomers(search || undefined), 300)
    return () => clearTimeout(t)
  }, [search, fetchCustomers])

  async function createCustomer(): Promise<void> {
    if (!form.name || !form.phone) { setError('Name and phone required'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = (await res.json()) as { customer?: Customer; error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      setCustomers((prev) => [data.customer!, ...prev])
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
            <div>
              <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">Phone *</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">Email</label>
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                type="email"
                className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))]"
              />
            </div>
          </div>
          {error && <p className="text-[12px] text-red-400 mt-2">{error}</p>}
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
          <div className="grid grid-cols-[1.5fr_1fr_1fr_auto_auto] gap-4 px-4 py-2.5 border-b border-[rgb(var(--df-border))] text-[11px] font-medium text-[rgb(var(--df-text-3))] uppercase tracking-wide">
            <span>Customer</span>
            <span>Phone</span>
            <span>Email</span>
            <span>Orders</span>
            <span>Total Spent</span>
          </div>
          {customers.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[1.5fr_1fr_1fr_auto_auto] gap-4 px-4 py-3.5 items-center border-b border-[rgb(var(--df-border))] last:border-b-0"
            >
              <div>
                <p className="text-[13px] font-medium text-[rgb(var(--df-text))]">{c.name}</p>
                {c.lastVisitAt && (
                  <p className="text-[11px] text-[rgb(var(--df-text-3))]">
                    Last visit: {new Date(c.lastVisitAt).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>
              <p className="text-[13px] text-[rgb(var(--df-text-2))]">{c.phone}</p>
              <p className="text-[13px] text-[rgb(var(--df-text-2))]">{c.email ?? '—'}</p>
              <p className="text-[13px] text-[rgb(var(--df-text))]">{c.totalOrders}</p>
              <p className="text-[13px] font-medium text-[rgb(var(--df-text))]">₹{c.totalSpent.toFixed(0)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
