'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  UserPlus, Loader2, Eye, EyeOff, MoreVertical,
  UserCheck, UserX, Trash2, RefreshCw, ChefHat,
  UtensilsCrossed, Search, ShieldCheck,
} from 'lucide-react'

type StaffRole = 'WAITER' | 'KITCHEN' | 'CASHIER' | 'MANAGER'

interface TeamUser {
  id: string
  name: string
  email: string
  role: StaffRole
  isActive: boolean
  createdAt: string
}

const ROLE_META: Record<StaffRole, { label: string; icon: React.ReactNode; badge: string }> = {
  MANAGER: {
    label: 'Manager',
    icon: <ShieldCheck className="w-3.5 h-3.5" />,
    badge: 'bg-purple-400/15 text-purple-400 border-purple-400/25',
  },
  WAITER: {
    label: 'Waiter',
    icon: <UtensilsCrossed className="w-3.5 h-3.5" />,
    badge: 'bg-blue-400/15 text-blue-400 border-blue-400/25',
  },
  KITCHEN: {
    label: 'Kitchen',
    icon: <ChefHat className="w-3.5 h-3.5" />,
    badge: 'bg-orange-400/15 text-orange-400 border-orange-400/25',
  },
  CASHIER: {
    label: 'Cashier',
    icon: <Search className="w-3.5 h-3.5" />,
    badge: 'bg-green-400/15 text-green-400 border-green-400/25',
  },
}

const ROLE_ACCESS: Record<StaffRole, string> = {
  MANAGER: 'All sections except Owner-only settings',
  WAITER: 'Dashboard, Orders, New Order, Kitchen View, Check Order, Customers',
  KITCHEN: 'Kitchen View (default), Menu (view), Inventory',
  CASHIER: 'Check Order only',
}

const INITIAL_FORM = { name: '', email: '', password: '', role: 'WAITER' as StaffRole }

