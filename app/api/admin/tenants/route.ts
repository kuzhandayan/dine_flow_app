import { NextRequest, NextResponse } from 'next/server'
import { requireRole, AuthError } from '@/lib/middleware-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { seedTenantDefaults } from '@/lib/tenant-defaults'

export async function GET(): Promise<NextResponse> {
  try {
    await requireRole(['SUPER_ADMIN'])

    // Exclude admin tenants (tenants that contain a SUPER_ADMIN user)
    const adminTenantIds = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: { tenantId: true },
    }).then((rows) => rows.map((r) => r.tenantId))

    const tenants = await prisma.tenant.findMany({
      where: { id: { notIn: adminTenantIds } },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, orders: true, customers: true, menuItems: true },
        },
        subscription: {
          select: { type: true, status: true, endDate: true },
        },
      },
    })

    // Get revenue per tenant (paid orders only)
    const revenueAgg = await prisma.order.groupBy({
      by: ['tenantId'],
      where: { paymentStatus: 'PAID' },
      _sum: { grandTotal: true },
      _count: { id: true },
    })
    const revenueMap = new Map(revenueAgg.map((r) => [r.tenantId, { revenue: r._sum.grandTotal ?? 0, paidOrders: r._count.id }]))

    const result = tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      email: t.email,
      phone: t.phone,
      address: t.address,
      gstin: t.gstin,
      currency: t.currency,
      isActive: t.isActive,
      isSuspended: t.isSuspended,
      createdAt: t.createdAt,
      staffCount: t._count.users,
      totalOrders: t._count.orders,
      customerCount: t._count.customers,
      menuItemCount: t._count.menuItems,
      totalRevenue: revenueMap.get(t.id)?.revenue ?? 0,
      paidOrders: revenueMap.get(t.id)?.paidOrders ?? 0,
      subscription: t.subscription
        ? { type: t.subscription.type, status: t.subscription.status, expiresAt: t.subscription.endDate }
        : null,
    }))

    return NextResponse.json({ tenants: result })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode })
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}

const createSchema = z.object({
  restaurantName: z.string().min(2).max(80),
  ownerName:      z.string().min(2).max(60),
  email:          z.string().email(),
  password:       z.string().min(6).max(64),
  phone:          z.string().optional(),
  gstin:          z.string().optional(),
  address:        z.string().optional(),
})

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireRole(['SUPER_ADMIN'])
    const body: unknown = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })

    const { restaurantName, ownerName, email, password, phone, gstin, address } = parsed.data

    const emailTaken = await prisma.user.findFirst({ where: { email: email.toLowerCase() } })
    if (emailTaken) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

    // Generate unique slug
    let slug = generateSlug(restaurantName)
    let counter = 1
    while (await prisma.tenant.findUnique({ where: { slug } })) slug = `${generateSlug(restaurantName)}-${counter++}`

    const hashed = await bcrypt.hash(password, 12)

    const tenant = await prisma.$transaction(async (tx) => {
      const t = await tx.tenant.create({
        data: { name: restaurantName, slug, email: email.toLowerCase(), phone: phone ?? null, gstin: gstin ?? null, address: address ?? null },
      })
      await tx.user.create({
        data: { tenantId: t.id, name: ownerName, email: email.toLowerCase(), password: hashed, role: 'OWNER' },
      })
      await tx.gSTConfig.create({ data: { tenantId: t.id, defaultGSTRate: 5, isGSTRegistered: false } })
      await tx.subscription.create({ data: { tenantId: t.id, type: 'LIFETIME', status: 'ACTIVE' } })
      await seedTenantDefaults(tx, t.id)
      return t
    })

    return NextResponse.json({ tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug } }, { status: 201 })
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: err.statusCode })
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 })
  }
}
