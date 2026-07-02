import path from 'node:path'
import { config } from 'dotenv'

config({ path: path.join(process.cwd(), '.env.local') })

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env['DATABASE_URL'] })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main(): Promise<void> {
  const adminTenant = await prisma.tenant.upsert({
    where: { slug: 'dineflow-admin' },
    create: {
      name: 'DineFlow Admin',
      slug: 'dineflow-admin',
      email: 'sabbari.kv013@gmail.com',
      phone: '0000000000',
      isActive: true,
    },
    update: { email: 'sabbari.kv013@gmail.com' },
  })

  const adminPassword = await bcrypt.hash('Sabbari@123', 12)

  // Try upsert with new email first; fall back to old email if the record was already migrated
  const existingAdmin = await prisma.user.findFirst({
    where: { tenantId: adminTenant.id, role: UserRole.SUPER_ADMIN },
  })

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { email: 'sabbari.kv013@gmail.com', password: adminPassword },
    })
  } else {
    await prisma.user.create({
      data: {
        tenantId: adminTenant.id,
        name: 'DineFlow Admin',
        email: 'sabbari.kv013@gmail.com',
        password: adminPassword,
        role: UserRole.SUPER_ADMIN,
      },
    })
  }

  await prisma.subscription.upsert({
    where: { tenantId: adminTenant.id },
    create: { tenantId: adminTenant.id, type: 'LIFETIME', status: 'ACTIVE' },
    update: {},
  })

  const existingMsg = await prisma.communityMessage.findFirst()
  if (!existingMsg) {
    await prisma.communityMessage.create({
      data: {
        tenantId: null,
        senderName: 'Admin',
        isAdmin: true,
        content: 'Welcome to the DineFlow Community! Feel free to share tips, ask questions, or give feedback here.',
      },
    })
  }
}

main()
  .catch((err) => { process.stderr.write(String(err) + '\n'); process.exit(1) })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
