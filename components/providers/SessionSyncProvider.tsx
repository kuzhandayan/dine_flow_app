'use client'

import { useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

interface SessionSyncProviderProps {
  children: React.ReactNode
}

export function SessionSyncProvider({ children }: SessionSyncProviderProps): React.JSX.Element {
  const { status, update } = useSession()
  const pathname = usePathname()
  const prevPathname = useRef<string>(pathname)
  const updateRef = useRef(update)

  // Keep updateRef current without causing effect re-runs
  useEffect(() => {
    updateRef.current = update
  })

  // Auto-logout when JWT expires or session is invalidated
  useEffect(() => {
    if (status === 'unauthenticated') {
      void signOut({ callbackUrl: '/login' })
    }
  }, [status])

  // Refresh session on every route change — picks up currency/tenantName changes
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname
      void updateRef.current()
    }
  }, [pathname])

  // Refresh when user returns to the tab after being away
  useEffect(() => {
    function handleVisibilityChange(): void {
      if (document.visibilityState === 'visible') {
        void updateRef.current()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  return <>{children}</>
}
