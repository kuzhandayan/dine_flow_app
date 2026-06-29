import { z } from 'zod'

export const createCustomerSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(10).max(15).regex(/^\d+$/, 'Phone must contain only digits'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
