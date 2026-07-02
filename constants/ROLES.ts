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

// Roles where the owner can customise module access
export const CUSTOMIZABLE_ROLES: UserRole[] = ['WAITER', 'KITCHEN', 'CASHIER']

// Default permissions per role — used when creating staff or as fallback for empty permissions[]
export const DEFAULT_PERMISSIONS: Partial<Record<UserRole, string[]>> = {
  WAITER:  ['new-order', 'orders', 'kitchen', 'check-order', 'customers'],
  KITCHEN: ['kitchen', 'menu', 'inventory'],
  CASHIER: ['check-order'],
}

export interface ModuleDef {
  key: string
  label: string
  group: string
  description: string
}

// All modules an owner can grant / revoke on staff accounts
export const ASSIGNABLE_MODULES: ModuleDef[] = [
  { key: 'dashboard',     label: 'Dashboard',      group: 'Operations', description: 'Revenue stats & order overview' },
  { key: 'new-order',     label: 'New Order',       group: 'Operations', description: 'Create new orders for customers' },
  { key: 'orders',        label: 'Orders',          group: 'Operations', description: 'View & manage all orders' },
  { key: 'kitchen',       label: 'Kitchen View',    group: 'Operations', description: 'Kitchen display & order queue' },
  { key: 'check-order',   label: 'Check Order',     group: 'Operations', description: 'Look up any order by ID' },
  { key: 'menu',          label: 'Menu',            group: 'Management', description: 'View menu items & prices' },
  { key: 'inventory',     label: 'Inventory',       group: 'Management', description: 'View stock levels' },
  { key: 'customers',     label: 'Customers',       group: 'Management', description: 'View customer list & history' },
  { key: 'reports',       label: 'Reports',         group: 'Insights',   description: 'Revenue & GST reports' },
  { key: 'announcements', label: 'Announcements',   group: 'Updates',    description: 'View team announcements' },
  { key: 'chat',          label: 'Chat',            group: 'Updates',    description: 'Team messaging' },
]
