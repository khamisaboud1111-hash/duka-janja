'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Package, History, Wallet, User, ArrowLeft, Star, ChevronRight, Moon, Sun, Languages } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { PageLoader } from '@/components/ui'
import { cn } from '@/utils'
import { useLangStore } from '@/store'
import { t, type Language } from '@/i18n/translations'
import { useThemeStore } from '@/store'

const NAV = [
  { href: '/rider/dashboard', label: 'Dashibodi', icon: LayoutDashboard },
  { href: '/rider/deliveries', label: 'Historia', icon: History },
  { href: '/rider/wallet', label: 'Pochi', icon: Wallet },
  { href: '/rider/profile', label: 'Wasifu', icon: User },
]

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'ar', label: 'العربية' },
  { code: 'fr', label: 'Français' },
]

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { profile, loading } = useUser()
  const lang = useLangStore((s) => s.lang)
  const setLang = useLangStore((s) => s.setLang)
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  if (loading) return <PageLoader />

  if (!profile || (profile.role !== 'rider' && profile.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-sm">
          <p className="font-semibold text-ink-700 mb-4">Lazima uwe dereva ili kufikia ukurasa huu</p>
          <Link href="/rider/apply" className="btn-primary inline-flex">Jiunge kama Dereva</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar — desktop */}
      <aside className="hidden sm:flex flex-col w-56 bg-card border-r border-border sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 border-b border-ink-100">
          <Link href="/" className="flex items-center gap-1.5 text-xs text-ink-500 hover:text-brand-600 mb-3">
            <ArrowLeft className="w-3.5 h-3.5" /> Rudi dukani
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
              <span className="text-brand-700 font-bold text-sm">{profile.full_name?.charAt(0)?.toUpperCase() ?? 'D'}</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-ink-900 dark:text-white truncate">{profile.full_name ?? 'Dereva'}</p>
              <p className="text-xs text-emerald-600">● Dereva</p>
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
        {/* Sidebar footer — theme + language */}
        <div className="p-3 border-t border-ink-100 space-y-2">
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-900 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
          <div className="relative">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-900 transition-colors"
              aria-label="Change language">
              <Languages className="w-4 h-4" />
              {LANGUAGES.find((l) => l.code === lang)?.label}
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>

      {/* Bottom nav — mobile */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border safe-bottom">
        <div className="flex items-center justify-around h-14">
          {NAV.map(({ href, label, icon: Icon }) => (
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
