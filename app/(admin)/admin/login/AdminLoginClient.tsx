'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, ShieldCheck, UtensilsCrossed } from 'lucide-react'

export default function AdminLoginClient(): React.JSX.Element {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        setError('Invalid credentials or insufficient permissions')
      } else {
        router.push('/admin/dashboard')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[rgb(var(--df-bg))] p-4">
      {/* Login type tabs */}
      <div className="mb-6 flex items-center bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-1 gap-1">
        <Link
          href="/login"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[rgb(var(--df-text-2))] hover:text-[rgb(var(--df-text))] hover:bg-[rgb(var(--df-surface-2))] text-[13px] font-medium transition-all"
        >
          <UtensilsCrossed className="w-4 h-4" />
          Restaurant Staff
        </Link>
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-[13px] font-medium cursor-default"
        >
          <ShieldCheck className="w-4 h-4" />
          Platform Admin
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link
            href="/"
            className="text-[28px] font-extrabold text-[rgb(var(--df-accent))] tracking-tight hover:opacity-80 transition-opacity"
          >
            DineFlow
          </Link>
          <p className="text-[13px] text-[rgb(var(--df-text-2))] mt-1">Platform Admin Portal</p>
        </div>

        <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-6">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="Enter email address"
                className="w-full px-3 py-2.5 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl focus:outline-none focus:border-purple-500 transition-colors text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))]"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 text-[13px] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-xl focus:outline-none focus:border-purple-500 transition-colors text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))]"
              />
            </div>

            {error && (
              <p className="text-[12px] text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-[13px] font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign in to Admin Portal
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[rgb(var(--df-text-3))] mt-5">
          Super Admin access only — restaurant staff use{' '}
          <Link href="/login" className="text-[rgb(var(--df-accent))] hover:underline">
            /login
          </Link>
        </p>
      </div>
    </div>
  )
}
