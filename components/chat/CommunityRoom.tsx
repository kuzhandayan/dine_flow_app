'use client'

import { useEffect, useRef } from 'react'
import { useCommunityMessages, useSendCommunityMessage } from '@/hooks/useChat'
import { ChatMessageBubble } from './ChatMessageBubble'
import { ChatInput } from './ChatInput'
import { Loader2, Users } from 'lucide-react'

interface Props {
  currentTenantId: string | null
  currentTenantName: string
  isAdmin: boolean
}

export function CommunityRoom({ currentTenantId, isAdmin }: Props): React.JSX.Element {
  const { data, isLoading } = useCommunityMessages()
  const { mutateAsync: send } = useSendCommunityMessage()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.messages.length])

  async function handleSend(content: string): Promise<void> {
    await send(content)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgb(var(--df-border))] bg-[rgb(var(--df-card))]">
        <Users className="w-4 h-4 text-[rgb(var(--df-accent))]" />
        <div>
          <p className="text-[13px] font-semibold">Community Room</p>
          <p className="text-[11px] text-[rgb(var(--df-text-2))]">
            All restaurants + Admin · messages are visible to everyone
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="flex justify-center pt-8">
            <Loader2 className="w-5 h-5 animate-spin text-[rgb(var(--df-text-2))]" />
          </div>
        ) : !data?.messages.length ? (
          <div className="text-center py-12 text-[rgb(var(--df-text-2))]">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-[13px]">No messages yet. Say hello!</p>
          </div>
        ) : (
          data.messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              senderName={msg.senderName}
              isAdmin={msg.isAdmin}
              isOwn={
                isAdmin ? msg.isAdmin : msg.tenantId === currentTenantId
              }
              content={msg.content}
              createdAt={msg.createdAt}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={handleSend} placeholder="Message the community..." />
    </div>
  )
}
