import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Receipt } from 'lucide-react'

export const metadata: Metadata = { title: 'GST Config' }

export default function GSTConfigPage(): React.JSX.Element {
  return (
    <div>
      <PageHeader title="GST Configuration" subtitle="Configure GSTIN and default rates" />
      <EmptyState icon={Receipt} title="GST configuration coming soon" />
    </div>
  )
}
