'use client'

import { useState } from 'react'
import { Bell, BellOff, ChevronDown, ChevronUp } from 'lucide-react'
import type { AnnouncementWithReadStatus } from '@/types/announcement'
import { useMarkAnnouncementRead } from '@/hooks/useAnnouncements'

interface Props {
  announcement: AnnouncementWithReadStatus
}

export function AnnouncementCard({ announcement }: Props): React.JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const { mutate: markRead } = useMarkAnnouncementRead()

  function handleExpand(): void {
    setExpanded((p) => !p)
    if (!announcement.isRead) {
      markRead(announcement.id)
    }
  }

  const date = new Date(announcement.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <div
      className={`rounded-xl border transition-all ${
        !announcement.isRead
          ? 'border-red-500/40 bg-red-500/5'
          : 'border-[rgb(var(--df-border))] bg-[rgb(var(--df-card))]'
      }`}
    >
      <button
        onClick={handleExpand}
        className="w-full flex items-start gap-3 p-4 text-left"
      >
        <div className={`mt-0.5 shrink-0 ${!announcement.isRead ? 'text-red-400' : 'text-[rgb(var(--df-text-2))]'}`}>
          {announcement.isRead ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-semibold truncate">
              {!announcement.isRead && (
                <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2 align-middle" />
              )}
              {announcement.title}
            </span>
            <span className="text-[11px] text-[rgb(var(--df-text-2))] shrink-0">{date}</span>
          </div>
          {!expanded && (
            <p className="text-[12px] text-[rgb(var(--df-text-2))] mt-0.5 line-clamp-2">
              {announcement.content}
            </p>
          )}
        </div>
        <div className="text-[rgb(var(--df-text-2))] shrink-0 mt-0.5">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="ml-7 text-[13px] text-[rgb(var(--df-text))] leading-relaxed whitespace-pre-wrap border-t border-[rgb(var(--df-border))] pt-3">
            {announcement.content}
          </div>
        </div>
      )}
    </div>
  )
}
