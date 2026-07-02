'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ChatMessage, DirectMessage, DirectConversationSummary, ChatUnreadCounts } from '@/types/chat'

interface CommunityResponse {
  messages: ChatMessage[]
}

interface DirectResponse {
  messages: DirectMessage[]
}


interface DirectConversationsResponse {
  conversations: DirectConversationSummary[]
}

export function useCommunityMessages() {
  return useQuery<CommunityResponse>({
    queryKey: ['chat', 'community'],
    queryFn: async () => {
      const res = await fetch('/api/chat/community')
      if (!res.ok) throw new Error('Failed to fetch community messages')
      return res.json() as Promise<CommunityResponse>
    },
    refetchOnWindowFocus: true,
  })
}

export function useDirectMessages(tenantId: string) {
  return useQuery<DirectResponse>({
    queryKey: ['chat', 'direct', tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/direct/${tenantId}`)
      if (!res.ok) throw new Error('Failed to fetch messages')
      return res.json() as Promise<DirectResponse>
    },
    refetchOnWindowFocus: true,
    enabled: !!tenantId,
  })
}

export function useSendCommunityMessage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch('/api/chat/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error('Failed to send message')
      return res.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chat', 'community'] })
    },
  })
}

export function useSendDirectMessage(tenantId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/chat/direct/${tenantId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error('Failed to send message')
      return res.json()
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['chat', 'direct', tenantId] })
      void queryClient.invalidateQueries({ queryKey: ['chat', 'unread'] })
    },
  })
}

export function useChatUnreadCounts() {
  return useQuery<ChatUnreadCounts>({
    queryKey: ['chat', 'unread'],
    queryFn: async () => {
      const res = await fetch('/api/chat/unread')
      if (!res.ok) return { community: 0, direct: 0 }
      return res.json() as Promise<ChatUnreadCounts>
    },
    refetchOnWindowFocus: true,
  })
}

export function useAdminDirectConversations() {
  return useQuery<DirectConversationsResponse>({
    queryKey: ['chat', 'direct', 'admin-list'],
    queryFn: async () => {
      const res = await fetch('/api/chat/direct')
      if (!res.ok) throw new Error('Failed to fetch conversations')
      return res.json() as Promise<DirectConversationsResponse>
    },
    refetchOnWindowFocus: true,
  })
}
