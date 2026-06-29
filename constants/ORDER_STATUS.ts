import type { OrderStatus, PaymentStatus } from '@prisma/client'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'Cooking',
  READY: 'Ready',
  SERVED: 'Served',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400',
  IN_PROGRESS: 'bg-blue-500/15 text-blue-400',
  READY: 'bg-purple-500/15 text-purple-400',
  SERVED: 'bg-green-500/15 text-green-400',
  DELIVERED: 'bg-green-500/15 text-green-400',
  COMPLETED: 'bg-green-500/20 text-green-400',
  CANCELLED: 'bg-red-500/15 text-red-400',
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: 'Unpaid',
  PARTIAL: 'Partial',
  PAID: 'Paid',
  REFUNDED: 'Refunded',
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  UNPAID: 'bg-red-500/15 text-red-400',
  PARTIAL: 'bg-yellow-500/15 text-yellow-400',
  PAID: 'bg-green-500/20 text-green-400',
  REFUNDED: 'bg-slate-500/15 text-slate-400',
}

export const TERMINAL_STATUSES: OrderStatus[] = ['COMPLETED', 'CANCELLED']

export function canTransitionTo(from: OrderStatus, to: OrderStatus): boolean {
  if (TERMINAL_STATUSES.includes(from)) return false
  const flow: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['READY', 'CANCELLED'],
    READY: ['SERVED', 'DELIVERED', 'COMPLETED'],
    SERVED: ['COMPLETED'],
    DELIVERED: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
  }
  return flow[from].includes(to)
}
