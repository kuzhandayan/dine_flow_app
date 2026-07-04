'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import type { UserRole } from '@prisma/client'
import { X } from 'lucide-react'
import { CUSTOMIZABLE_ROLES } from '@/constants/ROLES'
import {
  LayoutDashboard, ShoppingCart, ClipboardList, Search,
  UtensilsCrossed, Package, Users, BarChart3,
  Settings, Receipt, LogOut, ChefHat, Bell, MessageCircle, LayoutGrid, Flame,
} from 'lucide-react'
import { useAnnouncementUnreadCount } from '@/hooks/useAnnouncements'
import { useChatUnreadCounts } from '@/hooks/useChat'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  roles?: UserRole[]
  badgeKey?: 'announcements' | 'chat'
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const MGMT: UserRole[] = ['OWNER', 'MANAGER', 'SUPER_ADMIN']
const MGMT_KITCHEN: UserRole[] = ['OWNER', 'MANAGER', 'SUPER_ADMIN', 'KITCHEN']
const MGMT_ONLY: UserRole[] = ['OWNER', 'MANAGER', 'SUPER_ADMIN']
const WAITER_UP: UserRole[] = ['OWNER', 'MANAGER', 'SUPER_ADMIN', 'WAITER']
const NO_CASHIER: UserRole[] = ['OWNER', 'MANAGER', 'SUPER_ADMIN', 'WAITER', 'KITCHEN']

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operations',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, roles: MGMT_ONLY },
      { label: 'New Order', href: '/new-order', icon: <ShoppingCart className="w-4 h-4" />, roles: WAITER_UP },
      { label: 'Orders', href: '/orders', icon: <ClipboardList className="w-4 h-4" />, roles: WAITER_UP },
      { label: 'Kitchen View', href: '/kitchen', icon: <Flame className="w-4 h-4" />, roles: NO_CASHIER },
      { label: 'Check Order', href: '/check-order', icon: <Search className="w-4 h-4" /> },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Menu', href: '/menu', icon: <UtensilsCrossed className="w-4 h-4" />, roles: MGMT_KITCHEN },
      { label: 'Inventory', href: '/inventory', icon: <Package className="w-4 h-4" />, roles: MGMT_KITCHEN },
      { label: 'Customers', href: '/customers', icon: <Users className="w-4 h-4" />, roles: WAITER_UP },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Reports', href: '/reports', icon: <BarChart3 className="w-4 h-4" />, roles: MGMT },
    ],
  },
  {
    label: 'Updates',
    items: [
      { label: 'Announcements', href: '/announcements', icon: <Bell className="w-4 h-4" />, roles: MGMT, badgeKey: 'announcements' },
      { label: 'Chat', href: '/chat', icon: <MessageCircle className="w-4 h-4" />, roles: MGMT, badgeKey: 'chat' },
    ],
  },
  {
    label: 'Settings',
    items: [
      { label: 'Tables', href: '/settings/tables', icon: <LayoutGrid className="w-4 h-4" />, roles: MGMT },
      { label: 'GST Config', href: '/settings/gst', icon: <Receipt className="w-4 h-4" />, roles: ['OWNER', 'SUPER_ADMIN'] },
      { label: 'Team', href: '/settings/team', icon: <ChefHat className="w-4 h-4" />, roles: MGMT },
      { label: 'General', href: '/settings', icon: <Settings className="w-4 h-4" />, roles: MGMT },
    ],
  },
]

interface SidebarProps {
  tenantName: string
  userRole: UserRole
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ tenantName, userRole, isOpen = false, onClose }: SidebarProps): React.JSX.Element {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { data: announcementUnread } = useAnnouncementUnreadCount()
  const { data: chatUnread } = useChatUnreadCounts()

  // Permissions from session — only meaningful for staff roles
  const userPermissions: string[] = session?.user?.permissions ?? []
  const isStaffRole = CUSTOMIZABLE_ROLES.includes(userRole)

  function getBadgeCount(key?: 'announcements' | 'chat'): number {
    if (key === 'announcements') return announcementUnread?.count ?? 0
    if (key === 'chat') return (chatUnread?.direct ?? 0) + (chatUnread?.community ?? 0)
    return 0
  }

  function isActive(href: string): boolean {
    if (href === '/dashboard' || href === '/settings') return pathname === href
    return pathname.startsWith(href)
  }

  function canAccess(roles?: UserRole[], href?: string): boolean {
    // Staff roles: check permissions array instead of role list
    if (isStaffRole && href) {
      const key = href.replace(/^\//, '').split('/')[0]
      return userPermissions.includes(key)
    }
    if (!roles) return true
    return roles.includes(userRole)
  }

  async function handleLogout(): Promise<void> {
    await signOut({ redirect: false })
    router.push('/login')
  }

  return (
    <aside
      className={cn(
        // Base styles
        'w-[216px] bg-[rgb(var(--df-surface))] border-r border-[rgb(var(--df-border))] flex flex-col h-screen fixed top-0 z-30 transition-transform duration-300',
        // Desktop: always visible
        'md:translate-x-0 md:left-0',
        // Mobile: slide in/out
        isOpen ? 'translate-x-0 left-0' : '-translate-x-full left-0 md:translate-x-0'
      )}
    >
      {/* Logo + close button (mobile) */}
      <div className="px-4 py-[18px] border-b border-[rgb(var(--df-border))] flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-extrabold text-[rgb(var(--df-accent))] tracking-tight">
            DineFlow
          </h1>
          <p className="text-[11px] text-[rgb(var(--df-text-2))] mt-0.5 truncate max-w-[150px]">
            {tenantName}
          </p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={onClose}
          className="md:hidden w-7 h-7 flex items-center justify-center rounded-lg text-[rgb(var(--df-text-3))] hover:bg-[rgb(var(--df-surface-2))] hover:text-[rgb(var(--df-text))] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => canAccess(item.roles, item.href))
          if (visibleItems.length === 0) return null

          return (
            <div key={group.label} className="mb-1">
              <p className="text-[10px] font-semibold text-[rgb(var(--df-text-2))] tracking-[0.8px] uppercase px-3 pt-3 pb-1">
                {group.label}
              </p>
              {visibleItems.map((item) => {
                const badge = getBadgeCount(item.badgeKey)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-[13px] transition-colors',
                      isActive(item.href)
                        ? 'bg-[rgb(var(--df-accent))]/15 text-[rgb(var(--df-accent))] font-medium'
                        : 'text-[rgb(var(--df-text-2))] hover:bg-[rgb(var(--df-surface-2))] hover:text-[rgb(var(--df-text))]'
                    )}
                  >
                    <span className="relative shrink-0">
                      {item.icon}
                      {badge > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                          {badge > 9 ? '9+' : badge}
                        </span>
                      )}
                    </span>
                    {item.label}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-2 py-3 border-t border-[rgb(var(--df-border))]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-[13px] text-[rgb(var(--df-text-2))] hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
