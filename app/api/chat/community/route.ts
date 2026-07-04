import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { sendMessageSchema } from '@/lib/validations/chat'

export async function GET(req: Request): Promise<NextResponse> {
  try {
    await requireAuth()
    const url = new URL(req.url)
    const before = url.searchParams.get('before')

    const messages = await prisma.communityMessage.findMany({
      where: before ? { createdAt: { lt: new Date(before) } } : {},
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ messages: messages.reverse() })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const body: unknown = await req.json()
    const parsed = sendMessageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    const isAdmin = session.role === 'SUPER_ADMIN'
    const message = await prisma.communityMessage.create({
      data: {
        content: parsed.data.content,
        tenantId: isAdmin ? null : session.tenantId,
        senderName: isAdmin ? 'Admin' : session.tenantName,
        isAdmin,
        createdById: session.userId,
        updatedById: session.userId,
      },
    })

    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
