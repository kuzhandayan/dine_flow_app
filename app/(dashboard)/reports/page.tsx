import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { BarChart3 } from 'lucide-react'

export const metadata: Metadata = { title: 'Reports' }

export default function ReportsPage(): React.JSX.Element {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Revenue, GST, and analytics" />
      <EmptyState icon={BarChart3} title="Reports coming soon" />
    </div>
  )
}
