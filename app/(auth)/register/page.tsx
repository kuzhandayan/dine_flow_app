'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'

export default function RegisterPage(): React.JSX.Element {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterInput): Promise<void> {
    setServerError(null)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const body = await res.json() as { error?: string }
      setServerError(body.error ?? 'Registration failed')
      return
    }

    await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--df-bg))] px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-extrabold text-[rgb(var(--df-accent))] tracking-tight">
            DineFlow
          </h1>
          <p className="text-[13px] text-[rgb(var(--df-text-2))] mt-1">
            Register your restaurant
          </p>
        </div>

        <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {[
              { field: 'restaurantName' as const, label: 'Restaurant Name', placeholder: 'Spice Garden' },
              { field: 'ownerName' as const, label: 'Your Name', placeholder: 'Rahul Sharma' },
              { field: 'email' as const, label: 'Email', placeholder: 'owner@restaurant.com', type: 'email' },
              { field: 'password' as const, label: 'Password', placeholder: '••••••••', type: 'password' },
              { field: 'confirmPassword' as const, label: 'Confirm Password', placeholder: '••••••••', type: 'password' },
            ].map(({ field, label, placeholder, type = 'text' }) => (
              <div key={field}>
                <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">
                  {label}
                </label>
                <input
                  {...register(field)}
                  type={type}
                  placeholder={placeholder}
                  className="w-full bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] focus:border-[rgb(var(--df-accent))] focus:outline-none rounded-lg px-3 py-2.5 text-[13px] text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))] transition-colors"
                />
                {errors[field] && (
                  <p className="text-[11px] text-red-400 mt-1">{errors[field]?.message}</p>
                )}
              </div>
            ))}

            {serverError && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2.5">
                <p className="text-[12px] text-red-400">{serverError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Restaurant
            </button>
          </form>

          <p className="text-center text-[12px] text-[rgb(var(--df-text-2))] mt-4">
            Already registered?{' '}
            <Link
              href="/login"
              className="text-[rgb(var(--df-accent))] hover:text-[rgb(var(--df-accent-hover))]"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
