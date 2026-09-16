'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Building2, Phone, Mail, MapPin, Globe, Clock, Save, AlertCircle, Power } from 'lucide-react'
import { useToast } from '@/components/providers/ToastProvider'
import { Select } from '@/components/ui/Select'
import { cn } from '@/lib/utils'
import { getAllCurrencies } from '@/lib/currency'

const ALL_CURRENCIES = getAllCurrencies()

interface TenantSettings {
  id: string
  name: string
  slug: string
  address: string | null
  phone: string | null
  email: string | null
  currency: string
  timezone: string
}

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'IST — India Standard Time (UTC+5:30)' },
  { value: 'Asia/Dubai', label: 'GST — Gulf Standard Time (UTC+4)' },
  { value: 'Asia/Singapore', label: 'SGT — Singapore Time (UTC+8)' },
  { value: 'Asia/Colombo', label: 'IST — Sri Lanka Time (UTC+5:30)' },
  { value: 'UTC', label: 'UTC — Coordinated Universal Time' },
]


export default function SettingsPage(): React.JSX.Element {
  const { data: session } = useSession()
  const isOwner = session?.user?.role === 'OWNER' || session?.user?.role === 'SUPER_ADMIN'
  const canToggleStatus = session?.user?.role === 'OWNER'
  const toast = useToast()

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [slug, setSlug] = useState('')

  const [isOnline, setIsOnline] = useState<boolean | null>(null)
  const [statusSaving, setStatusSaving] = useState(false)

  useEffect(() => {
    async function load(): Promise<void> {
      try {
        const res = await fetch('/api/settings')
        if (!res.ok) throw new Error('Failed to load')
        const data = (await res.json()) as { tenant: TenantSettings }
        const t = data.tenant
        setSlug(t.slug)
        setForm({
          name: t.name,
          address: t.address ?? '',
          phone: t.phone ?? '',
          email: t.email ?? '',
          currency: t.currency,
          timezone: t.timezone,
        })
      } catch {
        setError('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  useEffect(() => {
    if (!canToggleStatus) return
    let cancelled = false
    void fetch('/api/settings/status')
      .then((res) => (res.ok ? (res.json() as Promise<{ isOnline: boolean }>) : null))
      .then((data) => {
        if (!cancelled && data) setIsOnline(data.isOnline)
      })
    return () => {
      cancelled = true
    }
  }, [canToggleStatus])

  async function handleStatusToggle(): Promise<void> {
    if (isOnline === null) return
    const next = !isOnline
    setStatusSaving(true)
    setIsOnline(next)
    try {
      const res = await fetch('/api/settings/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: next }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      toast.success(
        next ? 'Restaurant is now In Operation' : 'Restaurant is now Offline',
        next ? 'Shown as operational across the admin panel.' : 'Shown as offline across the admin panel until switched back on.'
      )
    } catch {
      setIsOnline(!next)
      toast.error('Could not update status', 'Please try again.')
    } finally {
      setStatusSaving(false)
    }
  }

  function handleChange(field: keyof typeof form, value: string): void {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSuccess(false)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    if (!isOwner) return
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Settings" subtitle="General restaurant settings" />
        <div className="p-6 max-w-2xl space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-[rgb(var(--df-surface-2))] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="General restaurant settings" />

      <div className="p-4 md:p-6">
        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* LEFT — Restaurant Profile */}
            <div className="bg-[rgb(var(--df-surface))] border border-[rgb(var(--df-border))] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[rgb(var(--df-border))]">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[rgb(var(--df-accent))]" />
                  <h2 className="text-[13px] font-semibold text-[rgb(var(--df-text))]">Restaurant Profile</h2>
                </div>
                <p className="text-[11px] text-[rgb(var(--df-text-3))] mt-0.5">
                  Appears on bills, reports and the admin panel
                </p>
              </div>

              <div className="p-5 space-y-4">
                {/* Restaurant Name */}
                <div>
                  <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">
                    Restaurant Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    disabled={!isOwner}
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="e.g. Spice Garden"
                    className={cn(
                      'w-full px-3 py-2.5 rounded-xl text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))]',
                      'text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))]',
                      'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--df-accent))]/40 focus:border-[rgb(var(--df-accent))]',
                      'transition-colors',
                      !isOwner && 'opacity-60 cursor-not-allowed'
                    )}
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">
                    Restaurant Slug
                    <span className="ml-2 text-[10px] font-normal text-[rgb(var(--df-text-3))]">read-only</span>
                  </label>
                  <input
                    type="text"
                    value={slug}
                    disabled
                    className="w-full px-3 py-2.5 rounded-xl text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] text-[rgb(var(--df-text-3))] opacity-60 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-[rgb(var(--df-text-3))] mt-1">
                    Unique identifier — cannot be changed after creation
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">
                    <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> Phone Number</span>
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    disabled={!isOwner}
                    maxLength={20}
                    placeholder="+91 98765 43210"
                    className={cn(
                      'w-full px-3 py-2.5 rounded-xl text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))]',
                      'text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))]',
                      'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--df-accent))]/40 focus:border-[rgb(var(--df-accent))]',
                      'transition-colors',
                      !isOwner && 'opacity-60 cursor-not-allowed'
                    )}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">
                    <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> Email Address</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    disabled={!isOwner}
                    maxLength={100}
                    placeholder="hello@myrestaurant.com"
                    className={cn(
                      'w-full px-3 py-2.5 rounded-xl text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))]',
                      'text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))]',
                      'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--df-accent))]/40 focus:border-[rgb(var(--df-accent))]',
                      'transition-colors',
                      !isOwner && 'opacity-60 cursor-not-allowed'
                    )}
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">
                    <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Address</span>
                  </label>
                  <textarea
                    value={form.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    disabled={!isOwner}
                    maxLength={300}
                    rows={3}
                    placeholder="123 Main Street, Chennai, Tamil Nadu 600001"
                    className={cn(
                      'w-full px-3 py-2.5 rounded-xl text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))]',
                      'text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))] resize-none',
                      'focus:outline-none focus:ring-2 focus:ring-[rgb(var(--df-accent))]/40 focus:border-[rgb(var(--df-accent))]',
                      'transition-colors',
                      !isOwner && 'opacity-60 cursor-not-allowed'
                    )}
                  />
                </div>
              </div>
            </div>

            {/* RIGHT — Regional + Actions */}
            <div className="flex flex-col gap-5">

              {/* Regional Settings */}
              <div className="bg-[rgb(var(--df-surface))] border border-[rgb(var(--df-border))] rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[rgb(var(--df-border))]">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[rgb(var(--df-accent))]" />
                    <h2 className="text-[13px] font-semibold text-[rgb(var(--df-text))]">Regional Settings</h2>
                  </div>
                  <p className="text-[11px] text-[rgb(var(--df-text-3))] mt-0.5">
                    Currency and timezone used across the app
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">
                      <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Currency</span>
                    </label>
                    <Select
                      value={form.currency}
                      onChange={(e) => handleChange('currency', e.target.value)}
                      disabled={!isOwner}
                      options={ALL_CURRENCIES.map((c) => ({ value: c.code, label: c.label }))}
                    />
                  </div>

                  <div>
                    <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">
                      <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> Timezone</span>
                    </label>
                    <Select
                      value={form.timezone}
                      onChange={(e) => handleChange('timezone', e.target.value)}
                      disabled={!isOwner}
                      options={TIMEZONES}
                    />
                  </div>
                </div>
              </div>

              {/* Save / Status */}
              <div className="bg-[rgb(var(--df-surface))] border border-[rgb(var(--df-border))] rounded-2xl p-5 flex flex-col gap-4">
                {error && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[12px]">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[12px]">
                    Settings saved. Restaurant name updates on next login.
                  </div>
                )}

                {isOwner ? (
                  <button
                    type="submit"
                    disabled={saving}
                    className={cn(
                      'flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[13px] font-medium text-white transition-colors',
                      saving
                        ? 'bg-[rgb(var(--df-accent))]/60 cursor-not-allowed'
                        : 'bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))]'
                    )}
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                ) : (
                  <p className="text-[12px] text-[rgb(var(--df-text-3))] text-center py-1">
                    Only the Owner can edit these settings
                  </p>
                )}
              </div>

              {/* Restaurant Status — Owner only, isolated from the topbar to avoid accidental taps */}
              {canToggleStatus && isOnline !== null && (
                <div className="bg-[rgb(var(--df-surface))] border border-[rgb(var(--df-border))] rounded-2xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[rgb(var(--df-border))]">
                    <div className="flex items-center gap-2">
                      <Power className="w-4 h-4 text-[rgb(var(--df-accent))]" />
                      <h2 className="text-[13px] font-semibold text-[rgb(var(--df-text))]">Restaurant Status</h2>
                    </div>
                    <p className="text-[11px] text-[rgb(var(--df-text-3))] mt-0.5">
                      Marks the whole restaurant as in operation or offline — shown in the admin panel
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleStatusToggle()}
                    disabled={statusSaving}
                    className="w-full flex items-center justify-between gap-4 p-5 text-left disabled:opacity-60 hover:bg-[rgb(var(--df-surface-2))] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={cn('w-2 h-2 rounded-full shrink-0', isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-[rgb(var(--df-text-3))]')} />
                      <span className={cn('text-[13px] font-medium', isOnline ? 'text-emerald-400' : 'text-[rgb(var(--df-text-2))]')}>
                        {isOnline ? 'In Operation' : 'Offline'}
                      </span>
                    </div>

                    {/* Switch */}
                    <span
                      className={cn(
                        'relative w-12 h-6 rounded-full transition-colors duration-300 shrink-0',
                        isOnline ? 'bg-emerald-500' : 'bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))]'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300',
                          isOnline ? 'translate-x-6' : 'translate-x-0'
                        )}
                      />
                    </span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}
