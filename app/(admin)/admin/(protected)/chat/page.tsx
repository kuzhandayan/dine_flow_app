'use client'

import { useState } from 'react'
import { Users, MessageCircle, ChevronRight } from 'lucide-react'
import { CommunityRoom } from '@/components/chat/CommunityRoom'
import { DirectRoom } from '@/components/chat/DirectRoom'
import { useAdminDirectConversations } from '@/hooks/useChat'
import { PageHeader } from '@/components/shared/PageHeader'

type Tab = 'community' | 'direct'

export default function AdminChatPage(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('community')
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null)
  const [activeTenantName, setActiveTenantName] = useState<string>('')
  const { data } = useAdminDirectConversations()

  const conversations = data?.conversations ?? []

  return (
    <div>
      <PageHeader title="Chat Hub" subtitle="Manage community and direct messages" />

      <div className="flex border border-[rgb(var(--df-border))] rounded-xl overflow-hidden bg-[rgb(var(--df-card))] h-[calc(100vh-200px)] min-h-[500px]">
        <div className="w-full flex flex-col">
          <div className="flex border-b border-[rgb(var(--df-border))]">
            <button
              onClick={() => { setActiveTab('community'); setActiveTenantId(null) }}
              className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors -mb-px ${
                activeTab === 'community'
                  ? 'border-[rgb(var(--df-accent))] text-[rgb(var(--df-accent))]'
                  : 'border-transparent text-[rgb(var(--df-text-2))]'
              }`}
            >
              <Users className="w-4 h-4" />
              Community
            </button>
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors -mb-px relative ${
                activeTab === 'direct'
                  ? 'border-[rgb(var(--df-accent))] text-[rgb(var(--df-accent))]'
                  : 'border-transparent text-[rgb(var(--df-text-2))]'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              Direct Messages
              {conversations.some((c) => c.unreadCount > 0) && (
                <span className="w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {activeTab === 'community' && (
              <div className="flex-1">
                <CommunityRoom currentTenantId={null} currentTenantName="Admin" isAdmin={true} />
              </div>
            )}

            {activeTab === 'direct' && (
              <>
                <div className="w-64 border-r border-[rgb(var(--df-border))] overflow-y-auto shrink-0">
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-[rgb(var(--df-text-2))] p-4">
                      <MessageCircle className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-[12px] text-center">No direct conversations yet</p>
                    </div>
                  ) : (
                    conversations.map((c) => (
                      <button
                        key={c.tenantId}
                        onClick={() => { setActiveTenantId(c.tenantId); setActiveTenantName(c.tenantName) }}
                        className={`w-full text-left px-4 py-3 border-b border-[rgb(var(--df-border))] hover:bg-white/[0.03] transition-colors ${
                          activeTenantId === c.tenantId ? 'bg-[rgb(var(--df-accent))]/10' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {c.unreadCount > 0 && (
                                <span className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                              )}
                              <p className="text-[13px] font-medium truncate">{c.tenantName}</p>
                            </div>
                            <p className="text-[11px] text-[rgb(var(--df-text-2))] truncate mt-0.5">
                              {c.lastMessage}
                            </p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-[rgb(var(--df-text-2))] shrink-0 mt-0.5" />
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <div className="flex-1 overflow-hidden">
                  {activeTenantId ? (
                    <DirectRoom tenantId={activeTenantId} tenantName={activeTenantName} isAdmin={true} />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-[rgb(var(--df-text-2))]">
                      <MessageCircle className="w-10 h-10 mb-3 opacity-20" />
                      <p className="text-[13px]">Select a conversation</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
