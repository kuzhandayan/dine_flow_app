export interface ChatMessage {
  id: string
  tenantId: string | null
  senderName: string
  isAdmin: boolean
  content: string
  createdAt: Date
}

export interface DirectMessage {
  id: string
  tenantId: string
  content: string
  fromAdmin: boolean
  senderName: string
  isRead: boolean
  createdAt: Date
}

export interface DirectConversationSummary {
  tenantId: string
  tenantName: string
  tenantSlug: string
  lastMessage: string
  lastMessageAt: Date
  unreadCount: number
}

export interface ChatUnreadCounts {
  community: number
  direct: number
}
