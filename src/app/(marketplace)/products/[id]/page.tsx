import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Star, BadgeCheck, MessageCircle, Heart, Share2, Package, ArrowLeft } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import AddToCartSection from './AddToCartSection'
import { formatTZS, formatDate, whatsappUrl } from '@/utils'
import type { Metadata } from 'next'

interface Props {
  params: { id: string }
}

async function getProduct(slug: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('products')
    .select(`
      *,
      seller:sellers(*, profile:profiles(full_name, phone)),
      category:categories(*),
      images:product_images(* order: sort_order asc),
      reviews(*, buyer:profiles(full_name, avatar_url))
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  return data
}

async function getRelated(categoryId: string, productId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('products')
    .select(`*, seller:sellers(store_name, status), images:product_images(*)`)
    .eq('category_id', categoryId)
    .eq('status', 'active')
    .neq('id', productId)
    .limit(4)
  return data ?? []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.id)
  if (!product) return { title: 'Product not found' }
  return {
    title: `${product.name} — Duka Janja`,
    description: product.description?.slice(0, 160),
  }
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct(params.id)
  if (!product) notFound()

  const related = await getRelated(product.category_id, product.id)
  const images = product.images ?? []
  const primaryImage = images.find((i: any) => i.is_primary) ?? images[0]
  const seller = product.seller
  const reviews = product.reviews ?? []

  const waMessage = `Habari! Nimeona bidhaa yako kwenye Duka Janja: ${product.name} (${formatTZS(product.price)}). Je, ipo?`
  const waUrl = seller ? whatsappUrl(seller.whatsapp_number, waMessage) : '#'

  return (
    <main className="pb-20 sm:pb-8">
      <div className="page-container py-4 sm:py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-ink-500 mb-4">
          <Link href="/" className="hover:text-brand-600">Nyumbani</Link>
          <span>/</span>
          <Link href={`/search?category=${product.category?.slug}`} className="hover:text-brand-600">{product.category?.name_sw}</Link>
          <span>/</span>
          <span className="text-ink-700 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Images */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-ink-100">
              {primaryImage ? (
                <Image
                  src={primaryImage.url}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="w-16 h-16 text-ink-300" />
                </div>
              )}
              {product.is_made_in_zanzibar && (
                <span className="absolute top-3 left-3 badge bg-amber-100 text-amber-700">
                  🏅 Imezalishwa Zanzibar
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img: any, idx: number) => (
                  <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent cursor-pointer hover:border-brand-400 transition-colors">
                    <Image src={img.url} alt={`${product.name} ${idx + 1}`} fill sizes="80px" className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-5">
            <div>
              <Link href={`/sellers/${seller?.store_slug}`} className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
                {seller?.store_name}
                {seller?.status === 'approved' && <BadgeCheck className="w-3.5 h-3.5" />}
              </Link>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-ink-900 mt-1 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Rating */}
            {product.review_count > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map((n) => (
                    <Star key={n} className={`w-4 h-4 ${n <= Math.round(product.average_rating) ? 'fill-amber-400 text-amber-400' : 'text-ink-200'}`} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-ink-700">{product.average_rating.toFixed(1)}</span>
                <span className="text-sm text-ink-500">({product.review_count} maoni)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-black text-3xl text-ink-900">{formatTZS(product.price)}</span>
              {product.compare_at_price && (
                <>
                  <span className="text-ink-400 line-through text-lg">{formatTZS(product.compare_at_price)}</span>
                  <span className="badge-orange">
                    -{Math.round((1 - product.price / product.compare_at_price) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${product.stock_quantity > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-sm text-ink-700">
                {product.stock_quantity > 0
                  ? `Ipo — vipande ${product.stock_quantity}`
                  : 'Imeisha'}
              </span>
            </div>

            {/* Add to cart */}
            <AddToCartSection product={product} />

            {/* WhatsApp */}
            {seller && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-emerald-500 text-emerald-700 font-semibold hover:bg-emerald-50 transition-colors">
                <MessageCircle className="w-5 h-5" />
                Wasiliana na muuzaji (WhatsApp)
              </a>
            )}

            {/* Description */}
            <div>
              <h3 className="font-semibold text-sm text-ink-700 mb-2">Maelezo</h3>
              <p className="text-sm text-ink-600 leading-relaxed whitespace-pre-wrap">
                {product.description || 'Hakuna maelezo.'}
              </p>
            </div>

            {/* Seller card */}
            {seller && (
              <div className="card p-4">
                <p className="text-xs text-ink-500 font-semibold mb-3 uppercase tracking-wide">Kuhusu duka</p>
                <Link href={`/sellers/${seller.store_slug}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  {seller.logo_url ? (
                    <img src={seller.logo_url} alt={seller.store_name} className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-700 font-bold text-xl">{seller.store_name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-ink-900">{seller.store_name}</p>
                      {seller.status === 'approved' && <BadgeCheck className="w-4 h-4 text-brand-500" />}
                    </div>
                    <p className="text-xs text-ink-500">
                      ⭐ {seller.average_rating.toFixed(1)} · {seller.review_count} maoni · Mauzo {seller.total_sales}
                    </p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-10">
          <h2 className="font-display font-bold text-xl text-ink-900 mb-4">
            Maoni ya wateja ({product.review_count})
          </h2>
          {reviews.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-ink-500 text-sm">Hakuna maoni bado. Kuwa wa kwanza kuandika maoni!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <div key={review.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {review.buyer?.avatar_url ? (
                        <img src={review.buyer.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-ink-100 flex items-center justify-center text-sm font-bold text-ink-600">
                          {review.buyer?.full_name?.charAt(0) ?? 'M'}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-ink-800">{review.buyer?.full_name ?? 'Mteja'}</p>
                        <p className="text-xs text-ink-400">{formatDate(review.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map((n) => (
                        <Star key={n} className={`w-3.5 h-3.5 ${n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-ink-200'}`} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-ink-700">{review.comment}</p>}
                  {review.seller_reply && (
                    <div className="mt-3 p-3 bg-brand-50 rounded-xl border border-brand-100">
                      <p className="text-xs text-brand-700 font-semibold mb-1">Jibu la muuzaji:</p>
                      <p className="text-sm text-ink-700">{review.seller_reply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display font-bold text-xl text-ink-900 mb-4">Unaweza pia kupenda</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {related.map((p: any) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
