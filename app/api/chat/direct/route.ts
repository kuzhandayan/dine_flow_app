import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(): Promise<NextResponse> {
  try {
    await requireRole(['SUPER_ADMIN'])

    const tenants = await prisma.tenant.findMany({
      where: {
        isActive: true,
        directMessages: { some: {} },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        directMessages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { content: true, createdAt: true, isRead: true, fromAdmin: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    const unreadCounts = await prisma.directMessage.groupBy({
      by: ['tenantId'],
      where: { fromAdmin: false, isRead: false },
      _count: { id: true },
    })

    const unreadMap = new Map<string, number>(
      unreadCounts.map((u) => [u.tenantId, u._count.id]),
    )

    const conversations = tenants.map((t) => {
      const last = t.directMessages[0] ?? null
      return {
        tenantId: t.id,
        tenantName: t.name,
        tenantSlug: t.slug,
        lastMessage: last?.content ?? '',
        lastMessageAt: last?.createdAt ?? new Date(0),
        unreadCount: unreadMap.get(t.id) ?? 0,
      }
    })

    conversations.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())

    return NextResponse.json({ conversations })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}
