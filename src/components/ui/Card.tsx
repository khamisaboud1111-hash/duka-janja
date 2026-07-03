import { cn } from '@/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'solid' | 'glass'
  hover?: boolean
}

export function Card({ variant = 'solid', hover, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        variant === 'solid' ? 'card' : 'glass-card',
        'p-4',
        hover && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface QuickAction {
  icon: React.ReactNode
  label: string
  onClick?: () => void
  href?: string
}

export function QuickActionGrid({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((a) => (
        <a key={a.label} href={a.href} onClick={a.onClick} className="icon-tile">
          <span className="icon-tile-icon">{a.icon}</span>
          <span className="text-xs font-medium text-ink-700 dark:text-ink-200">{a.label}</span>
        </a>
      ))}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />
}
