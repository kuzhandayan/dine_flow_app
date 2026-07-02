'use client'

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastContextValue {
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 shrink-0" />,
  error:   <XCircle className="w-4 h-4 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 shrink-0" />,
  info:    <Info className="w-4 h-4 shrink-0" />,
}

const STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400',
  error:   'bg-red-500/10 border-red-500/25 text-red-400',
  warning: 'bg-amber-500/10 border-amber-500/25 text-amber-400',
  info:    'bg-blue-500/10 border-blue-500/25 text-blue-400',
}

const PROGRESS: Record<ToastType, string> = {
  success: 'bg-emerald-400',
  error:   'bg-red-400',
  warning: 'bg-amber-400',
  info:    'bg-blue-400',
}

export function ToastProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([])
  const counterRef = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const add = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast-${++counterRef.current}`
    setToasts((prev) => [...prev.slice(-4), { id, type, title, message }])
    setTimeout(() => dismiss(id), 4000)
  }, [dismiss])

  const ctx: ToastContextValue = {
    success: (t, m) => add('success', t, m),
    error:   (t, m) => add('error', t, m),
    warning: (t, m) => add('warning', t, m),
    info:    (t, m) => add('info', t, m),
  }

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-sm min-w-[260px] max-w-[340px] animate-slide-in ${STYLES[toast.type]}`}
          >
            {ICONS[toast.type]}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold leading-tight">{toast.title}</p>
              {toast.message && (
                <p className="text-[11px] opacity-80 mt-0.5 leading-tight">{toast.message}</p>
              )}
              {/* Progress bar */}
              <div className="mt-2 h-0.5 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full ${PROGRESS[toast.type]} animate-shrink`} />
              </div>
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="opacity-60 hover:opacity-100 transition-opacity shrink-0 mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
