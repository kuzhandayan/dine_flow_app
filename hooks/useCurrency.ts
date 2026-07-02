'use client'

import { useSession } from 'next-auth/react'
import { formatCurrency, formatCurrencyCompact, getCurrencySymbol } from '@/lib/currency'

export function useCurrency(): {
  currency: string
  format: (amount: number) => string
  compact: (amount: number) => string
  symbol: string
} {
  const { data: session } = useSession()
  const currency = session?.user?.currency ?? 'INR'

  return {
    currency,
    format: (amount: number) => formatCurrency(amount, currency),
    compact: (amount: number) => formatCurrencyCompact(amount, currency),
    symbol: getCurrencySymbol(currency),
  }
}
