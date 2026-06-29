import { z } from 'zod'

export const createOrderSchema = z.object({
  customerId: z.string().min(1),
  type: z.enum(['DINE_IN', 'PARCEL', 'DELIVERY']),
  tableNumber: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    menuItemId: z.string().min(1),
    quantity: z.number().int().min(1),
    notes: z.string().optional(),
  })).min(1, 'Order must have at least one item'),
})

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'READY', 'SERVED', 'DELIVERED', 'COMPLETED', 'CANCELLED']),
})

export const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  method: z.enum(['CASH', 'CARD', 'UPI']),
  reference: z.string().optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>
