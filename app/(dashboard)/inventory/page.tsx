'use client'

import { useState, useEffect, useCallback } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Plus, Loader2, AlertTriangle, X, Pencil, Trash2, Package } from 'lucide-react'
import { useConfirm } from '@/components/shared/ConfirmDialog'
import { useToast } from '@/components/providers/ToastProvider'

interface InventoryItem {
  id: string
  name: string
  unit: string
  quantity: number
  minStockLevel: number
  costPerUnit: number
  supplier: string | null
  lastRestockedAt: string | null
}

const UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'dozen', 'packet', 'bottle', 'box']

const emptyForm = { name: '', unit: 'kg', quantity: '0', minStockLevel: '0', costPerUnit: '0', supplier: '' }

export default function InventoryPage(): React.JSX.Element {
  const { confirm } = useConfirm()
  const toast = useToast()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchItems = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const res = await fetch('/api/inventory')
      const data = (await res.json()) as { items: InventoryItem[] }
      setItems(data.items ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchItems() }, [fetchItems])

  function openAdd(): void {
    setEditId(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  function openEdit(item: InventoryItem): void {
    setEditId(item.id)
    setForm({
      name: item.name,
      unit: item.unit,
      quantity: String(item.quantity),
      minStockLevel: String(item.minStockLevel),
      costPerUnit: String(item.costPerUnit),
      supplier: item.supplier ?? '',
    })
    setError('')
    setShowForm(true)
  }

  async function save(): Promise<void> {
    if (!form.name || !form.unit) { setError('Name and unit required'); return }
    setSaving(true); setError('')
    try {
      const body = {
        name: form.name,
        unit: form.unit,
        quantity: Number(form.quantity),
        minStockLevel: Number(form.minStockLevel),
        costPerUnit: Number(form.costPerUnit),
        supplier: form.supplier || null,
      }
      const res = await fetch(editId ? `/api/inventory/${editId}` : '/api/inventory', {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { item?: InventoryItem; error?: string }
      if (!res.ok) { setError(data.error ?? 'Failed'); return }
      toast.success(editId ? 'Item updated' : 'Item added', form.name)
      setShowForm(false)
      void fetchItems()
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(id: string, name: string): Promise<void> {
    const ok = await confirm({ title: 'Delete Inventory Item', message: `"${name}" will be permanently removed.`, confirmLabel: 'Delete', variant: 'danger' })
    if (!ok) return
    setDeletingId(id)
    try {
      await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
      toast.success('Item deleted', name)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Track stock levels and restock alerts" />

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-[12px] text-[rgb(var(--df-text-2))]">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-400 font-medium">{items.filter((i) => i.quantity <= i.minStockLevel).length}</span>
          &nbsp;items need restocking
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-xl text-[13px] font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-accent))]/30 rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[14px]">{editId ? 'Edit Item' : 'New Inventory Item'}</h3>
            <button onClick={() => setShowForm(false)} className="text-[rgb(var(--df-text-3))] hover:text-[rgb(var(--df-text))]"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">Item Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))]" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">Unit *</label>
              <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))]">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">Current Qty</label>
              <input type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))]" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">Min Stock Level</label>
              <input type="number" min="0" step="0.01" value={form.minStockLevel} onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })}
                className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))]" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">Cost / Unit (₹)</label>
              <input type="number" min="0" step="0.01" value={form.costPerUnit} onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })}
                className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))]" />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[rgb(var(--df-text-2))] mb-1">Supplier</label>
              <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                placeholder="Optional"
                className="w-full px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))]" />
            </div>
          </div>
          {error && <p className="text-[12px] text-red-400 mt-2">{error}</p>}
          <div className="flex gap-2 mt-4">
            <button onClick={() => void save()} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-lg text-[13px] font-medium disabled:opacity-50 transition-all">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-[13px] text-[rgb(var(--df-text-2))] hover:text-[rgb(var(--df-text))]">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--df-text-3))]" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--df-surface-2))] flex items-center justify-center mx-auto mb-4">
            <Package className="w-6 h-6 text-[rgb(var(--df-text-3))]" />
          </div>
          <p className="text-[14px] font-medium">No inventory items</p>
          <p className="text-[12px] text-[rgb(var(--df-text-2))] mt-1">Add ingredients and supplies to track stock</p>
        </div>
      ) : (
        <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl overflow-hidden">
          <div className="grid grid-cols-[1.5fr_auto_auto_auto_1fr_auto] gap-4 px-4 py-2.5 border-b border-[rgb(var(--df-border))] text-[11px] font-medium text-[rgb(var(--df-text-3))] uppercase tracking-wide">
            <span>Item</span><span>Unit</span><span>Qty</span><span>Min</span><span>Supplier</span><span></span>
          </div>
          {items.map((item) => {
            const low = item.quantity <= item.minStockLevel
            return (
              <div key={item.id} className={`grid grid-cols-[1.5fr_auto_auto_auto_1fr_auto] gap-4 px-4 py-3.5 items-center border-b border-[rgb(var(--df-border))] last:border-b-0 ${low ? 'bg-yellow-400/5' : ''}`}>
                <div className="flex items-center gap-2">
                  {low && <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />}
                  <p className="text-[13px] font-medium text-[rgb(var(--df-text))]">{item.name}</p>
                </div>
                <span className="text-[12px] text-[rgb(var(--df-text-3))]">{item.unit}</span>
                <span className={`text-[13px] font-medium ${low ? 'text-yellow-400' : 'text-[rgb(var(--df-text))]'}`}>{item.quantity}</span>
                <span className="text-[12px] text-[rgb(var(--df-text-3))]">{item.minStockLevel}</span>
                <span className="text-[13px] text-[rgb(var(--df-text-2))]">{item.supplier ?? '—'}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-2))] hover:text-[rgb(var(--df-text))] transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => void deleteItem(item.id, item.name)} disabled={deletingId === item.id}
                    className="p-1.5 rounded-lg hover:bg-red-400/10 text-[rgb(var(--df-text-3))] hover:text-red-400 transition-colors">
                    {deletingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
