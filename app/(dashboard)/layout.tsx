import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<React.JSX.Element> {
  const session = await auth()
  if (!session) redirect('/login')

  return (
    <DashboardShell
      tenantName={session.user.tenantName}
      userRole={session.user.role}
      userName={session.user.name ?? ''}
    >
      {children}
    </DashboardShell>
  )
}
