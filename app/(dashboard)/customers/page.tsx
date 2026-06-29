import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Users } from 'lucide-react'

export const metadata: Metadata = { title: 'Customers' }

export default function CustomersPage(): React.JSX.Element {
  return (
    <div>
      <PageHeader title="Customers" subtitle="Manage customer profiles" />
      <EmptyState icon={Users} title="Customers management coming soon" />
    </div>
  )
}
