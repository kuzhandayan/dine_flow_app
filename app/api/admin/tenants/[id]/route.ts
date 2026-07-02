import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  isActive: z.boolean().optional(),
  isSuspended: z.boolean().optional(),
  subscription: z.object({
    type: z.enum(['LIFETIME', 'DURATION']).optional(),
    status: z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED', 'CLOSED']).optional(),
    endDate: z.string().nullable().optional(),
  }).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    await requireRole(['SUPER_ADMIN'])
    const { id } = await params
    const body: unknown = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })

    const { isActive, isSuspended, subscription } = parsed.data

    // Update tenant flags
    if (isActive !== undefined || isSuspended !== undefined) {
      await prisma.tenant.update({
        where: { id },
        data: {
          ...(isActive !== undefined ? { isActive } : {}),
          ...(isSuspended !== undefined ? { isSuspended } : {}),
        },
      })
    }

    // Update subscription
    if (subscription) {
      const updateData: Record<string, unknown> = {}
      if (subscription.type !== undefined) updateData['type'] = subscription.type
      if (subscription.status !== undefined) updateData['status'] = subscription.status
      if (subscription.endDate !== undefined) {
        updateData['endDate'] = subscription.endDate ? new Date(subscription.endDate) : null
      }

      await prisma.subscription.upsert({
        where: { tenantId: id },
        create: {
          tenantId: id,
          type: subscription.type ?? 'LIFETIME',
          status: subscription.status ?? 'ACTIVE',
          endDate: subscription.endDate ? new Date(subscription.endDate) : null,
        },
        update: updateData,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode })
    return NextResponse.json({ error: 'Failed to update tenant' }, { status: 500 })
  }
}
