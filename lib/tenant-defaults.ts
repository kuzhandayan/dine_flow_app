import type { PrismaClient } from '@prisma/client'

type TxClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>

/**
 * Seeds default categories, menu items, inventory, and tables for a newly created tenant.
 * Called inside the registration transaction so every new restaurant starts with usable data.
 * Everything here is a starting point — owners can edit or delete any of it.
 */
export async function seedTenantDefaults(tx: TxClient, tenantId: string): Promise<void> {
  // ── Categories ──────────────────────────────────────────────────────────
  const categories = await Promise.all([
    tx.category.create({ data: { tenantId, name: 'Main Course', sortOrder: 1 } }),
    tx.category.create({ data: { tenantId, name: 'Beverages',   sortOrder: 2 } }),
  ])

  const [mainCourse, beverages] = categories

  // ── Menu Items ──────────────────────────────────────────────────────────
  await tx.menuItem.createMany({
    data: [
      { tenantId, categoryId: mainCourse!.id, name: 'Paneer Butter Masala', price: 230, gstRate: 5, costPrice: 90,  isVeg: true  },
      { tenantId, categoryId: beverages!.id,  name: 'Masala Chai',          price:  40, gstRate: 5, costPrice: 10,  isVeg: true  },
    ],
  })

  // ── Inventory ───────────────────────────────────────────────────────────
  await tx.inventoryItem.createMany({
    data: [
      { tenantId, name: 'Paneer',      unit: 'kg', quantity: 4, minStockLevel: 1, costPerUnit: 180, supplier: 'Dairy Supplier'  },
      { tenantId, name: 'Basmati Rice', unit: 'kg', quantity: 10, minStockLevel: 3, costPerUnit: 90, supplier: 'Grocery Store'  },
    ],
  })

  // ── Tables ──────────────────────────────────────────────────────────────
  await tx.restaurantTable.createMany({
    data: [
      { tenantId, name: 'T1', capacity: 4, sortOrder: 1 },
      { tenantId, name: 'T2', capacity: 4, sortOrder: 2 },
    ],
  })
}
