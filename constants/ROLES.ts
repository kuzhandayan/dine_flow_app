import type { UserRole } from '@prisma/client'

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OWNER: 'OWNER',
  MANAGER: 'MANAGER',
  WAITER: 'WAITER',
  KITCHEN: 'KITCHEN',
} as const

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  OWNER: 'Owner',
  MANAGER: 'Manager',
  WAITER: 'Waiter',
  KITCHEN: 'Kitchen Staff',
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
    'dashboard', 'orders', 'new-order', 'check-order', 'customers',
  ],
  KITCHEN: [
    'dashboard', 'orders', 'check-order',
  ],
}

export const INVITABLE_ROLES: UserRole[] = ['MANAGER', 'WAITER', 'KITCHEN']
