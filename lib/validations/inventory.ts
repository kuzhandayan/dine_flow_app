import { z } from 'zod'

export const createInventoryItemSchema = z.object({
  name: z.string().min(1).max(100),
  unit: z.string().min(1).max(20),
  quantity: z.number().min(0),
  minStockLevel: z.number().min(0),
  costPerUnit: z.number().min(0),
  supplier: z.string().optional(),
})

export const restockSchema = z.object({
  quantityAdded: z.number().positive(),
  costPerUnit: z.number().positive().optional(),
  supplier: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>
export type RestockInput = z.infer<typeof restockSchema>
