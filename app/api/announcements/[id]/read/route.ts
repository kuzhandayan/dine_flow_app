import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const tenantId = session.tenantId
    const { id: announcementId } = await params

    await prisma.announcementRead.upsert({
      where: { announcementId_tenantId: { announcementId, tenantId } },
      create: { announcementId, tenantId, createdById: session.userId, updatedById: session.userId },
      update: { readAt: new Date(), updatedById: session.userId },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
