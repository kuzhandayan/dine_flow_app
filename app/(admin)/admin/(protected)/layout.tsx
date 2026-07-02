import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/admin/AdminShell'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: { template: '%s | DineFlow Admin', default: 'Admin' } }

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}): Promise<React.JSX.Element> {
  const session = await auth()

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/admin/login')
  }

  return <AdminShell session={session}>{children}</AdminShell>
}
