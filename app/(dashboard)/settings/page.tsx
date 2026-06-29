import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Settings } from 'lucide-react'

export const metadata: Metadata = { title: 'Settings' }

export default function SettingsPage(): React.JSX.Element {
  return (
    <div>
      <PageHeader title="Settings" subtitle="General restaurant settings" />
      <EmptyState icon={Settings} title="Settings coming soon" />
    </div>
  )
}
