import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const categories = await prisma.category.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      include: {
        menuItems: {
          where: { tenantId: session.tenantId, isAvailable: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json({ categories })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 401 })
  }
}
