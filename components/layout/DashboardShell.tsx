'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@prisma/client'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { MobileNav } from '@/components/layout/MobileNav'

interface DashboardShellProps {
  children: React.ReactNode
  tenantName: string
  userRole: UserRole
  userName: string
}

export function DashboardShell({
  children,
  tenantName,
  userRole,
  userName,
}: DashboardShellProps): React.JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Close sidebar on resize to desktop
  useEffect(() => {
    const onResize = (): void => {
      if (window.innerWidth >= 768) setSidebarOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className="flex min-h-screen bg-[rgb(var(--df-bg))]">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — always visible on desktop, drawer on mobile */}
      <Sidebar
        tenantName={tenantName}
        userRole={userRole}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:ml-[216px] min-w-0">
        <Topbar
          userName={userName}
          tenantName={tenantName}
          onMenuToggle={() => setSidebarOpen((prev) => !prev)}
        />
        <main className="flex-1 p-4 md:p-5 overflow-y-auto pb-20 md:pb-5">
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <MobileNav />
    </div>
  )
}
