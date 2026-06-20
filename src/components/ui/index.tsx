import { cn } from '@/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: { value: string; up: boolean }
  accent?: 'brand' | 'spice' | 'green' | 'gold'
}

const accents = {
  brand: 'border-brand-400 bg-brand-50',
  spice: 'border-spice-400 bg-spice-50',
  green: 'border-emerald-400 bg-emerald-50',
  gold:  'border-amber-400 bg-amber-50',
}

const iconColors = {
  brand: 'text-brand-500',
  spice: 'text-spice-500',
  green: 'text-emerald-500',
  gold:  'text-amber-500',
}

export function StatCard({ label, value, icon, trend, accent = 'brand' }: StatCardProps) {
  return (
    <div className={cn('card p-4 border-l-4', accents[accent])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-ink-500 font-medium mb-1">{label}</p>
          <p className="font-display font-black text-2xl text-ink-900">{value}</p>
          {trend && (
            <p className={cn('text-xs font-medium mt-1', trend.up ? 'text-emerald-600' : 'text-red-500')}>
              {trend.up ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('mt-0.5', iconColors[accent])}>{icon}</div>
        )}
      </div>
    </div>
  )
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="text-ink-300 mb-4">{icon}</div>}
      <h3 className="font-semibold text-ink-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-500 max-w-xs mb-6">{description}</p>}
      {action}
    </div>
  )
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="w-8 h-8 border-3 border-ink-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  )
}

interface ConfirmDialogProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  variant?: 'danger' | 'primary'
}

export function ConfirmDialog({ message, onConfirm, onCancel, loading, variant = 'danger' }: ConfirmDialogProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-700">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onCancel} className="btn-secondary text-sm">Ghairi</button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={variant === 'danger' ? 'btn-danger text-sm' : 'btn-primary text-sm'}
        >
          {loading ? 'Inafanya...' : 'Thibitisha'}
        </button>
      </div>
    </div>
  )
}
