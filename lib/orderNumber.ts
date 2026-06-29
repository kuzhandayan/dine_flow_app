import { prisma } from '@/lib/prisma'

export async function generateOrderNumber(tenantId: string): Promise<string> {
  const count = await prisma.order.count({ where: { tenantId } })
  const num = String(count + 1).padStart(6, '0')
  return `ORD-${num}`
}