export default function TeamPage(): React.JSX.Element {
  const [users, setUsers] = useState<TeamUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(INITIAL_FORM)
  const [showPwd, setShowPwd] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [editPwd, setEditPwd] = useState<{ id: string; value: string } | null>(null)

  const fetchUsers = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/team')
      const data = await res.json() as { users: TeamUser[] }
      setUsers(data.users ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void fetchUsers() }, [fetchUsers])

  async function handleCreate(): Promise<void> {
    setFormError('')
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('All fields are required')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json() as { error?: string }
      if (!res.ok) { setFormError(data.error ?? 'Failed to create user'); return }
      setForm(INITIAL_FORM)
      setShowForm(false)
      void fetchUsers()
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleActive(user: TeamUser): Promise<void> {
    setActionId(user.id)
    setOpenMenuId(null)
    try {
      await fetch(`/api/team/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      })
      void fetchUsers()
    } finally {
      setActionId(null)
    }
  }

  async function handleDelete(id: string): Promise<void> {
    setActionId(id)
    setDeleteConfirm(null)
    setOpenMenuId(null)
    try {
      await fetch(`/api/team/${id}`, { method: 'DELETE' })
      void fetchUsers()
    } finally {
      setActionId(null)
    }
  }

  async function handleResetPwd(): Promise<void> {
    if (!editPwd) return
    setActionId(editPwd.id)
    try {
      await fetch(`/api/team/${editPwd.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: editPwd.value }),
      })
      setEditPwd(null)
      void fetchUsers()
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold tracking-tight">Team</h1>
          <p className="text-[13px] text-[rgb(var(--df-text-3))] mt-0.5">
            Manage staff logins and access levels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void fetchUsers()}
            className="p-2 border border-[rgb(var(--df-border))] hover:border-[rgb(var(--df-accent))]/40 rounded-xl text-[rgb(var(--df-text-3))] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setFormError('') }}
            className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--df-accent))] hover:opacity-90 text-white rounded-xl text-[13px] font-semibold transition-opacity"
          >
            <UserPlus className="w-4 h-4" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Role access reference */}
      <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-4">
        <p className="text-[11px] font-semibold text-[rgb(var(--df-text-2))] uppercase tracking-wider mb-3">Role Access Summary</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(Object.entries(ROLE_META) as [StaffRole, (typeof ROLE_META)[StaffRole]][]).map(([role, meta]) => (
            <div key={role} className="flex items-start gap-2.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${meta.badge} shrink-0 mt-0.5`}>
                {meta.icon}{meta.label}
              </span>
              <span className="text-[11px] text-[rgb(var(--df-text-3))] leading-relaxed">{ROLE_ACCESS[role]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Add staff form */}
      {showForm && (
        <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-accent))]/30 rounded-2xl p-5">
          <p className="text-[14px] font-semibold mb-4">New Staff Account</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-medium text-[rgb(var(--df-text-2))] uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul Kumar"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[rgb(var(--df-accent))]/60"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[rgb(var(--df-text-2))] uppercase tracking-wider">Email</label>
              <input
                type="email"
                placeholder="staff@yourrestaurant.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[rgb(var(--df-accent))]/60"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-[rgb(var(--df-text-2))] uppercase tracking-wider">Password</label>
              <div className="relative mt-1">
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[rgb(var(--df-accent))]/60 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--df-text-3))]"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[rgb(var(--df-text-2))] uppercase tracking-wider">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as StaffRole }))}
                className="mt-1 w-full bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[rgb(var(--df-accent))]/60"
              >
                <option value="WAITER">Waiter — takes orders, serves</option>
                <option value="KITCHEN">Kitchen — chef view, prep</option>
                <option value="CASHIER">Cashier — check order only</option>
                <option value="MANAGER">Manager — full access except owner settings</option>
              </select>
            </div>
          </div>
          {formError && (
            <p className="mt-3 text-[12px] text-red-400">{formError}</p>
          )}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => void handleCreate()}
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-[rgb(var(--df-accent))] hover:opacity-90 text-white rounded-xl text-[13px] font-semibold disabled:opacity-50 transition-opacity"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Create Account
            </button>
            <button
              onClick={() => { setShowForm(false); setFormError('') }}
              className="px-4 py-2 border border-[rgb(var(--df-border))] hover:border-[rgb(var(--df-accent))]/40 rounded-xl text-[13px] text-[rgb(var(--df-text-2))] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Team list */}
      <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--df-text-3))]" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16 text-[rgb(var(--df-text-3))]">
            <UserPlus className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-[14px] font-medium">No staff added yet</p>
            <p className="text-[12px] mt-1">Add your first waiter, chef, or cashier above</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgb(var(--df-border))]">
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[rgb(var(--df-text-2))] uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[rgb(var(--df-text-2))] uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[rgb(var(--df-text-2))] uppercase tracking-wider hidden sm:table-cell">Status</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => {
                const meta = ROLE_META[user.role]
                return (
                  <tr
                    key={user.id}
                    className={`border-b border-[rgb(var(--df-border))] last:border-0 ${idx % 2 === 0 ? '' : 'bg-[rgb(var(--df-surface))]/30'} ${!user.isActive ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-[rgb(var(--df-text))]">{user.name}</p>
                      <p className="text-[11px] text-[rgb(var(--df-text-3))]">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {meta && (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${meta.badge}`}>
                          {meta.icon}{meta.label}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${user.isActive ? 'bg-green-400/10 text-green-400 border-green-400/20' : 'bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-3))] border-[rgb(var(--df-border))]'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 relative">
                      {actionId === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[rgb(var(--df-text-3))]" />
                      ) : (
                        <>
                          <button
                            onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                            className="p-1.5 rounded-lg text-[rgb(var(--df-text-3))] hover:bg-[rgb(var(--df-surface-2))] hover:text-[rgb(var(--df-text))] transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {openMenuId === user.id && (
                            <div className="absolute right-4 top-10 z-20 w-48 bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-xl shadow-xl overflow-hidden">
                              <button
                                onClick={() => void toggleActive(user)}
                                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-[13px] text-[rgb(var(--df-text-2))] hover:bg-[rgb(var(--df-surface-2))] transition-colors"
                              >
                                {user.isActive
                                  ? <><UserX className="w-4 h-4" />Deactivate</>
                                  : <><UserCheck className="w-4 h-4" />Activate</>}
                              </button>
                              <button
                                onClick={() => { setEditPwd({ id: user.id, value: '' }); setOpenMenuId(null) }}
                                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-[13px] text-[rgb(var(--df-text-2))] hover:bg-[rgb(var(--df-surface-2))] transition-colors"
                              >
                                <Eye className="w-4 h-4" />Reset Password
                              </button>
                              <div className="border-t border-[rgb(var(--df-border))]" />
                              <button
                                onClick={() => { setDeleteConfirm(user.id); setOpenMenuId(null) }}
                                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-[13px] text-red-400 hover:bg-red-400/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />Delete Account
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-[16px] font-bold mb-2">Delete Staff Account</h3>
            <p className="text-[13px] text-[rgb(var(--df-text-2))] mb-5">
              This will permanently delete the login. The staff member will lose access immediately. Orders they created will remain.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => void handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[13px] font-semibold transition-colors"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-[rgb(var(--df-border))] rounded-xl text-[13px] text-[rgb(var(--df-text-2))] transition-colors hover:border-[rgb(var(--df-accent))]/40"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset password modal */}
      {editPwd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-[16px] font-bold mb-2">Reset Password</h3>
            <p className="text-[13px] text-[rgb(var(--df-text-2))] mb-4">Enter the new password for this staff account.</p>
            <input
              type="text"
              placeholder="New password (min 6 chars)"
              value={editPwd.value}
              onChange={(e) => setEditPwd((p) => p ? { ...p, value: e.target.value } : null)}
              className="w-full bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl px-3 py-2 text-[13px] outline-none focus:border-[rgb(var(--df-accent))]/60 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={() => void handleResetPwd()}
                disabled={!editPwd.value || editPwd.value.length < 6 || actionId === editPwd.id}
                className="flex-1 py-2.5 bg-[rgb(var(--df-accent))] hover:opacity-90 text-white rounded-xl text-[13px] font-semibold disabled:opacity-50 transition-opacity"
              >
                {actionId === editPwd.id ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Update Password'}
              </button>
              <button
                onClick={() => setEditPwd(null)}
                className="flex-1 py-2.5 border border-[rgb(var(--df-border))] rounded-xl text-[13px] text-[rgb(var(--df-text-2))] transition-colors hover:border-[rgb(var(--df-accent))]/40"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
