import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'children' | 'size'> {
  options: SelectOption[]
  className?: string
  wrapperClassName?: string
  size?: 'sm' | 'md'
}

// Common styled dropdown — wraps a native <select> (keeps keyboard/a11y behavior)
// but hides the default browser arrow and draws one consistent chevron instead.
export function Select({
  options,
  className,
  wrapperClassName,
  size = 'md',
  disabled,
  ...props
}: SelectProps): React.JSX.Element {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <select
        disabled={disabled}
        className={cn(
          'w-full appearance-none px-3 pr-9 bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))]',
          'text-[13px] text-[rgb(var(--df-text))]',
          'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--df-accent))]/40 focus:border-[rgb(var(--df-accent))]',
          'transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed',
          size === 'md' ? 'py-2.5 rounded-xl' : 'py-2 rounded-lg',
          className
        )}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--df-text-3))]" />
    </div>
  )
}
