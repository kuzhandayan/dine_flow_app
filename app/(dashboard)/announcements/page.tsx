'use client'

import { Bell, BellOff, Loader2 } from 'lucide-react'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { AnnouncementCard } from '@/components/announcements/AnnouncementCard'
import { PageHeader } from '@/components/shared/PageHeader'
export default function AnnouncementsPage(): React.JSX.Element {
  const { data, isLoading } = useAnnouncements()

  const announcements = data?.announcements ?? []
  const unreadCount = announcements.filter((a) => !a.isRead).length

  return (
    <div>
      <PageHeader
        title="Announcements"
        subtitle={
          unreadCount > 0
            ? `${unreadCount} unread announcement${unreadCount > 1 ? 's' : ''}`
            : 'All caught up!'
        }
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--df-text-2))]" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[rgb(var(--df-text-2))]">
          <BellOff className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-[14px] font-medium">No announcements yet</p>
          <p className="text-[12px] mt-1">Check back later for updates from DineFlow</p>
        </div>
      ) : (
        <div className="space-y-3">
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-red-400" />
              <span className="text-[13px] font-medium text-red-400">
                {unreadCount} new {unreadCount === 1 ? 'announcement' : 'announcements'}
              </span>
            </div>
          )}
          {announcements.map((a) => (
            <AnnouncementCard key={a.id} announcement={a} />
          ))}
        </div>
      )}
    </div>
  )
}
