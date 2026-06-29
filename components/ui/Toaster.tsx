'use client'

import { useEffect, useRef } from 'react'
import { useToastStore, type ToastItem, type ToastType } from '@/hooks/useToast'
import { X, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

const CONFIG: Record<ToastType, {
  icon: React.ReactNode
  border: string
  bg: string
  iconColor: string
  bar: string
}> = {
  success: {
    icon: <CheckCircle2 className="w-4 h-4" />,
    border: 'border-l-green-500',
    bg: 'bg-[rgb(var(--df-card))]',
    iconColor: 'text-green-400',
    bar: 'bg-green-500',
  },
  error: {
    icon: <XCircle className="w-4 h-4" />,
    border: 'border-l-red-500',
    bg: 'bg-[rgb(var(--df-card))]',
    iconColor: 'text-red-400',
    bar: 'bg-red-500',
  },
  warning: {
    icon: <AlertTriangle className="w-4 h-4" />,
    border: 'border-l-yellow-500',
    bg: 'bg-[rgb(var(--df-card))]',
    iconColor: 'text-yellow-400',
    bar: 'bg-yellow-500',
  },
  info: {
    icon: <Info className="w-4 h-4" />,
    border: 'border-l-blue-500',
    bg: 'bg-[rgb(var(--df-card))]',
    iconColor: 'text-blue-400',
    bar: 'bg-blue-500',
  },
}

function ToastCard({ toast }: { toast: ToastItem }): React.JSX.Element {
  const remove = useToastStore((s) => s.remove)
  const config = CONFIG[toast.type]
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => remove(toast.id), toast.duration)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [toast.id, toast.duration, remove])

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 w-full max-w-sm rounded-xl border border-l-4 border-[rgb(var(--df-border))] px-4 py-3 shadow-2xl overflow-hidden',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        config.bg,
        config.border
      )}
    >
      {/* Progress bar */}
      <div
        className={cn('absolute bottom-0 left-0 h-0.5 rounded-full', config.bar)}
        style={{
          animation: `shrink ${toast.duration}ms linear forwards`,
        }}
      />

      <span className={cn('mt-0.5 shrink-0', config.iconColor)}>{config.icon}</span>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[rgb(var(--df-text))] leading-tight">
          {toast.title}
        </p>
        {toast.description && (
          <p className="text-[12px] text-[rgb(var(--df-text-2))] mt-0.5 leading-snug">
            {toast.description}
          </p>
        )}
      </div>

      <button
        onClick={() => remove(toast.id)}
        className="shrink-0 mt-0.5 text-[rgb(var(--df-text-3))] hover:text-[rgb(var(--df-text-2))] transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export function Toaster(): React.JSX.Element {
  const toasts = useToastStore((s) => s.toasts)

  return (
    <>
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 sm:bottom-6 sm:right-6 pointer-events-none"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastCard toast={t} />
          </div>
        ))}
      </div>
    </>
  )
}
