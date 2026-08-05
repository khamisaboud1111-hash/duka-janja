'use client'

import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import { whatsappUrl } from '@/utils'

interface ContactSellerButtonsProps {
  seller: {
    id: string
    store_slug?: string
    whatsapp_number?: string | null
  }
  productName: string
  priceLabel: string
}

export default function ContactSellerButtons({ seller, productName, priceLabel }: ContactSellerButtonsProps) {
  const lang = useLangStore((s) => s.lang)
  const waMessage = `${t('waIntro', lang)} ${productName} (${priceLabel}). ${t('waAskStock', lang)}`
  const waUrl = seller.whatsapp_number ? whatsappUrl(seller.whatsapp_number, waMessage) : '#'

  return (
    <div className="grid grid-cols-2 gap-2">
      <a href={waUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors text-sm">
        <MessageCircle className="w-4 h-4" />
        WhatsApp
      </a>
      {seller.id && (
        <Link href={`/messages/${seller.id}`}
          className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-brand-500 text-brand-600 dark:text-brand-300 font-semibold hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors text-sm">
          <MessageCircle className="w-4 h-4" />
          {t('chatHere', lang)}
        </Link>
      )}
    </div>
  )
}
