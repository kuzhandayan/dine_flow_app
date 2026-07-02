'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { AlertTriangle, Trash2, X } from 'lucide-react'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'default'
}

interface ConfirmContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null)

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmDialogProvider')
  return ctx
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (val: boolean) => void
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setPending({ ...opts, resolve })
    })
  }, [])

  function respond(val: boolean): void {
    pending?.resolve(val)
    setPending(null)
  }

  const variant = pending?.variant ?? 'default'
  const confirmBtnStyle =
    variant === 'danger'
      ? 'bg-red-500 hover:bg-red-600 text-white'
      : variant === 'warning'
      ? 'bg-amber-500 hover:bg-amber-600 text-white'
      : 'bg-[rgb(var(--df-accent))] hover:bg-[rgb(var(--df-accent-hover))] text-white'

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {pending && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => respond(false)}
        >
          <div
            className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-2xl w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  variant === 'danger' ? 'bg-red-500/15' : variant === 'warning' ? 'bg-amber-500/15' : 'bg-[rgb(var(--df-accent))]/15'
                }`}>
                  {variant === 'danger'
                    ? <Trash2 className="w-4 h-4 text-red-400" />
                    : <AlertTriangle className={`w-4 h-4 ${variant === 'warning' ? 'text-amber-400' : 'text-[rgb(var(--df-accent))]'}`} />
                  }
                </div>
                <div>
                  <p className="text-[14px] font-bold text-[rgb(var(--df-text))]">{pending.title}</p>
                  <p className="text-[12px] text-[rgb(var(--df-text-3))] mt-0.5 leading-relaxed">{pending.message}</p>
                </div>
              </div>
              <button
                onClick={() => respond(false)}
                className="p-1 rounded-lg hover:bg-[rgb(var(--df-surface-2))] text-[rgb(var(--df-text-3))] transition-colors shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => respond(false)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium border border-[rgb(var(--df-border))] text-[rgb(var(--df-text-2))] hover:bg-[rgb(var(--df-surface-2))] transition-colors"
              >
                {pending.cancelLabel ?? 'Cancel'}
              </button>
              <button
                onClick={() => respond(true)}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${confirmBtnStyle}`}
              >
                {pending.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
