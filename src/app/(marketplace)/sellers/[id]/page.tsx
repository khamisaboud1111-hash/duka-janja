import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { BadgeCheck, Star, Package, MessageCircle, MapPin } from 'lucide-react'
import KikoiStripe from '@/components/shared/KikoiStripe'
import ProductCard from '@/components/product/ProductCard'
import { formatDate, whatsappUrl } from '@/utils'
import type { Metadata } from 'next'

interface Props { params: { id: string } }

async function getSeller(slug: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('sellers')
    .select(`*, profile:profiles(full_name, created_at)`)
    .eq('store_slug', slug)
    .eq('status', 'approved')
    .single()
  return data
}

async function getSellerProducts(sellerId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('products')
    .select(`*, seller:sellers(store_name, status, national_id_verified), category:categories(name_sw), images:product_images(*)`)
    .eq('seller_id', sellerId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const seller = await getSeller(params.id)
  if (!seller) return { title: 'Duka halipatikani' }
  return { title: `${seller.store_name} — Duka Janja`, description: seller.description ?? '' }
}

export default async function SellerStorePage({ params }: Props) {
  const seller = await getSeller(params.id)
  if (!seller) notFound()

  const products = await getSellerProducts(seller.id)

  const waMessage = `Habari ${seller.store_name}! Nimeona duka lako kwenye Duka Janja. Nina swali...`
  const waUrl = whatsappUrl(seller.whatsapp_number, waMessage)

  return (
    <main className="pb-20 sm:pb-8">
      {/* Banner */}
      <div className="relative h-36 sm:h-48 bg-gradient-to-br from-brand-700 to-brand-500 overflow-hidden">
        {seller.banner_url && (
          <Image src={seller.banner_url} alt="" fill className="object-cover opacity-50" />
        )}
      </div>
      <KikoiStripe />

      <div className="page-container">
        {/* Store info */}
        <div className="relative -mt-10 mb-6 flex items-end justify-between gap-4">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-card overflow-hidden bg-white flex-shrink-0">
              {seller.logo_url ? (
                <img src={seller.logo_url} alt={seller.store_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand-100 flex items-center justify-center">
                  <span className="text-brand-700 font-black text-2xl">{seller.store_name.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-black text-xl text-ink-900">{seller.store_name}</h1>
                {seller.national_id_verified && <BadgeCheck className="w-5 h-5 text-brand-500" />}
              </div>
              {seller.national_id_verified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full mt-1">
                  ✓ Muuzaji Aliyethibitishwa
                </span>
              )}
              <div className="flex items-center gap-3 text-sm text-ink-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {seller.average_rating.toFixed(1)} ({seller.review_count} maoni)
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  Mauzo {seller.total_sales}
                </span>
                {seller.location_area && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {seller.location_area}
                  </span>
                )}
              </div>
            </div>
          </div>

          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-emerald-600 transition-colors shadow-sm">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>

        {/* Description */}
        {seller.description && (
          <p className="text-sm text-ink-600 mb-6 max-w-2xl">{seller.description}</p>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Bidhaa', value: products.length },
            { label: 'Mauzo', value: seller.total_sales.toLocaleString() },
            { label: 'Ukadiriaji', value: `${seller.average_rating.toFixed(1)} ★` },
          ].map((s) => (
            <div key={s.label} className="card p-3 text-center">
              <p className="font-black text-lg text-ink-900">{s.value}</p>
              <p className="text-xs text-ink-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Products */}
        <h2 className="font-display font-bold text-lg text-ink-900 mb-4">
          Bidhaa za {seller.store_name} ({products.length})
        </h2>

        {products.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-8 h-8 text-ink-300 mx-auto mb-3" />
            <p className="text-ink-500 text-sm">Duka hili halina bidhaa bado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </main>
  )
}
