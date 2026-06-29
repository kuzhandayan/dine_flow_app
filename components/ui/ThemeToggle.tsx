'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps): React.JSX.Element {
  const { isDark, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn(
        'relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--df-accent))]',
        isDark
          ? 'bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))]'
          : 'bg-[rgb(var(--df-accent))]',
        className
      )}
    >
      {/* Track icons */}
      <Moon
        className={cn(
          'absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-opacity duration-200',
          isDark ? 'opacity-100 text-[rgb(var(--df-accent))]' : 'opacity-0'
        )}
      />
      <Sun
        className={cn(
          'absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 transition-opacity duration-200',
          isDark ? 'opacity-0' : 'opacity-100 text-white'
        )}
      />

      {/* Thumb */}
      <span
        className={cn(
          'absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-transform duration-300',
          isDark
            ? 'translate-x-0.5 bg-[rgb(var(--df-border))]'
            : 'translate-x-[calc(100%-0.25rem)] bg-white'
        )}
      />
    </button>
  )
}
