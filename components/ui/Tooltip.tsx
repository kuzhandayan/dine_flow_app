import { cn } from '@/lib/utils'

interface TooltipProps {
  label: string
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

const SIDE_CLASSES: Record<NonNullable<TooltipProps['side']>, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
  left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
  right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
}

// Wrap any element — especially a `truncate`d one — to show its full text on hover/focus.
// Usage: <Tooltip label={fullName}><p className="truncate max-w-[140px]">{fullName}</p></Tooltip>
export function Tooltip({ label, children, side = 'top', className }: TooltipProps): React.JSX.Element {
  return (
    <span className={cn('relative inline-flex group/tooltip', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-[rgb(var(--df-border))] bg-[rgb(var(--df-surface-2))] px-2 py-1 text-[11px] font-medium text-[rgb(var(--df-text))] opacity-0 shadow-lg transition-opacity duration-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100',
          SIDE_CLASSES[side]
        )}
      >
        {label}
      </span>
    </span>
  )
}
