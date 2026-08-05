'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function Footer() {
  const lang = useLangStore((s) => s.lang)
  const [email, setEmail] = useState('')
  return (
    <footer className="hidden sm:block bg-ink-900 text-ink-300 py-10 mt-8 lg:pl-16">
      <div className="page-container">
        {/* Newsletter band */}
        <div className="mb-10 rounded-2xl bg-gradient-to-r from-brand-500/15 to-spice-500/15 border border-white/10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-white text-lg">{t('newsletterTitle', lang)}</h3>
            <p className="text-xs text-ink-400 mt-1 max-w-sm">{t('newsletterDesc', lang)}</p>
          </div>
          {/* TODO: Newsletter form is a UI placeholder — wire up to a real mailing list API */}
          <form
            className="flex w-full sm:w-auto gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!email.trim()) return
              toast.success(t('subscribe', lang))
              setEmail('')
            }}
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder', lang)}
              className="bg-white/10 border-white/20 text-white placeholder:text-ink-400 focus:ring-brand-500 min-w-[220px]"
              aria-label={t('emailPlaceholder', lang)}
            />
            <Button type="submit" variant="primary" size="md">
              <Send className="w-4 h-4" /> {t('subscribe', lang)}
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">DJ</span>
              </div>
              <span className="font-display font-black text-white text-lg">Duka Janja</span>
            </div>
            <p className="text-xs text-ink-400 leading-relaxed">{t('footerTagline', lang)}</p>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">{t('buying', lang)}</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/search" className="hover:text-white transition-colors">{t('allProducts', lang)}</a></li>
              <li><a href="/search?made_in_zanzibar=true" className="hover:text-white transition-colors">{t('madeInZanzibar', lang)}</a></li>
              <li><a href="/orders" className="hover:text-white transition-colors">{t('orders', lang)}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">{t('selling', lang)}</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="/register?type=seller" className="hover:text-white transition-colors">{t('openStore', lang)}</a></li>
              <li><a href="/seller/dashboard" className="hover:text-white transition-colors">{t('sellerDashboard', lang)}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm mb-3">{t('support', lang)}</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-ink-400">WhatsApp: +255 777 000 000</span></li>
              <li><span className="text-ink-400">info@dukajanja.co.tz</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-ink-800 pt-6 flex flex-col sm:flex-row justify-between gap-2 text-xs text-ink-500">
          <span>{t('copyright', lang).replace('{year}', String(new Date().getFullYear()))}</span>
          <span>Zanzibar, Tanzania</span>
        </div>
      </div>
    </footer>
  )
}
