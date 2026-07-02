'use client'

import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, UtensilsCrossed, ShieldCheck } from 'lucide-react'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'

function LoginForm(): React.JSX.Element {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isAccessError, setIsAccessError] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginInput): Promise<void> {
    setServerError(null)
    setIsAccessError(false)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      if (result.error === 'ACCOUNT_SUSPENDED') {
        setIsAccessError(true)
        setServerError('Your restaurant account has been suspended. Please contact the platform admin.')
      } else if (result.error === 'ACCOUNT_INACTIVE') {
        setIsAccessError(true)
        setServerError('Your restaurant account has been deactivated. Please contact the platform admin.')
      } else {
        setIsAccessError(false)
        setServerError('Invalid email or password')
      }
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="Enter email address"
            className="w-full bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] focus:border-[rgb(var(--df-accent))] focus:outline-none rounded-lg px-3 py-2.5 text-[13px] text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))] transition-colors"
          />
          {errors.email && (
            <p className="text-[11px] text-red-400 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="w-full bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] focus:border-[rgb(var(--df-accent))] focus:outline-none rounded-lg px-3 py-2.5 pr-10 text-[13px] text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[rgb(var(--df-text-3))] hover:text-[rgb(var(--df-text-2))]"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-red-400 mt-1">{errors.password.message}</p>
          )}
        </div>

        {serverError && (
          <div className={`rounded-lg px-3 py-2.5 ${
            isAccessError
              ? 'bg-amber-500/10 border border-amber-500/25'
              : 'bg-red-500/10 border border-red-500/25'
          }`}>
            <p className={`text-[12px] ${isAccessError ? 'text-amber-400' : 'text-red-400'}`}>
              {serverError}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Sign In
        </button>
      </form>

      <div className="mt-4 flex items-center justify-between text-[12px]">
        <Link
          href="/forgot-password"
          className="text-[rgb(var(--df-text-2))] hover:text-[rgb(var(--df-accent))] transition-colors"
        >
          Forgot password?
        </Link>
        <Link
          href="/register"
          className="text-[rgb(var(--df-accent))] hover:text-[rgb(var(--df-accent-hover))] transition-colors"
        >
          Register restaurant →
        </Link>
      </div>
    </div>
  )
}

export default function LoginPage(): React.JSX.Element {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[rgb(var(--df-bg))] px-4">
      {/* Login type tabs */}
      <div className="mb-6 flex items-center bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-1 gap-1">
        <button
          disabled
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[rgb(var(--df-accent))] text-white text-[13px] font-medium cursor-default"
        >
          <UtensilsCrossed className="w-4 h-4" />
          Restaurant Staff
        </button>
        <Link
          href="/admin/login"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[rgb(var(--df-text-2))] hover:text-[rgb(var(--df-text))] hover:bg-[rgb(var(--df-surface-2))] text-[13px] font-medium transition-all"
        >
          <ShieldCheck className="w-4 h-4" />
          Platform Admin
        </Link>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link
            href="/"
            className="text-[28px] font-extrabold text-[rgb(var(--df-accent))] tracking-tight hover:opacity-80 transition-opacity"
          >
            DineFlow
          </Link>
          <p className="text-[13px] text-[rgb(var(--df-text-2))] mt-1">
            Sign in to your restaurant workspace
          </p>
        </div>

        <Suspense fallback={<div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-6 h-64 animate-pulse" />}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-[11px] text-[rgb(var(--df-text-3))] mt-5">
          Owner · Manager · Waiter · Cashier — all sign in here
        </p>
      </div>
    </div>
  )
}
