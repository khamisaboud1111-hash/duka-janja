'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Package, ShoppingBag, BarChart2, Settings, ArrowLeft, ShieldCheck, MessageCircle } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useSeller } from '@/hooks/useSeller'
import { PageLoader } from '@/components/ui'
import { cn } from '@/utils'

const NAV = [
  { href: '/seller/dashboard',  label: 'Dashibodi', icon: LayoutDashboard },
  { href: '/seller/products',   label: 'Bidhaa',    icon: Package },
  { href: '/seller/orders',     label: 'Maagizo',   icon: ShoppingBag },
  { href: '/seller/messages',   label: 'Ujumbe',    icon: MessageCircle },
  { href: '/seller/analytics',  label: 'Takwimu',   icon: BarChart2 },
  { href: '/seller/verification', label: 'Uthibitisho', icon: ShieldCheck },
  { href: '/seller/settings',   label: 'Mipangilio',icon: Settings },
]

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { profile, loading } = useUser()
  const { seller } = useSeller()

  if (loading) return <PageLoader />

  if (!profile || (profile.role !== 'seller' && profile.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-sm">
          <p className="font-semibold text-ink-700 mb-4">Lazima uwe muuzaji ili kufikia ukurasa huu</p>
          <Link href="/register?type=seller" className="btn-primary inline-flex">Omba kuwa muuzaji</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-50 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden sm:flex flex-col w-56 bg-white border-r border-ink-100 sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-ink-100">
          <Link href="/" className="flex items-center gap-1.5 text-xs text-ink-500 hover:text-brand-600 mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Rudi dukani
          </Link>
          <div className="flex items-center gap-2">
            {seller?.logo_url ? (
              <img src={seller.logo_url} className="w-8 h-8 rounded-lg object-cover" alt="" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
                <span className="text-brand-700 font-bold text-sm">{seller?.store_name?.charAt(0)}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-sm text-ink-900 truncate">{seller?.store_name ?? 'Duka Langu'}</p>
              <p className={`text-xs ${seller?.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                {seller?.status === 'approved' ? '● Inaendesha' : seller?.status === 'pending' ? '● Inasubiri' : '● Imesimamishwa'}
              </p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors',
                pathname.startsWith(href) ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900')}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Bottom nav — mobile */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ink-100 safe-bottom">
        <div className="flex items-center justify-around h-14">
          {NAV.slice(0, 4).map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn('flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-xs font-medium transition-colors',
                pathname.startsWith(href) ? 'text-brand-600' : 'text-ink-500')}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
