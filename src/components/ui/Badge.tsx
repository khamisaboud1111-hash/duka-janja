import { cn } from '@/utils'

type BadgeVariant = 'green' | 'orange' | 'blue' | 'red' | 'gray' | 'gold'

const variants: Record<BadgeVariant, string> = {
  green:  'bg-emerald-100 text-emerald-700',
  orange: 'bg-spice-100 text-spice-700',
  blue:   'bg-brand-100 text-brand-700',
  red:    'bg-red-100 text-red-700',
  gray:   'bg-ink-100 text-ink-600',
  gold:   'bg-amber-100 text-amber-700',
}

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  )
}

export function OrderStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    pending: 'gray', confirmed: 'blue', packed: 'blue',
    out_for_delivery: 'orange', delivered: 'green',
    cancelled: 'red', refunded: 'red',
  }
  const labels: Record<string, string> = {
    pending: 'Inasubiri', confirmed: 'Imethibitishwa', packed: 'Imefungashwa',
    out_for_delivery: 'Inasafirishwa', delivered: 'Imefikishwa',
    cancelled: 'Imefutwa', refunded: 'Imerudishwa',
  }
  return <Badge variant={map[status] ?? 'gray'}>{labels[status] ?? status}</Badge>
}

export function SellerStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = { approved: 'green', pending: 'orange', suspended: 'red' }
  const labels: Record<string, string> = { approved: 'Imeidhinishwa', pending: 'Inasubiri', suspended: 'Imesimamishwa' }
  return <Badge variant={map[status] ?? 'gray'}>{labels[status] ?? status}</Badge>
}

export function ProductStatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = { active: 'green', draft: 'gray', out_of_stock: 'orange', rejected: 'red' }
  const labels: Record<string, string> = { active: 'Inauzwa', draft: 'Rasimu', out_of_stock: 'Imeisha', rejected: 'Imekataliwa' }
  return <Badge variant={map[status] ?? 'gray'}>{labels[status] ?? status}</Badge>
}
