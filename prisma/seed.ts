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
  // ── Super Admin (platform admin) ──────────────────────────────────────
  const adminTenant = await prisma.tenant.upsert({
    where: { slug: 'dineflow-admin' },
    create: {
      name: 'DineFlow Admin',
      slug: 'dineflow-admin',
      email: 'admin@dineflow.in',
      phone: '0000000000',
      isActive: true,
    },
    update: {},
  })

  const adminPassword = await bcrypt.hash('admin1234', 12)
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: adminTenant.id, email: 'admin@dineflow.in' } },
    create: {
      tenantId: adminTenant.id,
      name: 'DineFlow Admin',
      email: 'admin@dineflow.in',
      password: adminPassword,
      role: UserRole.SUPER_ADMIN,
    },
    update: {},
  })

  await prisma.subscription.upsert({
    where: { tenantId: adminTenant.id },
    create: { tenantId: adminTenant.id, type: 'LIFETIME', status: 'ACTIVE' },
    update: {},
  })

  // ── Demo Restaurant (Tenant 1) ─────────────────────────────────────────
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-restaurant' },
    create: {
      name: 'Demo Restaurant',
      slug: 'demo-restaurant',
      gstin: '22AAAAA0000A1Z5',
      gstName: 'Demo Restaurant Pvt Ltd',
      phone: '9999999999',
      email: 'demo@restaurant.com',
    },
    update: {},
  })

  const ownerPassword = await bcrypt.hash('demo1234', 12)
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'owner@demo.com' } },
    create: {
      tenantId: tenant.id,
      name: 'Restaurant Owner',
      email: 'owner@demo.com',
      password: ownerPassword,
      role: UserRole.OWNER,
    },
    update: {},
  })

  const managerPassword = await bcrypt.hash('manager123', 12)
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'manager@demo.com' } },
    create: {
      tenantId: tenant.id,
      name: 'Floor Manager',
      email: 'manager@demo.com',
      password: managerPassword,
      role: UserRole.MANAGER,
    },
    update: {},
  })

  const waiterPassword = await bcrypt.hash('waiter123', 12)
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'waiter@demo.com' } },
    create: {
      tenantId: tenant.id,
      name: 'Demo Waiter',
      email: 'waiter@demo.com',
      password: waiterPassword,
      role: UserRole.WAITER,
    },
    update: {},
  })

  const kitchenPassword = await bcrypt.hash('kitchen123', 12)
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'kitchen@demo.com' } },
    create: {
      tenantId: tenant.id,
      name: 'Chef Station',
      email: 'kitchen@demo.com',
      password: kitchenPassword,
      role: UserRole.KITCHEN,
    },
    update: {},
  })

  const cashierPassword = await bcrypt.hash('cashier123', 12)
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'cashier@demo.com' } },
    create: {
      tenantId: tenant.id,
      name: 'Demo Cashier',
      email: 'cashier@demo.com',
      password: cashierPassword,
      role: UserRole.CASHIER,
    },
    update: {},
  })

  await prisma.gSTConfig.upsert({
    where: { tenantId: tenant.id },
    create: {
      tenantId: tenant.id,
      defaultGSTRate: 5,
      isGSTRegistered: true,
      gstin: '22AAAAA0000A1Z5',
      gstBusinessName: 'Demo Restaurant Pvt Ltd',
    },
    update: {},
  })

  await prisma.subscription.upsert({
    where: { tenantId: tenant.id },
    create: { tenantId: tenant.id, type: 'LIFETIME', status: 'ACTIVE' },
    update: {},
  })

  // Seed minimal menu — only create if not already present (non-destructive)
  const mainCat = await prisma.category.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: 'Main Course' } },
    create: { tenantId: tenant.id, name: 'Main Course', sortOrder: 1 },
    update: {},
  })

  const vegItem = await prisma.menuItem.findFirst({ where: { tenantId: tenant.id, name: 'Paneer Butter Masala' } })
  if (!vegItem) {
    await prisma.menuItem.create({
      data: { tenantId: tenant.id, categoryId: mainCat.id, name: 'Paneer Butter Masala', price: 230, gstRate: 5, costPrice: 90, isVeg: true },
    })
  }
  const nonVegItem = await prisma.menuItem.findFirst({ where: { tenantId: tenant.id, name: 'Chicken Biryani' } })
  if (!nonVegItem) {
    await prisma.menuItem.create({
      data: { tenantId: tenant.id, categoryId: mainCat.id, name: 'Chicken Biryani', price: 320, gstRate: 5, costPrice: 130, isVeg: false },
    })
  }

  // Inventory — upsert only
  const invItems = [
    { name: 'Chicken', unit: 'kg', quantity: 5, minStockLevel: 2, costPerUnit: 250, supplier: 'Fresh Farm' },
    { name: 'Paneer', unit: 'kg', quantity: 3, minStockLevel: 1, costPerUnit: 180, supplier: 'Dairy Fresh' },
  ]
  for (const inv of invItems) {
    const exists = await prisma.inventoryItem.findFirst({ where: { tenantId: tenant.id, name: inv.name } })
    if (!exists) await prisma.inventoryItem.create({ data: { tenantId: tenant.id, ...inv } })
  }

  // ── Second Demo Restaurant (Tenant 2) ─────────────────────────────────
  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'spice-garden' },
    create: {
      name: 'Spice Garden',
      slug: 'spice-garden',
      gstin: '27BBBBB1111B1Z5',
      gstName: 'Spice Garden Foods Pvt Ltd',
      phone: '8888888888',
      email: 'info@spicegarden.in',
    },
    update: {},
  })

  const sg_ownerPassword = await bcrypt.hash('spice1234', 12)
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant2.id, email: 'owner@spicegarden.in' } },
    create: {
      tenantId: tenant2.id,
      name: 'Spice Garden Owner',
      email: 'owner@spicegarden.in',
      password: sg_ownerPassword,
      role: UserRole.OWNER,
    },
    update: {},
  })

  await prisma.gSTConfig.upsert({
    where: { tenantId: tenant2.id },
    create: {
      tenantId: tenant2.id,
      defaultGSTRate: 5,
      isGSTRegistered: true,
      gstin: '27BBBBB1111B1Z5',
      gstBusinessName: 'Spice Garden Foods Pvt Ltd',
    },
    update: {},
  })

  await prisma.subscription.upsert({
    where: { tenantId: tenant2.id },
    create: { tenantId: tenant2.id, type: 'LIFETIME', status: 'ACTIVE' },
    update: {},
  })

  const sg_mainCat = await prisma.category.upsert({
    where: { tenantId_name: { tenantId: tenant2.id, name: 'Mains' } },
    create: { tenantId: tenant2.id, name: 'Mains', sortOrder: 1 },
    update: {},
  })

  const sg_veg = await prisma.menuItem.findFirst({ where: { tenantId: tenant2.id, name: 'Veg Thali' } })
  if (!sg_veg) {
    await prisma.menuItem.create({ data: { tenantId: tenant2.id, categoryId: sg_mainCat.id, name: 'Veg Thali', price: 180, gstRate: 5, costPrice: 70, isVeg: true } })
  }
  const sg_nonveg = await prisma.menuItem.findFirst({ where: { tenantId: tenant2.id, name: 'Chicken Curry' } })
  if (!sg_nonveg) {
    await prisma.menuItem.create({ data: { tenantId: tenant2.id, categoryId: sg_mainCat.id, name: 'Chicken Curry', price: 260, gstRate: 5, costPrice: 110, isVeg: false } })
  }

  const sg_invItems = [
    { name: 'Vegetables Mix', unit: 'kg', quantity: 4, minStockLevel: 1.5, costPerUnit: 50, supplier: 'Fresh Mart' },
    { name: 'Chicken', unit: 'kg', quantity: 0.8, minStockLevel: 2, costPerUnit: 260, supplier: 'Fresh Farm' },
  ]
  for (const inv of sg_invItems) {
    const exists = await prisma.inventoryItem.findFirst({ where: { tenantId: tenant2.id, name: inv.name } })
    if (!exists) await prisma.inventoryItem.create({ data: { tenantId: tenant2.id, ...inv } })
  }

  // ── Tables for Demo Restaurant ────────────────────────────────────────
  const tableNames = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'Counter 1', 'Counter 2']
  for (let i = 0; i < tableNames.length; i++) {
    const name = tableNames[i]!
    const existing = await prisma.restaurantTable.findFirst({ where: { tenantId: tenant.id, name } })
    if (!existing) {
      await prisma.restaurantTable.create({
        data: { tenantId: tenant.id, name, capacity: name.startsWith('Counter') ? 2 : 4, sortOrder: i + 1 },
      })
    }
  }

  // ── Tables for Spice Garden ────────────────────────────────────────────
  const sg_tableNames = ['Table 1', 'Table 2', 'Table 3', 'Table 4', 'VIP Room']
  for (let i = 0; i < sg_tableNames.length; i++) {
    const name = sg_tableNames[i]!
    const existing = await prisma.restaurantTable.findFirst({ where: { tenantId: tenant2.id, name } })
    if (!existing) {
      await prisma.restaurantTable.create({
        data: { tenantId: tenant2.id, name, capacity: name === 'VIP Room' ? 8 : 4, sortOrder: i + 1 },
      })
    }
  }

  // ── Sample Announcement ────────────────────────────────────────────────
  const existingAnnouncement = await prisma.announcement.findFirst({
    where: { title: 'Welcome to DineFlow!' },
  })

  if (!existingAnnouncement) {
    await prisma.announcement.create({
      data: {
        title: 'Welcome to DineFlow!',
        content:
          'Welcome to DineFlow — your complete restaurant POS and management platform.\n\n' +
          'Here\'s what you can do:\n' +
          '• Take orders and manage tables\n' +
          '• Track inventory and get low-stock alerts\n' +
          '• Generate GST-compliant bills (CGST + SGST)\n' +
          '• View sales reports and analytics\n' +
          '• Manage your team with role-based access\n\n' +
          'Need help? Use the Community Chat to connect with other restaurants and our team.',
        targetType: 'ALL',
        isActive: true,
      },
    })
  }

  // ── Sample community message ───────────────────────────────────────────
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

  console.log('✅ Seed complete!')
  console.log('   Admin login:              admin@dineflow.in     / admin1234')
  console.log('   Demo Restaurant owner:    owner@demo.com        / demo1234')
  console.log('   Demo Restaurant manager:  manager@demo.com      / manager123')
  console.log('   Demo Restaurant waiter:   waiter@demo.com       / waiter123')
  console.log('   Demo Restaurant kitchen:  kitchen@demo.com      / kitchen123')
  console.log('   Demo Restaurant cashier:  cashier@demo.com      / cashier123')
  console.log('   Spice Garden owner:       owner@spicegarden.in  / spice1234')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
