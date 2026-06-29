'use client'

import { format } from 'date-fns'
import { Bell, User, Menu } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface TopbarProps {
  userName: string
  tenantName: string
  onMenuToggle?: () => void
}

export function Topbar({ userName, tenantName, onMenuToggle }: TopbarProps): React.JSX.Element {
  const today = format(new Date(), 'EEE, dd MMM yyyy')

  return (
    <header className="h-14 bg-[rgb(var(--df-surface))] border-b border-[rgb(var(--df-border))] flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-[rgb(var(--df-text-2))] hover:bg-[rgb(var(--df-surface-2))] hover:text-[rgb(var(--df-text))] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <p className="hidden sm:block text-[12px] text-[rgb(var(--df-text-2))]">{today}</p>
      </div>

      <div className="flex items-center gap-2">
        {/* New Order — full on sm+, icon-only on xs */}
        <Link
          href="/new-order"
          className="hidden sm:flex px-3 py-1.5 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-lg text-[12px] font-medium transition-colors items-center gap-1.5"
        >
          <span className="text-[15px] leading-none">+</span>
          New Order
        </Link>
        <Link
          href="/new-order"
          className="sm:hidden w-8 h-8 flex items-center justify-center bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-lg text-[18px] font-bold transition-colors"
          aria-label="New order"
        >
          +
        </Link>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg text-[rgb(var(--df-text-2))] hover:bg-[rgb(var(--df-surface-2))] hover:text-[rgb(var(--df-text))] transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[rgb(var(--df-surface-2))] transition-colors cursor-pointer">
          <div className="w-7 h-7 rounded-full bg-[rgb(var(--df-accent))] flex items-center justify-center shrink-0">
            <User className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="hidden lg:block">
            <p className="text-[12px] font-medium leading-tight">{userName}</p>
            <p className="text-[10px] text-[rgb(var(--df-text-2))] leading-tight truncate max-w-[120px]">
              {tenantName}
            </p>
          </div>
        </div>
      </div>
    </header>
  )
}
