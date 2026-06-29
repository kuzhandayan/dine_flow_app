import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Users } from 'lucide-react'

export const metadata: Metadata = { title: 'Team' }

export default function TeamPage(): React.JSX.Element {
  return (
    <div>
      <PageHeader title="Team" subtitle="Invite staff and manage roles" />
      <EmptyState icon={Users} title="Team management coming soon" />
    </div>
  )
}
