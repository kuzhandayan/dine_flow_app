interface StatCardProps {
  label: string
  value: string
  subtitle?: string
  color?: string
  icon?: React.ReactNode
}

export function StatCard({ label, value, subtitle, color, icon }: StatCardProps): React.JSX.Element {
  return (
    <div className="bg-[rgb(var(--df-card))] border border-[rgb(var(--df-border))] rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[11px] text-[rgb(var(--df-text-2))]">{label}</p>
        {icon && (
          <span style={{ color: color ?? 'rgb(var(--df-accent))' }} className="opacity-70">
            {icon}
          </span>
        )}
      </div>
      <p
        className="text-[26px] font-bold mt-1 mb-0.5 leading-none"
        style={{ color: color ?? 'rgb(var(--df-text))' }}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-[11px] text-[rgb(var(--df-text-2))] mt-1">{subtitle}</p>
      )}
    </div>
  )
}
