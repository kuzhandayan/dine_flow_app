export type AnnouncementTargetType = 'ALL' | 'SELECTED'

export interface AnnouncementWithReadStatus {
  id: string
  title: string
  content: string
  targetType: AnnouncementTargetType
  isActive: boolean
  createdAt: Date
  isRead: boolean
}

export interface AnnouncementAdminView {
  id: string
  title: string
  content: string
  targetType: AnnouncementTargetType
  isActive: boolean
  createdAt: Date
  targets: { tenant: { id: string; name: string; slug: string } }[]
  reads: { tenantId: string }[]
  readCount: number
  totalTargets: number
}

export interface CreateAnnouncementInput {
  title: string
  content: string
  targetType: AnnouncementTargetType
  tenantIds?: string[]
}
