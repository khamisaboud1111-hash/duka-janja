'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, History, Wallet, User, ArrowLeft, Star, ChevronRight, ChevronDown, Moon, Sun, Languages, Check } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { PageLoader } from '@/components/ui'
import { cn } from '@/utils'
import { useLangStore } from '@/store'
import { t, type Language, type TranslationKey } from '@/i18n/translations'
import { useThemeStore } from '@/store'
import { useState } from 'react'

const NAV: { href: string; labelKey: TranslationKey; icon: React.ElementType }[] = [
  { href: '/rider/dashboard', labelKey: 'riderDashboard', icon: LayoutDashboard },
  { href: '/rider/deliveries', labelKey: 'riderDeliveries', icon: History },
  { href: '/rider/wallet', labelKey: 'riderWallet', icon: Wallet },
  { href: '/rider/profile', labelKey: 'profile', icon: User },
]

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'sw', label: 'Kiswahili' },
  { code: 'ar', label: 'العربية' },
]

function Flag({ code }: { code: Language }) {
  if (code === 'fr')
    return (
      <svg viewBox="0 0 60 40" aria-hidden="true" className="w-5 h-5 rounded-sm shrink-0">
        <rect width="20" height="40" fill="#0055A4" />
        <rect x="20" width="20" height="40" fill="#FFFFFF" />
        <rect x="40" width="20" height="40" fill="#EF4135" />
      </svg>
    )
  if (code === 'sw')
    return (
      <svg viewBox="0 0 60 40" aria-hidden="true" className="w-5 h-5 rounded-sm shrink-0">
        <rect width="60" height="40" fill="#1EB53A" />
        <path fill="#00A3DD" d="M0 40 60 0v40z" />
        <path fill="#FCD116" d="M0 35 60 5v3l-60 30z" />
        <path fill="#FCD116" d="M0 41 60 11v3l-60 30z" />
        <path fill="#000" d="M0 38 60 8v3l-60 30z" />
      </svg>
    )
  if (code === 'ar')
    return (
      <svg viewBox="0 0 60 40" aria-hidden="true" className="w-5 h-5 rounded-sm shrink-0">
        <rect width="60" height="40" fill="#006C35" />
        <g fill="#fff">
          <path d="M20 8 44 32l-6 6L14 14z" />
          <rect x="10" y="4" width="7" height="18" rx="2" />
        </g>
      </svg>
    )
  return (
    <svg viewBox="0 0 60 30" aria-hidden="true" className="w-5 h-5 rounded-sm shrink-0">
      <rect width="60" height="30" fill="#012169" />
      <path d="M0 30 60 0M0 0 60 30" stroke="#fff" strokeWidth="12" />
      <path d="M0 30 60 0M0 0 60 30" stroke="#C8102E" strokeWidth="8" />
      <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="12" />
      <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="8" />
    </svg>
  )
}

export default function RiderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { profile, loading } = useUser()
  const lang = useLangStore((s) => s.lang)
  const setLang = useLangStore((s) => s.setLang)
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const [langOpen, setLangOpen] = useState(false)

  if (loading) return <PageLoader />

  if (!profile || (profile.role !== 'rider' && profile.role !== 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 text-center max-w-sm">
          <p className="font-semibold text-ink-700 mb-4">{t('riderOnlyPage', lang)}</p>
          <Link href="/rider/apply" className="btn-primary inline-flex">{t('joinAsRider', lang)}</Link>
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
            <ArrowLeft className="w-3.5 h-3.5" /> {t('backToShop', lang)}
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
              <span className="text-brand-700 font-bold text-sm">{profile.full_name?.charAt(0)?.toUpperCase() ?? 'D'}</span>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-ink-900 dark:text-white truncate">{profile.full_name ?? 'Dereva'}</p>
              <p className="text-xs text-emerald-600">● {t('rider', lang)}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3">
          {NAV.map(({ href, labelKey, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-0.5 transition-colors',
                pathname.startsWith(href) ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900')}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              {t(labelKey, lang)}
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
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-ink-600 hover:bg-ink-50 hover:text-ink-900 transition-colors"
              aria-label="Change language"
              aria-haspopup="menu"
              aria-expanded={langOpen}>
              <Languages className="w-4 h-4" />
              <span className="flex-1 text-left">{t('language', lang)}</span>
              <ChevronDown className={cn('w-4 h-4 transition-transform', langOpen && 'rotate-180')} />
            </button>
            {langOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                <div className="absolute left-0 bottom-full mb-2 w-full bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-800 rounded-xl shadow-xl p-1.5 z-50">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangOpen(false) }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        lang === l.code
                          ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300 font-semibold'
                          : 'text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800'
                      )}>
                      <Flag code={l.code} />
                      <span className="flex-1 text-left">{l.label}</span>
                      {lang === l.code && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </>
            )}
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
          {NAV.map(({ href, labelKey, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn('flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-xs font-medium transition-colors',
                pathname.startsWith(href) ? 'text-brand-600' : 'text-ink-500')}>
              <Icon className="w-5 h-5" />
              {t(labelKey, lang)}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
