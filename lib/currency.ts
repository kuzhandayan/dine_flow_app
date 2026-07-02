// Dynamic currency formatting — uses tenant's currency from session

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatCurrencyCompact(amount: number, currency = 'INR'): string {
  const symbol = getCurrencySymbol(currency)
  if (amount >= 10000000) return symbol + (amount / 10000000).toFixed(1) + 'Cr'
  if (amount >= 100000) return symbol + (amount / 100000).toFixed(1) + 'L'
  if (amount >= 1000) return symbol + (amount / 1000).toFixed(1) + 'K'
  return symbol + amount.toFixed(0)
}

export function getCurrencySymbol(currency = 'INR'): string {
  try {
    const parts = new Intl.NumberFormat('en', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).formatToParts(0)
    return parts.find((p) => p.type === 'currency')?.value ?? currency
  } catch {
    return currency
  }
}

// Legacy aliases — kept so existing imports don't break
export function formatINR(amount: number): string {
  return formatCurrency(amount, 'INR')
}

export function formatINRCompact(amount: number): string {
  return formatCurrencyCompact(amount, 'INR')
}

export interface CurrencyOption {
  code: string
  name: string
  symbol: string
  label: string
}

// Full ISO 4217 list using built-in Intl — no package needed
// Safe wrapper: Intl.supportedValuesOf is Node 18+ / modern browsers only
export function getAllCurrencies(): CurrencyOption[] {
  let codes: string[]
  try {
    codes = (Intl as unknown as { supportedValuesOf: (key: string) => string[] }).supportedValuesOf('currency')
  } catch {
    // Fallback for environments that don't support it
    codes = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'LKR', 'MYR', 'THB', 'JPY', 'CNY', 'AUD', 'CAD']
  }

  const displayNames = new Intl.DisplayNames(['en'], { type: 'currency' })

  return codes
    .map((code) => {
      const name = displayNames.of(code) ?? code
      const symbol = getCurrencySymbol(code)
      return { code, name, symbol, label: `${symbol} ${code} — ${name}` }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}
