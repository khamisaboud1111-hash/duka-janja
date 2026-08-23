import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { DeliveryZone, OrderStatus } from '@/types'
import type { Language } from '@/i18n/translations'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTZS(amount: number, lang: Language = 'sw'): string {
  const locale = lang === 'sw' ? 'sw-TZ' : lang === 'ar' ? 'ar-TZ' : lang === 'fr' ? 'fr-TZ' : 'en-TZ'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string, lang: Language = 'en'): string {
  const locale = lang === 'sw' ? 'sw-TZ' : lang === 'ar' ? 'ar-TZ' : lang === 'fr' ? 'fr-TZ' : 'en-TZ'
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateSKU(storeName: string, productName: string): string {
  const storeCode = storeName.slice(0, 3).toUpperCase()
  const productCode = productName.slice(0, 4).toUpperCase().replace(/\s/g, '')
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${storeCode}-${productCode}-${random}`
}

export const DELIVERY_ZONES: Record<DeliveryZone, { nameEn: string; nameSw: string; fee: number; days: number }> = {
  stone_town:     { nameEn: 'Stone Town',     nameSw: 'Stone Town (Mji Mkongwe)', fee: 2000,  days: 1 },
  north_zanzibar: { nameEn: 'North Zanzibar', nameSw: 'Kaskazini Unguja',         fee: 4000,  days: 1 },
  south_zanzibar: { nameEn: 'South Zanzibar', nameSw: 'Kusini Unguja',            fee: 4000,  days: 1 },
  east_zanzibar:  { nameEn: 'East Zanzibar',  nameSw: 'Mashariki Unguja',         fee: 5000,  days: 2 },
  west_zanzibar:  { nameEn: 'West Zanzibar',  nameSw: 'Magharibi Unguja',         fee: 3500,  days: 1 },
  pemba_island:   { nameEn: 'Pemba Island',   nameSw: 'Kisiwa cha Pemba',         fee: 15000, days: 3 },
}

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered',
]

export function getOrderStatusIndex(status: OrderStatus): number {
  return ORDER_STATUS_STEPS.indexOf(status)
}

export const PAYMENT_METHODS = [
  { id: 'mpesa',       label: 'M-Pesa',       icon: '📱', swLabel: 'M-Pesa' },
  { id: 'tigopesa',    label: 'Tigo Pesa',    icon: '📱', swLabel: 'Tigo Pesa' },
  { id: 'airtelmoney', label: 'Airtel Money', icon: '📱', swLabel: 'Airtel Money' },
  { id: 'halopesa',    label: 'Halopesa',     icon: '📱', swLabel: 'Halopesa' },
  { id: 'cod',         label: 'Cash on Delivery', icon: '💵', swLabel: 'Malipo Mkononi' },
]

// Maps the checkout UI's payment_method id to the payment_transactions.provider enum
export function toPaymentProvider(methodId: string): 'mpesa' | 'airtel_money' | 'tigo_pesa' | 'cash_on_delivery' | 'manual' {
  switch (methodId) {
    case 'mpesa': return 'mpesa'
    case 'tigopesa': return 'tigo_pesa'
    case 'airtelmoney': return 'airtel_money'
    case 'cod': return 'cash_on_delivery'
    default: return 'manual' // e.g. halopesa, not yet supported by an adapter
  }
}

export function whatsappUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${cleaned}?text=${encoded}`
}

// Swahili-first WhatsApp message templates
export const whatsappTemplates = {
  productInquiry: (productName: string, price: number, lang: Language = 'sw') => {
    const formattedPrice = lang === 'sw' ? `TZS ${price.toLocaleString('sw-TZ')}` : `TZS ${price.toLocaleString()}`
    return lang === 'sw'
      ? `Habari! Ninahitaji ${productName} bei ${formattedPrice}. Je, ipo?`
      : `Hello! I'm interested in ${productName} for ${formattedPrice}. Is it available?`
  },
  orderConfirmation: (orderId: string, total: number, lang: Language = 'sw') => {
    const formattedTotal = lang === 'sw' ? `TZS ${total.toLocaleString('sw-TZ')}` : `TZS ${total.toLocaleString()}`
    return lang === 'sw'
      ? `Asante kwa agizo lako #${orderId.slice(-8).toUpperCase()} (${formattedTotal}). Tutakupigia simu kuthibitisha.`
      : `Thanks for your order #${orderId.slice(-8).toUpperCase()} (${formattedTotal}). We'll call to confirm.`
  },
  deliveryTracking: (orderId: string, trackingUrl: string, lang: Language = 'sw') => {
    return lang === 'sw'
      ? `Fuatilia agizo lako #${orderId.slice(-8).toUpperCase()}: ${trackingUrl}`
      : `Track your order #${orderId.slice(-8).toUpperCase()}: ${trackingUrl}`
  },
}

export function getPublicImageUrl(bucket: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}