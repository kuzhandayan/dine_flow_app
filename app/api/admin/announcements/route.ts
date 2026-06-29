import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { createAnnouncementSchema } from '@/lib/validations/announcement'
import type { Announcement, AnnouncementTenant, AnnouncementRead } from '@prisma/client'

type AnnouncementWithRelations = Announcement & {
  targets: (AnnouncementTenant & { tenant: { id: string; name: string; slug: string } })[]
  reads: Pick<AnnouncementRead, 'tenantId'>[]
}

export async function GET(): Promise<NextResponse> {
  try {
    await requireRole(['SUPER_ADMIN'])

    const announcements = await prisma.announcement.findMany({
      include: {
        targets: { include: { tenant: { select: { id: true, name: true, slug: true } } } },
        reads: { select: { tenantId: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const tenantCount = await prisma.tenant.count({ where: { isActive: true } })

    const result = (announcements as AnnouncementWithRelations[]).map((a) => ({
      ...a,
      readCount: a.reads.length,
      totalTargets: a.targetType === 'ALL' ? tenantCount : a.targets.length,
    }))

    return NextResponse.json({ announcements: result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    await requireRole(['SUPER_ADMIN'])

    const body: unknown = await req.json()
    const parsed = createAnnouncementSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    const { title, content, targetType, tenantIds } = parsed.data

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        targetType,
        ...(targetType === 'SELECTED' && tenantIds?.length
          ? {
              targets: {
                create: tenantIds.map((tenantId) => ({ tenantId })),
              },
            }
          : {}),
      },
      include: {
        targets: { include: { tenant: { select: { id: true, name: true } } } },
      },
    })

    return NextResponse.json({ announcement }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
