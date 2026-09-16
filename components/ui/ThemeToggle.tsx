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
        'relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--df-accent))] shrink-0',
        isDark
          ? 'bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))]'
          : 'bg-[rgb(var(--df-accent))]',
        className
      )}
    >
      {/* Thumb — carries the active icon so it never overlaps a track icon */}
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center',
          isDark
            ? 'translate-x-0 bg-[rgb(var(--df-surface))]'
            : 'translate-x-6 bg-white'
        )}
      >
        {isDark ? (
          <Moon className="w-3 h-3 text-[rgb(var(--df-accent))]" fill="currentColor" />
        ) : (
          <Sun className="w-3 h-3 text-[rgb(var(--df-accent))]" fill="currentColor" />
        )}
      </span>
    </button>
  )
}
