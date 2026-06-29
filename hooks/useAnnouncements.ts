'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AnnouncementWithReadStatus } from '@/types/announcement'

interface AnnouncementsResponse {
  announcements: AnnouncementWithReadStatus[]
}

interface UnreadCountResponse {
  count: number
}

export function useAnnouncements() {
  return useQuery<AnnouncementsResponse>({
    queryKey: ['announcements'],
    queryFn: async () => {
      const res = await fetch('/api/announcements')
      if (!res.ok) throw new Error('Failed to fetch announcements')
      return res.json() as Promise<AnnouncementsResponse>
    },
  })
}

export function useAnnouncementUnreadCount() {
  return useQuery<UnreadCountResponse>({
    queryKey: ['announcements', 'unread-count'],
    queryFn: async () => {
      const res = await fetch('/api/announcements/unread-count')
      if (!res.ok) return { count: 0 }
      return res.json() as Promise<UnreadCountResponse>
    },
    refetchInterval: 30_000,
  })
}

export function useMarkAnnouncementRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/announcements/${id}/read`, { method: 'POST' })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })
}
