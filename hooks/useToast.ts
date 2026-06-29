'use client'

import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  description?: string
  duration: number
}

interface ToastStore {
  toasts: ToastItem[]
  add: (toast: Omit<ToastItem, 'id'>) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts.slice(-2), // keep max 3
        { ...toast, id: Math.random().toString(36).slice(2) },
      ],
    })),
  remove: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))

interface ToastOptions {
  description?: string
  duration?: number
}

export const toast = {
  success: (title: string, opts?: ToastOptions) =>
    useToastStore.getState().add({ type: 'success', title, duration: 3500, ...opts }),
  error: (title: string, opts?: ToastOptions) =>
    useToastStore.getState().add({ type: 'error', title, duration: 5000, ...opts }),
  warning: (title: string, opts?: ToastOptions) =>
    useToastStore.getState().add({ type: 'warning', title, duration: 4000, ...opts }),
  info: (title: string, opts?: ToastOptions) =>
    useToastStore.getState().add({ type: 'info', title, duration: 3500, ...opts }),
}
