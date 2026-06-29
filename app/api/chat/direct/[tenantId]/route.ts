import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { sendMessageSchema } from '@/lib/validations/chat'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tenantId: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const { tenantId } = await params

    const isAdmin = session.role === 'SUPER_ADMIN'
    if (!isAdmin && session.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!isAdmin) {
      await prisma.directMessage.updateMany({
        where: { tenantId, fromAdmin: true, isRead: false },
        data: { isRead: true },
      })
    } else {
      await prisma.directMessage.updateMany({
        where: { tenantId, fromAdmin: false, isRead: false },
        data: { isRead: true },
      })
    }

    const messages = await prisma.directMessage.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({ messages })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ tenantId: string }> },
): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const { tenantId } = await params

    const isAdmin = session.role === 'SUPER_ADMIN'
    if (!isAdmin && session.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body: unknown = await req.json()
    const parsed = sendMessageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    const message = await prisma.directMessage.create({
      data: {
        tenantId,
        content: parsed.data.content,
        fromAdmin: isAdmin,
        senderName: isAdmin ? 'Admin' : session.tenantName,
        isRead: false,
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
