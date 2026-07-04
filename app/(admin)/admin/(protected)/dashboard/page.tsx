import { prisma } from '@/lib/prisma'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Building2, Users, MessageCircle, Bell } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage(): Promise<React.JSX.Element> {
  // Exclude admin tenants (tenants that contain a SUPER_ADMIN user) — same rule as /api/admin/tenants
  const adminTenantIds = await prisma.user
    .findMany({ where: { role: 'SUPER_ADMIN' }, select: { tenantId: true } })
    .then((rows) => rows.map((r) => r.tenantId))

  const [tenantCount, userCount, announcementCount, directMsgCount] = await Promise.all([
    prisma.tenant.count({ where: { isActive: true, id: { notIn: adminTenantIds } } }),
    prisma.user.count({ where: { isActive: true, tenantId: { notIn: adminTenantIds } } }),
    prisma.announcement.count({ where: { isActive: true } }),
    prisma.directMessage.count({ where: { fromAdmin: false, isRead: false } }),
  ])

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="DineFlow platform overview" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Active Restaurants"
          value={String(tenantCount)}
          subtitle="Tenants on platform"
          color="rgb(var(--df-accent))"
          icon={<Building2 className="w-5 h-5" />}
        />
        <StatCard
          label="Total Users"
          value={String(userCount)}
          subtitle="Across all tenants"
          color="rgb(var(--df-blue))"
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Announcements"
          value={String(announcementCount)}
          subtitle="Active posts"
          color="rgb(var(--df-green))"
          icon={<Bell className="w-5 h-5" />}
        />
        <StatCard
          label="Unread DMs"
          value={String(directMsgCount)}
          subtitle="From restaurants"
          color={directMsgCount > 0 ? 'rgb(var(--df-red))' : 'rgb(var(--df-green))'}
          icon={<MessageCircle className="w-5 h-5" />}
        />
      </div>
    </div>
  )
}
