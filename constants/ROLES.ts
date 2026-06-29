import type { UserRole } from '@prisma/client'

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  WAITER: 'WAITER',
  KITCHEN: 'KITCHEN',
  CASHIER: 'CASHIER',
} as const

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'Owner',
  MANAGER: 'Manager',
  WAITER: 'Waiter',
  KITCHEN: 'Kitchen Staff',
  CASHIER: 'Cashier',
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['*'],
  OWNER: [
    'dashboard', 'orders', 'new-order', 'check-order',
    'menu', 'inventory', 'customers',
    'reports', 'settings', 'settings/gst', 'settings/team',
  ],
  MANAGER: [
    'dashboard', 'orders', 'new-order', 'check-order',
    'menu', 'inventory', 'customers', 'reports', 'settings/team',
  ],
  WAITER: [
    'orders', 'new-order', 'kitchen', 'check-order', 'customers',
  ],
  KITCHEN: [
    'kitchen', 'menu', 'inventory',
  ],
  CASHIER: [
    'check-order',
  ],
}

export const INVITABLE_ROLES: UserRole[] = ['MANAGER', 'WAITER', 'KITCHEN', 'CASHIER']
