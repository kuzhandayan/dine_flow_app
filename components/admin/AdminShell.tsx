'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import type { Session } from 'next-auth'
import {
  LayoutDashboard,
  Building2,
  Bell,
  MessageCircle,
  LogOut,
  Shield,
  Menu,
  X,
} from 'lucide-react'

interface Props {
  session: Session
  children: React.ReactNode
}

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/tenants', label: 'Restaurants', icon: Building2 },
  { href: '/admin/announcements', label: 'Announcements', icon: Bell },
  { href: '/admin/chat', label: 'Chat Hub', icon: MessageCircle },
]

export function AdminShell({ session, children }: Props): React.JSX.Element {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[rgb(var(--df-bg))] flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 bg-[rgb(var(--df-surface))] border-r border-[rgb(var(--df-border))] flex flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 h-16 border-b border-[rgb(var(--df-border))]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[13px] font-bold">DineFlow</p>
              <p className="text-[10px] text-purple-400 font-medium -mt-0.5">Super Admin</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  active
                    ? 'bg-purple-600/15 text-purple-400'
                    : 'text-[rgb(var(--df-text-2))] hover:bg-white/5 hover:text-[rgb(var(--df-text))]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-[rgb(var(--df-border))]">
          <div className="px-3 py-2 mb-1">
            <p className="text-[12px] font-medium truncate">{session.user.name}</p>
            <p className="text-[11px] text-[rgb(var(--df-text-2))] truncate">{session.user.email}</p>
          </div>
          <button
            onClick={() => void signOut({ callbackUrl: '/admin/login' })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-[rgb(var(--df-text-2))] hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-[rgb(var(--df-border))] bg-[rgb(var(--df-surface))] flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <p className="text-[14px] font-semibold text-[rgb(var(--df-text-2))]">
            {NAV.find((n) => pathname.startsWith(n.href))?.label ?? 'Admin'}
          </p>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
