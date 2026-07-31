'use client'

import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

export default function Footer() {
  const lang = useLangStore((s) => s.lang)
  return (
    <footer className="hidden sm:block bg-ink-900 text-ink-300 py-10 mt-8 lg:pl-16">
      <div className="page-container">
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
          <span>{t('copyright', lang)}</span>
          <span>Zanzibar, Tanzania</span>
        </div>
      </div>
    </footer>
  )
}
