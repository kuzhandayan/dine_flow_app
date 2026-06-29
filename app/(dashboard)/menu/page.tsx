import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { UtensilsCrossed } from 'lucide-react'

export const metadata: Metadata = { title: 'Menu' }

export default function MenuPage(): React.JSX.Element {
  return (
    <div>
      <PageHeader title="Menu" subtitle="Manage menu items and categories" />
      <EmptyState icon={UtensilsCrossed} title="Menu management coming soon" />
    </div>
  )
}
