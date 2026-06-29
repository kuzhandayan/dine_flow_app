'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { MessageCircle, Users } from 'lucide-react'
import { CommunityRoom } from '@/components/chat/CommunityRoom'
import { DirectRoom } from '@/components/chat/DirectRoom'
import { useChatUnreadCounts } from '@/hooks/useChat'

type Tab = 'community' | 'direct'

export default function ChatPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('community')
  const { data: session } = useSession()
  const { data: unread } = useChatUnreadCounts()

  const tenantId = session?.user?.tenantId ?? ''
  const tenantName = session?.user?.tenantName ?? ''

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] -mx-4 -my-4 sm:-mx-6">
      <div className="flex border-b border-[rgb(var(--df-border))] bg-[rgb(var(--df-surface))] px-4 pt-4">
        <button
          onClick={() => setActiveTab('community')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'community'
              ? 'border-[rgb(var(--df-accent))] text-[rgb(var(--df-accent))]'
              : 'border-transparent text-[rgb(var(--df-text-2))] hover:text-[rgb(var(--df-text))]'
          }`}
        >
          <Users className="w-4 h-4" />
          Community
        </button>
        <button
          onClick={() => setActiveTab('direct')}
          className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors -mb-px relative ${
            activeTab === 'direct'
              ? 'border-[rgb(var(--df-accent))] text-[rgb(var(--df-accent))]'
              : 'border-transparent text-[rgb(var(--df-text-2))] hover:text-[rgb(var(--df-text))]'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          Direct (Admin)
          {(unread?.direct ?? 0) > 0 && (
            <span className="ml-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full inline-flex items-center justify-center px-1">
              {(unread?.direct ?? 0) > 9 ? '9+' : unread?.direct}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-hidden bg-[rgb(var(--df-bg))]">
        {activeTab === 'community' ? (
          <CommunityRoom
            currentTenantId={tenantId}
            currentTenantName={tenantName}
            isAdmin={false}
          />
        ) : (
          <DirectRoom tenantId={tenantId} tenantName={tenantName} isAdmin={false} />
        )}
      </div>
    </div>
  )
}
