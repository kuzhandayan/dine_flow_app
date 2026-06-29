export const GST_RATES = [0, 5, 12, 18, 28] as const
export type GSTRate = (typeof GST_RATES)[number]

export const GST_RATE_LABELS: Record<GSTRate, string> = {
  0: 'Exempt (0%)',
  5: 'Standard (5%)',
  12: 'Standard (12%)',
  18: 'Standard (18%)',
  28: 'Luxury (28%)',
}

export const GST_RATE_COLORS: Record<GSTRate, string> = {
  0: 'bg-slate-500/10 text-slate-400',
  5: 'bg-green-500/10 text-green-400',
  12: 'bg-blue-500/10 text-blue-400',
  18: 'bg-purple-500/10 text-purple-400',
  28: 'bg-red-500/10 text-red-400',
}
