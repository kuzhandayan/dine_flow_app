import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Search } from 'lucide-react'

export const metadata: Metadata = { title: 'Check Order' }

export default function CheckOrderPage(): React.JSX.Element {
  return (
    <div>
      <PageHeader title="Check Order" subtitle="Look up order status by ID" />
      <EmptyState icon={Search} title="Check Order coming soon" />
    </div>
  )
}
