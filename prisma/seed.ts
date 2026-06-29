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

  const categories = await Promise.all([
    prisma.category.upsert({ where: { tenantId_name: { tenantId: tenant.id, name: 'Starter' } }, create: { tenantId: tenant.id, name: 'Starter', sortOrder: 1 }, update: {} }),
    prisma.category.upsert({ where: { tenantId_name: { tenantId: tenant.id, name: 'Main Course' } }, create: { tenantId: tenant.id, name: 'Main Course', sortOrder: 2 }, update: {} }),
    prisma.category.upsert({ where: { tenantId_name: { tenantId: tenant.id, name: 'Bread' } }, create: { tenantId: tenant.id, name: 'Bread', sortOrder: 3 }, update: {} }),
    prisma.category.upsert({ where: { tenantId_name: { tenantId: tenant.id, name: 'Rice' } }, create: { tenantId: tenant.id, name: 'Rice', sortOrder: 4 }, update: {} }),
    prisma.category.upsert({ where: { tenantId_name: { tenantId: tenant.id, name: 'Drinks' } }, create: { tenantId: tenant.id, name: 'Drinks', sortOrder: 5 }, update: {} }),
    prisma.category.upsert({ where: { tenantId_name: { tenantId: tenant.id, name: 'Dessert' } }, create: { tenantId: tenant.id, name: 'Dessert', sortOrder: 6 }, update: {} }),
  ])

  const [starter, mainCourse, bread, rice, drinks, dessert] = categories

  const menuItems = [
    { name: 'Paneer Tikka', cat: starter.id, price: 220, gst: 5, cost: 80, veg: true },
    { name: 'Samosa (2 pcs)', cat: starter.id, price: 60, gst: 5, cost: 15, veg: true },
    { name: 'Chicken 65', cat: starter.id, price: 200, gst: 5, cost: 80, veg: false },
    { name: 'Veg Soup', cat: starter.id, price: 90, gst: 5, cost: 20, veg: true },
    { name: 'Butter Chicken', cat: mainCourse.id, price: 280, gst: 5, cost: 120, veg: false },
    { name: 'Dal Makhani', cat: mainCourse.id, price: 180, gst: 5, cost: 60, veg: true },
    { name: 'Chicken Biryani', cat: mainCourse.id, price: 320, gst: 5, cost: 130, veg: false },
    { name: 'Veg Biryani', cat: mainCourse.id, price: 240, gst: 5, cost: 80, veg: true },
    { name: 'Paneer Butter Masala', cat: mainCourse.id, price: 230, gst: 5, cost: 90, veg: true },
    { name: 'Butter Naan', cat: bread.id, price: 40, gst: 5, cost: 10, veg: true },
    { name: 'Tandoori Roti', cat: bread.id, price: 30, gst: 5, cost: 8, veg: true },
    { name: 'Garlic Naan', cat: bread.id, price: 50, gst: 5, cost: 12, veg: true },
    { name: 'Jeera Rice', cat: rice.id, price: 120, gst: 5, cost: 30, veg: true },
    { name: 'Plain Rice', cat: rice.id, price: 80, gst: 5, cost: 20, veg: true },
    { name: 'Mango Lassi', cat: drinks.id, price: 80, gst: 12, cost: 25, veg: true },
    { name: 'Cold Coffee', cat: drinks.id, price: 100, gst: 12, cost: 30, veg: true },
    { name: 'Fresh Lime Soda', cat: drinks.id, price: 60, gst: 12, cost: 15, veg: true },
    { name: 'Mineral Water', cat: drinks.id, price: 30, gst: 5, cost: 10, veg: true },
    { name: 'Gulab Jamun', cat: dessert.id, price: 90, gst: 5, cost: 20, veg: true },
    { name: 'Ice Cream', cat: dessert.id, price: 80, gst: 5, cost: 25, veg: true },
  ]

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: {
        id: (await prisma.menuItem.findFirst({ where: { tenantId: tenant.id, name: item.name } }))?.id ?? 'nonexistent',
      },
      create: {
        tenantId: tenant.id,
        categoryId: item.cat,
        name: item.name,
        price: item.price,
        gstRate: item.gst,
        costPrice: item.cost,
        isVeg: item.veg,
      },
      update: {},
    })
  }

  await prisma.inventoryItem.upsert({
    where: { id: (await prisma.inventoryItem.findFirst({ where: { tenantId: tenant.id, name: 'Chicken' } }))?.id ?? 'nonexistent' },
    create: { tenantId: tenant.id, name: 'Chicken', unit: 'kg', quantity: 5, minStockLevel: 2, costPerUnit: 250, supplier: 'Fresh Farm' },
    update: {},
  })
  await prisma.inventoryItem.upsert({
    where: { id: (await prisma.inventoryItem.findFirst({ where: { tenantId: tenant.id, name: 'Paneer' } }))?.id ?? 'nonexistent' },
    create: { tenantId: tenant.id, name: 'Paneer', unit: 'kg', quantity: 3, minStockLevel: 1, costPerUnit: 180, supplier: 'Dairy Fresh' },
    update: {},
  })
  await prisma.inventoryItem.upsert({
    where: { id: (await prisma.inventoryItem.findFirst({ where: { tenantId: tenant.id, name: 'Flour (Maida)' } }))?.id ?? 'nonexistent' },
    create: { tenantId: tenant.id, name: 'Flour (Maida)', unit: 'kg', quantity: 10, minStockLevel: 3, costPerUnit: 40, supplier: 'Local Market' },
    update: {},
  })
  await prisma.inventoryItem.upsert({
    where: { id: (await prisma.inventoryItem.findFirst({ where: { tenantId: tenant.id, name: 'Basmati Rice' } }))?.id ?? 'nonexistent' },
    create: { tenantId: tenant.id, name: 'Basmati Rice', unit: 'kg', quantity: 8, minStockLevel: 3, costPerUnit: 80, supplier: 'Local Market' },
    update: {},
  })
  await prisma.inventoryItem.upsert({
    where: { id: (await prisma.inventoryItem.findFirst({ where: { tenantId: tenant.id, name: 'Milk' } }))?.id ?? 'nonexistent' },
    create: { tenantId: tenant.id, name: 'Milk', unit: 'litre', quantity: 6, minStockLevel: 2, costPerUnit: 60, supplier: 'Dairy Fresh' },
    update: {},
  })
  await prisma.inventoryItem.upsert({
    where: { id: (await prisma.inventoryItem.findFirst({ where: { tenantId: tenant.id, name: 'Tomatoes' } }))?.id ?? 'nonexistent' },
    create: { tenantId: tenant.id, name: 'Tomatoes', unit: 'kg', quantity: 1.5, minStockLevel: 2, costPerUnit: 30, supplier: 'Veggie Mart' },
    update: {},
  })

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

  const sg_categories = await Promise.all([
    prisma.category.upsert({ where: { tenantId_name: { tenantId: tenant2.id, name: 'Appetizers' } }, create: { tenantId: tenant2.id, name: 'Appetizers', sortOrder: 1 }, update: {} }),
    prisma.category.upsert({ where: { tenantId_name: { tenantId: tenant2.id, name: 'Mains' } }, create: { tenantId: tenant2.id, name: 'Mains', sortOrder: 2 }, update: {} }),
    prisma.category.upsert({ where: { tenantId_name: { tenantId: tenant2.id, name: 'Beverages' } }, create: { tenantId: tenant2.id, name: 'Beverages', sortOrder: 3 }, update: {} }),
  ])

  const [sg_app, sg_main, sg_bev] = sg_categories

  const sg_items = [
    { name: 'Spring Rolls', cat: sg_app.id, price: 120, gst: 5, cost: 40, veg: true },
    { name: 'Garlic Bread', cat: sg_app.id, price: 90, gst: 5, cost: 25, veg: true },
    { name: 'Chicken Curry', cat: sg_main.id, price: 260, gst: 5, cost: 110, veg: false },
    { name: 'Veg Thali', cat: sg_main.id, price: 180, gst: 5, cost: 70, veg: true },
    { name: 'Masala Chai', cat: sg_bev.id, price: 30, gst: 5, cost: 8, veg: true },
    { name: 'Buttermilk', cat: sg_bev.id, price: 40, gst: 5, cost: 10, veg: true },
  ]

  for (const item of sg_items) {
    const existing = await prisma.menuItem.findFirst({ where: { tenantId: tenant2.id, name: item.name } })
    if (!existing) {
      await prisma.menuItem.create({
        data: {
          tenantId: tenant2.id,
          categoryId: item.cat,
          name: item.name,
          price: item.price,
          gstRate: item.gst,
          costPrice: item.cost,
          isVeg: item.veg,
        },
      })
    }
  }

  await prisma.inventoryItem.upsert({
    where: { id: (await prisma.inventoryItem.findFirst({ where: { tenantId: tenant2.id, name: 'Vegetables Mix' } }))?.id ?? 'nonexistent' },
    create: { tenantId: tenant2.id, name: 'Vegetables Mix', unit: 'kg', quantity: 4, minStockLevel: 1.5, costPerUnit: 50, supplier: 'Fresh Mart' },
    update: {},
  })
  await prisma.inventoryItem.upsert({
    where: { id: (await prisma.inventoryItem.findFirst({ where: { tenantId: tenant2.id, name: 'Chicken (Spice Garden)' } }))?.id ?? 'nonexistent' },
    create: { tenantId: tenant2.id, name: 'Chicken (Spice Garden)', unit: 'kg', quantity: 0.8, minStockLevel: 2, costPerUnit: 260, supplier: 'Fresh Farm' },
    update: {},
  })

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
  console.log('   Admin login:           admin@dineflow.in   / admin1234')
  console.log('   Demo Restaurant owner: owner@demo.com      / demo1234')
  console.log('   Demo Restaurant mgr:   manager@demo.com    / manager123')
  console.log('   Spice Garden owner:    owner@spicegarden.in / spice1234')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
