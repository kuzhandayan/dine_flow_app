import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import type { AnnouncementWithReadStatus } from '@/types/announcement'

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const tenantId = session.tenantId

    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { targetType: 'ALL' },
          { targetType: 'SELECTED', targets: { some: { tenantId } } },
        ],
      },
      include: {
        reads: { where: { tenantId }, select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result: AnnouncementWithReadStatus[] = announcements.map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      targetType: a.targetType,
      isActive: a.isActive,
      createdAt: a.createdAt,
      isRead: a.reads.length > 0,
    }))

    return NextResponse.json({ announcements: result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}
