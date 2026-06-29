import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const isAdmin = session.role === 'SUPER_ADMIN'

    if (isAdmin) {
      const directUnread = await prisma.directMessage.count({
        where: { fromAdmin: false, isRead: false },
      })
      return NextResponse.json({ community: 0, direct: directUnread })
    }

    const tenantId = session.tenantId
    const directUnread = await prisma.directMessage.count({
      where: { tenantId, fromAdmin: true, isRead: false },
    })

    return NextResponse.json({ community: 0, direct: directUnread })
  } catch {
    return NextResponse.json({ community: 0, direct: 0 })
  }
}
