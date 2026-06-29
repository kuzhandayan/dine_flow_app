import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Package } from 'lucide-react'

export const metadata: Metadata = { title: 'Inventory' }

export default function InventoryPage(): React.JSX.Element {
  return (
    <div>
      <PageHeader title="Inventory" subtitle="Track stock levels and restock alerts" />
      <EmptyState icon={Package} title="Inventory management coming soon" />
    </div>
  )
}
