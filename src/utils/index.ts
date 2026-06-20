import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { DeliveryZone, OrderStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTZS(amount: number): string {
  return new Intl.NumberFormat('sw-TZ', {
    style: 'currency',
    currency: 'TZS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string, lang: 'en' | 'sw' = 'en'): string {
  return new Intl.DateTimeFormat(lang === 'sw' ? 'sw-TZ' : 'en-TZ', {
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
  { id: 'mpesa',       label: 'M-Pesa',       icon: '📱' },
  { id: 'tigopesa',    label: 'Tigo Pesa',    icon: '📱' },
  { id: 'airtelmoney', label: 'Airtel Money', icon: '📱' },
  { id: 'halopesa',    label: 'Halopesa',     icon: '📱' },
]

export function whatsappUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, '')
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${cleaned}?text=${encoded}`
}

export function getPublicImageUrl(bucket: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}
