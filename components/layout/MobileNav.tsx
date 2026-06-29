'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, ShoppingCart, ClipboardList, Users, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { label: 'New Order', href: '/new-order', icon: ShoppingCart },
  { label: 'Orders', href: '/orders', icon: ClipboardList },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export function MobileNav(): React.JSX.Element {
  const pathname = usePathname()

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[rgb(var(--df-surface))] border-t border-[rgb(var(--df-border))] md:hidden">
      <div className="flex items-center justify-around px-1 py-1.5 safe-area-pb">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[52px]',
              isActive(href)
                ? 'text-[rgb(var(--df-accent))]'
                : 'text-[rgb(var(--df-text-3))] hover:text-[rgb(var(--df-text-2))]'
            )}
          >
            <Icon className={cn('w-5 h-5', isActive(href) && 'drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]')} />
            <span className="text-[9px] font-medium leading-none tracking-wide">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
