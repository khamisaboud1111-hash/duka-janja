'use client'

import Link from 'next/link'
import { X, Settings, Globe, Sun, Moon, Package, Heart, Store, LayoutDashboard, LogOut, MapPin, Tag, ShieldCheck } from 'lucide-react'
import { useLangStore, useThemeStore } from '@/store'
import { t } from '@/i18n/translations'
import type { Profile } from '@/types'

interface SidebarProps {
  open: boolean
  onClose: () => void
  profile: Profile | null
  onLogout: () => void
}

export default function Sidebar({ open, onClose, profile, onLogout }: SidebarProps) {
  const { lang, setLang } = useLangStore()
  const { theme, toggleTheme } = useThemeStore()

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`fixed top-0 left-0 z-[70] h-full w-72 bg-white dark:bg-ink-900 border-r border-ink-100 dark:border-ink-800 shadow-modal transition-transform duration-200 flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-ink-100 dark:border-ink-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">DJ</span>
            </div>
            <span className="font-display font-bold text-ink-900 dark:text-white text-sm">Duka Janja</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-ink-100 dark:hover:bg-ink-800">
            <X className="w-5 h-5 text-ink-600 dark:text-ink-300" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {profile && (
            <div className="px-4 py-3 border-b border-ink-100 dark:border-ink-800 mb-1">
              <p className="font-semibold text-sm text-ink-900 dark:text-white truncate">{profile.full_name}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400 truncate">{profile.email}</p>
            </div>
          )}

          <SidebarLink href="/orders" icon={<Package className="w-4 h-4" />} label={t('orders', lang)} onClick={onClose} />
          <SidebarLink href="/wishlist" icon={<Heart className="w-4 h-4" />} label={t('wishlist', lang)} onClick={onClose} />
          <SidebarLink href="/#marketplace-map" icon={<MapPin className="w-4 h-4" />} label={lang === 'en' ? 'Market Map' : 'Ramani ya Soko'} onClick={onClose} />
          <SidebarLink href="/search?sort=discount" icon={<Tag className="w-4 h-4" />} label={lang === 'en' ? 'Deals' : 'Ofa'} onClick={onClose} />

          {(profile?.role === 'seller' || profile?.role === 'admin') && (
            <SidebarLink href="/seller/dashboard" icon={<Store className="w-4 h-4" />} label={t('sellerDashboard', lang)} onClick={onClose} />
          )}
          {profile?.role === 'admin' && (
            <SidebarLink href="/admin/dashboard" icon={<LayoutDashboard className="w-4 h-4" />} label={t('adminDashboard', lang)} onClick={onClose} />
          )}
          {!profile && (
            <SidebarLink href="/register?type=seller" icon={<Store className="w-4 h-4" />} label={lang === 'en' ? 'Become a Seller' : 'Fungua Duka'} onClick={onClose} />
          )}
          <SidebarLink href="/rider/apply" icon={<ShieldCheck className="w-4 h-4" />} label={lang === 'en' ? 'Join as a Driver' : 'Jiunge kama Dereva'} onClick={onClose} />

          <div className="my-2 border-t border-ink-100 dark:border-ink-800" />

          {/* Settings section */}
          <p className="px-4 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-ink-400 dark:text-ink-500 flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" /> {lang === 'en' ? 'Settings' : 'Mipangilio'}
          </p>

          {/* Language switch */}
          <div className="px-4 py-2">
            <p className="text-xs text-ink-500 dark:text-ink-400 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> {lang === 'en' ? 'Language' : 'Lugha'}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setLang('en')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  lang === 'en'
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLang('sw')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  lang === 'sw'
                    ? 'bg-brand-500 text-white border-brand-500'
                    : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-300'
                }`}
              >
                Kiswahili
              </button>
            </div>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
          >
            <span className="flex items-center gap-3">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {lang === 'en' ? 'Dark mode' : 'Mwonekano wa giza'}
            </span>
            <span
              className={`w-9 h-5 rounded-full p-0.5 transition-colors ${theme === 'dark' ? 'bg-brand-500' : 'bg-ink-200'}`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-4' : ''}`}
              />
            </span>
          </button>

          {profile && (
            <SidebarLink href="/settings" icon={<Settings className="w-4 h-4" />} label={lang === 'en' ? 'Account settings' : 'Mipangilio ya Akaunti'} onClick={onClose} />
          )}
        </div>

        {profile && (
          <div className="border-t border-ink-100 dark:border-ink-800 p-2 flex-shrink-0">
            <button
              onClick={() => {
                onClose()
                onLogout()
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {t('logout', lang)}
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

function SidebarLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 dark:text-ink-200 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
    >
      <span className="text-ink-500 dark:text-ink-400">{icon}</span>
      {label}
    </Link>
  )
}
