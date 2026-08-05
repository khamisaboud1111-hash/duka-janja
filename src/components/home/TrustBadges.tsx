'use client'

import { ShieldCheck, CreditCard, Undo2, Truck, MessageCircleHeart, Star, Headphones } from 'lucide-react'
import { useLangStore } from '@/store'
import { t, type TranslationKey } from '@/i18n/translations'

const TRUST_ITEMS: { icon: any; titleKey: TranslationKey; descKey: TranslationKey }[] = [
  { icon: ShieldCheck, titleKey: 'verifiedSellers', descKey: 'trustVerifiedSellersDesc' },
  { icon: CreditCard, titleKey: 'securePayments', descKey: 'trustPaymentMethods' },
  { icon: MessageCircleHeart, titleKey: 'trustBuyerProtection', descKey: 'trustBuyerProtectionDesc' },
  { icon: Undo2, titleKey: 'trustEasyReturns', descKey: 'trustEasyReturnsDesc' },
  { icon: Truck, titleKey: 'fastDelivery', descKey: 'trustFastDeliveryDesc' },
  { icon: Star, titleKey: 'trustRealReviews', descKey: 'trustRealReviewsDesc' },
  { icon: Headphones, titleKey: 'trustSupport', descKey: 'trustSupportDesc' },
]

export default function TrustBadges() {
  const lang = useLangStore((s) => s.lang)
  return (
    <section className="py-8 bg-ink-950 border-y border-ink-800">
      <div className="page-container">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.titleKey} className="flex flex-col items-center text-center gap-1.5 sm:gap-2">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-brand-500/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-brand-400" />
                </div>
                <p className="text-[11px] sm:text-xs font-semibold text-ink-200 leading-tight">{t(item.titleKey, lang)}</p>
                <p className="text-[10px] sm:text-[11px] text-ink-500 leading-snug">{t(item.descKey, lang)}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
