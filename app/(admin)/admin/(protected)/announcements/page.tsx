'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Users, Loader2, Bell } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { AnnouncementCreateModal } from '@/components/announcements/AnnouncementCreateModal'
import { useToast } from '@/components/providers/ToastProvider'
import type { AnnouncementAdminView } from '@/types/announcement'

interface AdminAnnouncementsResponse {
  announcements: AnnouncementAdminView[]
}

interface TenantsResponse {
  tenants: { id: string; name: string; slug: string }[]
}

export default function AdminAnnouncementsPage(): React.JSX.Element {
  const [showCreate, setShowCreate] = useState(false)
  const queryClient = useQueryClient()
  const toast = useToast()

  const { data, isLoading } = useQuery<AdminAnnouncementsResponse>({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const res = await fetch('/api/admin/announcements')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json() as Promise<AdminAnnouncementsResponse>
    },
  })

  const { data: tenantsData } = useQuery<TenantsResponse>({
    queryKey: ['admin-tenants'],
    queryFn: async () => {
      const res = await fetch('/api/admin/tenants')
      if (!res.ok) throw new Error('Failed to fetch tenants')
      return res.json() as Promise<TenantsResponse>
    },
  })

  async function handleDelete(id: string): Promise<void> {
    if (!confirm('Delete this announcement?')) return
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Announcement deleted')
      void queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
    } catch {
      toast.error('Failed to delete announcement')
    }
  }

  const announcements = data?.announcements ?? []
  const tenants = tenantsData?.tenants ?? []

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle={`${announcements.length} total`}
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--df-accent))] text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Announcement
          </button>
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--df-text-2))]" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[rgb(var(--df-text-2))]">
          <Bell className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-[14px] font-medium">No announcements yet</p>
          <p className="text-[12px] mt-1">Create your first announcement to notify restaurants</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[14px] font-semibold truncate">{a.title}</h3>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                        a.targetType === 'ALL'
                          ? 'bg-[rgb(var(--df-accent))]/15 text-[rgb(var(--df-accent))]'
                          : 'bg-blue-500/15 text-blue-400'
                      }`}
                    >
                      {a.targetType === 'ALL' ? 'All Restaurants' : `${a.targets.length} Selected`}
                    </span>
                  </div>
                  <p className="text-[12px] text-[rgb(var(--df-text-2))] line-clamp-2 mb-3">
                    {a.content}
                  </p>
                  <div className="flex items-center gap-4 text-[11px] text-[rgb(var(--df-text-2))]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {a.readCount} / {a.totalTargets} read
                    </span>
                    <span>
                      {new Date(a.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => void handleDelete(a.id)}
                  className="p-1.5 rounded-lg text-[rgb(var(--df-text-2))] hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {a.targetType === 'SELECTED' && a.targets.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[rgb(var(--df-border))]">
                  <p className="text-[11px] text-[rgb(var(--df-text-2))] mb-1.5">Sent to:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {a.targets.map((t) => (
                      <span
                        key={t.tenant.id}
                        className="text-[10px] px-2 py-0.5 bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-full"
                      >
                        {t.tenant.name}
                        {a.reads.some((r) => r.tenantId === t.tenant.id) && (
                          <span className="ml-1 text-green-400">✓</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <AnnouncementCreateModal tenants={tenants} onClose={() => setShowCreate(false)} />
      )}
    </div>
  )
}
