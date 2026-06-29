import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ClipboardList } from 'lucide-react'

export const metadata: Metadata = { title: 'Orders' }

export default function OrdersPage(): React.JSX.Element {
  return (
    <div>
      <PageHeader title="Orders" subtitle="View and manage all orders" />
      <EmptyState
        icon={ClipboardList}
        title="Orders coming soon"
        subtitle="Full orders management will be built next"
      />
    </div>
  )
}
