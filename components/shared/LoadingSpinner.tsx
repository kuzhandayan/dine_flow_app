import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps): React.JSX.Element {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-[3px]',
  }

  return (
    <div
      className={cn(
        'rounded-full border-[rgb(var(--df-border))] border-t-[rgb(var(--df-accent))] animate-spin',
        sizeClasses[size],
        className
      )}
    />
  )
}

export function PageLoader(): React.JSX.Element {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <LoadingSpinner size="lg" />
    </div>
  )
}
