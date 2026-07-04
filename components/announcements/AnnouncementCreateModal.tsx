'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'
import { useQueryClient } from '@tanstack/react-query'

interface Tenant {
  id: string
  name: string
  slug: string
}

interface Props {
  tenants: Tenant[]
  onClose: () => void
}

export function AnnouncementCreateModal({ tenants, onClose }: Props): React.JSX.Element {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetType, setTargetType] = useState<'ALL' | 'SELECTED'>('ALL')
  const [selectedTenants, setSelectedTenants] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()
  const toast = useToast()

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    if (targetType === 'SELECTED' && selectedTenants.length === 0) {
      toast.error('Select at least one restaurant')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          targetType,
          tenantIds: targetType === 'SELECTED' ? selectedTenants : undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        throw new Error(d.error ?? 'Failed to create announcement')
      }
      toast.success('Announcement posted!')
      void queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  function toggleTenant(id: string): void {
    setSelectedTenants((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[rgb(var(--df-surface))] border border-[rgb(var(--df-border))] rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[rgb(var(--df-border))]">
          <h2 className="text-[16px] font-semibold">New Announcement</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-5 space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title..."
              maxLength={200}
              className="w-full px-3 py-2 text-[14px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">
              Message
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement..."
              maxLength={5000}
              rows={5}
              className="w-full px-3 py-2 text-[14px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-lg focus:outline-none focus:border-[rgb(var(--df-accent))] transition-colors resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-2">
              Send To
            </label>
            <div className="flex gap-2">
              {(['ALL', 'SELECTED'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTargetType(t)}
                  className={`px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors border ${
                    targetType === t
                      ? 'bg-[rgb(var(--df-accent))] text-white border-[rgb(var(--df-accent))]'
                      : 'bg-transparent border-[rgb(var(--df-border))] text-[rgb(var(--df-text-2))]'
                  }`}
                >
                  {t === 'ALL' ? 'All Restaurants' : 'Selected Only'}
                </button>
              ))}
            </div>
          </div>

          {targetType === 'SELECTED' && (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-[rgb(var(--df-border))] divide-y divide-[rgb(var(--df-border))]">
              {tenants.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/[0.03] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedTenants.includes(t.id)}
                    onChange={() => toggleTenant(t.id)}
                    className="w-4 h-4 rounded border-[rgb(var(--df-border))] accent-[rgb(var(--df-accent))]"
                  />
                  <div>
                    <p className="text-[13px] font-medium">{t.name}</p>
                    <p className="text-[11px] text-[rgb(var(--df-text-2))]">{t.slug}</p>
                  </div>
                </label>
              ))}
              {tenants.length === 0 && (
                <p className="text-[12px] text-[rgb(var(--df-text-2))] p-3 text-center">
                  No restaurants found
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-[rgb(var(--df-border))] text-[14px] hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg bg-[rgb(var(--df-accent))] text-white text-[14px] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Post Announcement
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
