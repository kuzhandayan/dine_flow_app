import { NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const tableSchema = z.object({
  name: z.string().min(1).max(50),
  capacity: z.number().int().min(1).max(50).default(4),
  sortOrder: z.number().int().default(0),
})

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const tables = await prisma.restaurantTable.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json({ tables })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 401 })
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const session = await requireRole(['OWNER', 'MANAGER', 'SUPER_ADMIN'])
    const body: unknown = await req.json()
    const parsed = tableSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }
    const table = await prisma.restaurantTable.create({
      data: {
        tenantId: session.tenantId,
        ...parsed.data,
        createdById: session.userId,
        updatedById: session.userId,
      },
    })
    return NextResponse.json({ table }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 })
  }
}
