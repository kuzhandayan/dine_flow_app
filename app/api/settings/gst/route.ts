import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const config = await prisma.gSTConfig.findUnique({ where: { tenantId: session.tenantId } })
    return NextResponse.json({
      config: config ?? {
        gstEnabled: true,
        defaultGSTRate: 5,
        isGSTRegistered: false,
        gstin: null,
        gstBusinessName: null,
        gstAddress: null,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 401 })
  }
}

const schema = z.object({
  gstEnabled: z.boolean(),
  defaultGSTRate: z.number().min(0).max(100),
  isGSTRegistered: z.boolean(),
  gstin: z.string().nullable().optional(),
  gstBusinessName: z.string().nullable().optional(),
  gstAddress: z.string().nullable().optional(),
})

export async function PUT(req: Request): Promise<NextResponse> {
  try {
    const session = await requireAuth()
    const body: unknown = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
    }
    const { gstEnabled, defaultGSTRate, isGSTRegistered, gstin, gstBusinessName, gstAddress } = parsed.data
    const data = {
      gstEnabled,
      defaultGSTRate,
      isGSTRegistered,
      gstin: gstin ?? null,
      gstBusinessName: gstBusinessName ?? null,
      gstAddress: gstAddress ?? null,
    }
    const config = await prisma.gSTConfig.upsert({
      where: { tenantId: session.tenantId },
      create: { tenantId: session.tenantId, ...data, createdById: session.userId, updatedById: session.userId },
      update: { ...data, updatedById: session.userId },
    })
    return NextResponse.json({ config })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 })
  }
}
