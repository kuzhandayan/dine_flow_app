import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'

export async function GET(): Promise<NextResponse> {
  try {
    await requireRole(['SUPER_ADMIN'])

    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, email: true, phone: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ tenants })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unauthorized'
    return NextResponse.json({ error: msg }, { status: 401 })
  }
}
