'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Pencil, Check, X, Loader2, LayoutGrid } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { toast } from '@/hooks/useToast'

interface Table {
  id: string
  name: string
  capacity: number
  isActive: boolean
  sortOrder: number
}

export default function TablesSettingsPage(): React.JSX.Element {
  const [tables, setTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newCapacity, setNewCapacity] = useState(4)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCapacity, setEditCapacity] = useState(4)

  async function fetchTables(): Promise<void> {
    setLoading(true)
    try {
      const res = await fetch('/api/tables')
      const d = await res.json() as { tables: Table[] }
      setTables(d.tables)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchTables() }, [])

  async function addTable(): Promise<void> {
    if (!newName.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), capacity: newCapacity }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Failed')
      }
      toast.success(`Table "${newName.trim()}" added`)
      setNewName('')
      setNewCapacity(4)
      await fetchTables()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add table')
    } finally {
      setAdding(false)
    }
  }

  async function addBulk(): Promise<void> {
    const count = parseInt(prompt('How many tables to add? (e.g. 10)') ?? '0')
    if (!count || count < 1 || count > 50) return
    const start = tables.length + 1
    setAdding(true)
    try {
      for (let i = start; i < start + count; i++) {
        await fetch('/api/tables', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `T${i}`, capacity: 4, sortOrder: i }),
        })
      }
      toast.success(`${count} tables added`)
      await fetchTables()
    } catch {
      toast.error('Failed to add tables')
    } finally {
      setAdding(false)
    }
  }

  async function saveEdit(id: string): Promise<void> {
    try {
      await fetch(`/api/tables/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, capacity: editCapacity }),
      })
      toast.success('Table updated')
      setEditingId(null)
      await fetchTables()
    } catch {
      toast.error('Failed to update table')
    }
  }

  async function toggleActive(id: string, current: boolean): Promise<void> {
    await fetch(`/api/tables/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !current }),
    })
    await fetchTables()
  }

  async function deleteTable(id: string, name: string): Promise<void> {
    if (!confirm(`Delete table "${name}"?`)) return
    try {
      await fetch(`/api/tables/${id}`, { method: 'DELETE' })
      toast.success(`Table "${name}" deleted`)
      await fetchTables()
    } catch {
      toast.error('Failed to delete table')
    }
  }

  return (
    <div>
      <PageHeader
        title="Tables"
        subtitle={`${tables.filter((t) => t.isActive).length} active tables`}
      />

      {/* Add single table */}
      <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-xl p-4 mb-5">
        <p className="text-[13px] font-medium mb-3">Add Table</p>
        <div className="flex gap-2 flex-wrap">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void addTable()}
            placeholder="Table name (e.g. T1, Window Table)"
            className="flex-1 min-w-[160px] px-3 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))]"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-[rgb(var(--df-text-2))] whitespace-nowrap">Seats:</span>
            <input
              type="number"
              value={newCapacity}
              onChange={(e) => setNewCapacity(parseInt(e.target.value) || 4)}
              min={1}
              max={50}
              className="w-16 px-2 py-2 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] text-center"
            />
          </div>
          <button
            onClick={() => void addTable()}
            disabled={!newName.trim() || adding}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--df-accent))] text-white text-[13px] font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Add
          </button>
          <button
            onClick={() => void addBulk()}
            disabled={adding}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgb(var(--df-border))] text-[13px] hover:bg-white/5 transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Add Bulk
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--df-text-2))]" />
        </div>
      ) : tables.length === 0 ? (
        <div className="text-center py-14 text-[rgb(var(--df-text-2))]">
          <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-[14px] font-medium">No tables yet</p>
          <p className="text-[12px] mt-1">Add tables above so waiters can assign orders to them</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {tables.map((t) => (
            <div
              key={t.id}
              className={`relative bg-[rgb(var(--df-card))] border rounded-xl p-3 transition-colors ${
                t.isActive ? 'border-[rgb(var(--df-border))]' : 'border-[rgb(var(--df-border))]/50 opacity-50'
              }`}
            >
              {editingId === t.id ? (
                <div className="space-y-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-2 py-1 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-accent))] rounded-md focus:outline-none"
                    autoFocus
                  />
                  <input
                    type="number"
                    value={editCapacity}
                    onChange={(e) => setEditCapacity(parseInt(e.target.value) || 4)}
                    min={1}
                    max={50}
                    className="w-full px-2 py-1 text-[12px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-md focus:outline-none text-center"
                  />
                  <div className="flex gap-1.5">
                    <button onClick={() => void saveEdit(t.id)} className="flex-1 py-1 rounded-md bg-green-500/20 text-green-400 text-[12px] flex items-center justify-center gap-1">
                      <Check className="w-3 h-3" /> Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="flex-1 py-1 rounded-md bg-[rgb(var(--df-surface-2))] text-[12px] flex items-center justify-center gap-1">
                      <X className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-2">
                    <p className="text-[15px] font-bold">{t.name}</p>
                    <p className="text-[11px] text-[rgb(var(--df-text-2))]">{t.capacity} seats</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditingId(t.id); setEditName(t.name); setEditCapacity(t.capacity) }}
                      className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center text-[rgb(var(--df-text-2))] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => void toggleActive(t.id, t.isActive)}
                      className={`flex-1 py-1 rounded-md text-[10px] font-medium transition-colors ${
                        t.isActive
                          ? 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                          : 'bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-2))]'
                      }`}
                    >
                      {t.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => void deleteTable(t.id, t.name)}
                      className="w-7 h-7 rounded-md hover:bg-red-500/10 flex items-center justify-center text-[rgb(var(--df-text-2))] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
