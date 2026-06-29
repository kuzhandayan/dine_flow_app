import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { updateAnnouncementSchema } from '@/lib/validations/announcement'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireRole(['SUPER_ADMIN'])
    const { id } = await params
    const body: unknown = await req.json()
    const parsed = updateAnnouncementSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    const { title, content, targetType, tenantIds } = parsed.data

    await prisma.announcementTenant.deleteMany({ where: { announcementId: id } })

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(targetType !== undefined && { targetType }),
        ...(targetType === 'SELECTED' && tenantIds?.length
          ? {
              targets: {
                create: tenantIds.map((tenantId) => ({ tenantId })),
              },
            }
          : {}),
      },
    })

    return NextResponse.json({ announcement })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    await requireRole(['SUPER_ADMIN'])
    const { id } = await params
    await prisma.announcement.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
