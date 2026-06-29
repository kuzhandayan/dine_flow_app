import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const url = new URL(req.url)
    const q = url.searchParams.get('q')?.trim()

    const customers = await prisma.customer.findMany({
      where: {
        tenantId: session.tenantId,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q } },
              ],
            }
          : {}),
      },
      orderBy: { name: 'asc' },
      take: 20,
    })

    return NextResponse.json({ customers })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 401 })
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const body: unknown = await req.json()
    const schema = z.object({
      name: z.string().min(1),
      phone: z.string().min(10).max(15),
      email: z.string().email().optional().or(z.literal('')),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }
    const customer = await prisma.customer.create({
      data: {
        tenantId: session.tenantId,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
      },
    })
    return NextResponse.json({ customer }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 })
  }
}
