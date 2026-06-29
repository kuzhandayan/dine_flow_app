import { z } from 'zod'

export const createMenuItemSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  costPrice: z.number().positive().optional(),
  gstRate: z.number().refine((v) => [0, 5, 12, 18, 28].includes(v), {
    message: 'GST rate must be 0, 5, 12, 18, or 28',
  }),
  categoryId: z.string().optional(),
  isAvailable: z.boolean().default(true),
  isVeg: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  sortOrder: z.number().int().default(0),
})

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
