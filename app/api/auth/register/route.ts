import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { registerSchema } from '@/lib/validations/auth'
import { seedTenantDefaults } from '@/lib/tenant-defaults'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function ensureUniqueSlug(base: string): Promise<string> {
  let slug = base
  let counter = 1
  while (await prisma.tenant.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`
  }
  return slug
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json() as unknown
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 })
    }

    const { restaurantName, ownerName, email, password } = parsed.data

    const existingGlobal = await prisma.user.findFirst({ where: { email: email.toLowerCase() } })
    if (existingGlobal) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const slug = await ensureUniqueSlug(generateSlug(restaurantName))
    const hashedPassword = await hashPassword(password)

    await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: restaurantName, slug },
      })

      await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: ownerName,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: 'OWNER',
        },
      })

      await tx.gSTConfig.create({
        data: {
          tenantId: tenant.id,
          defaultGSTRate: 5,
          isGSTRegistered: false,
        },
      })

      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          type: 'LIFETIME',
          status: 'ACTIVE',
        },
      })

      await seedTenantDefaults(tx, tenant.id)
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 })
  }
}
