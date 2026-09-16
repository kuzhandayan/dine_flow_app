import type { Prisma } from '@prisma/client'

export interface OrderStatusLogEntry {
  status: string
  at: string
  fromStatus?: string
  reason?: string
}

export function appendStatusLog(existing: unknown, entry: OrderStatusLogEntry): Prisma.InputJsonValue {
  const log = Array.isArray(existing) ? (existing as OrderStatusLogEntry[]) : []
  return [...log, entry] as unknown as Prisma.InputJsonValue
}
