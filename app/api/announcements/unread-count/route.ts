import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const tenantId = session.tenantId

    const total = await prisma.announcement.count({
      where: {
        isActive: true,
        OR: [
          { targetType: 'ALL' },
          { targetType: 'SELECTED', targets: { some: { tenantId } } },
        ],
      },
    })

    const read = await prisma.announcementRead.count({ where: { tenantId } })

    return NextResponse.json({ count: Math.max(0, total - read) })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}
