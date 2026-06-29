import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  subtitle,
  action,
}: EmptyStateProps): React.JSX.Element {
  return (
    <div className="text-center py-12 px-6">
      <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--df-surface-2))] flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-[rgb(var(--df-text-3))]" />
      </div>
      <p className="text-[14px] font-medium text-[rgb(var(--df-text))]">{title}</p>
      {subtitle && (
        <p className="text-[12px] text-[rgb(var(--df-text-2))] mt-1">{subtitle}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
