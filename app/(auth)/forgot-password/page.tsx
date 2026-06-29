'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { forgotPasswordSchema, type ForgotPasswordInput } from '@/lib/validations/auth'

export default function ForgotPasswordPage(): React.JSX.Element {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(data: ForgotPasswordInput): Promise<void> {
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--df-bg))] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-extrabold text-[rgb(var(--df-accent))] tracking-tight">
            DineFlow
          </h1>
        </div>

        <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl p-6">
          {submitted ? (
            <div className="text-center py-4">
              <p className="text-[14px] font-medium text-[rgb(var(--df-text))]">Check your email</p>
              <p className="text-[12px] text-[rgb(var(--df-text-2))] mt-2">
                If an account exists, we sent a reset link.
              </p>
              <Link
                href="/login"
                className="inline-block mt-4 text-[12px] text-[rgb(var(--df-accent))] hover:text-[rgb(var(--df-accent-hover))]"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <p className="text-[13px] text-[rgb(var(--df-text-2))] mb-4">
                  Enter your email and we'll send a reset link.
                </p>
                <label className="block text-[12px] font-medium text-[rgb(var(--df-text-2))] mb-1.5">
                  Email
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="owner@restaurant.com"
                  className="w-full bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] focus:border-[rgb(var(--df-accent))] focus:outline-none rounded-lg px-3 py-2.5 text-[13px] text-[rgb(var(--df-text))] placeholder:text-[rgb(var(--df-text-3))] transition-colors"
                />
                {errors.email && (
                  <p className="text-[11px] text-red-400 mt-1">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Reset Link
              </button>

              <Link
                href="/login"
                className="block text-center text-[12px] text-[rgb(var(--df-text-2))] hover:text-[rgb(var(--df-accent))]"
              >
                Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
