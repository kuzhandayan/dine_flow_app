import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const categories = await prisma.category.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json({ categories })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 401 })
  }
}

const createCategorySchema = z.object({
  name: z.string().min(1),
  sortOrder: z.number().int().default(0),
})

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const body: unknown = await req.json()
    const parsed = createCategorySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        tenantId: session.tenantId,
        name: parsed.data.name,
        sortOrder: parsed.data.sortOrder,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 })
  }
}
