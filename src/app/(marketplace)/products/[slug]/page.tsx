import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Star, BadgeCheck, Package } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import LText from '@/components/shared/LText'
import TrackView from './TrackView'
import RecentlyViewedRow from './RecentlyViewedRow'
import AddToCartSection from './AddToCartSection'
import ContactSellerButtons from './ContactSellerButtons'
import { formatTZS, formatDate } from '@/utils'
import type { Metadata } from 'next'

import type { Product, ProductImage, ProductVideo, Review, Seller, Category } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProductPageData = any

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
      videos:product_videos(* order: sort_order asc),
      reviews(*, buyer:profiles(full_name, avatar_url))
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()
  return data as unknown as ProductPageData | null
}

async function getRelated(categoryId: string, productId: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('products')
    .select(`*, seller:sellers(store_name, status, national_id_verified), images:product_images(*)`)
    .eq('category_id', categoryId)
    .eq('status', 'active')
    .neq('id', productId)
    .limit(4)
  return data ?? []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct(params.id)
  if (!product) return { title: 'Product not found' }

  const productData = product as ProductPageData

  return {
    title: `${productData.name} - Duka Janja`,
    description: productData.description?.slice(0, 160),
  }
}

export default async function ProductPage({ params }: Props) {
  const product = (await getProduct(params.id)) as ProductPageData | null
  if (!product) notFound()

  const related = product.category_id ? await getRelated(product.category_id, product.id) : []
  const images = product.images ?? []
  const videos = product.videos ?? []
  const primaryImage = images.find((i: ProductImage) => i.is_primary) ?? images[0]
  const seller = product.seller
  const reviews = product.reviews ?? []
  const isVerifiedSeller = seller?.national_id_verified ?? false

  return (
    <main className="pb-20 sm:pb-8 min-h-screen">
      <TrackView productId={product.id} />
      <div className="page-container py-4 sm:py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Link href="/" className="hover:text-brand-600 dark:hover:text-brand-300"><LText k="home" /></Link>
          <span>/</span>
          <Link href={`/search?category=${product.category?.slug}`} className="hover:text-brand-600 dark:hover:text-brand-300">{product.category?.name_sw}</Link>
          <span>/</span>
          <span className="text-foreground line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Images */}
          <div className="space-y-3">
            {/* Main image — zoom on hover */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted group cursor-zoom-in">
              {primaryImage ? (
                <Image
                  src={primaryImage.url}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-125"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
              {product.is_made_in_zanzibar && (
                <span className="absolute top-3 left-3 badge-orange">
                  🏅 <LText k="madeInZanzibar" />
                </span>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img: ProductImage, idx: number) => (
                  <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border-2 border-transparent cursor-pointer hover:border-brand-400 transition-colors">
                    <Image src={img.url} alt={`${product.name} ${idx + 1}`} fill sizes="80px" className="object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {videos.map((vid: ProductVideo) => (
                  <video key={vid.id} src={vid.url} controls className="w-full aspect-video rounded-xl bg-muted object-cover" />
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-5">
            <div>
              <Link href={`/sellers/${seller?.store_slug}`} className="text-sm text-brand-600 dark:text-brand-300 font-medium hover:underline flex items-center gap-1">
                {seller?.store_name}
                {isVerifiedSeller && <BadgeCheck className="w-3.5 h-3.5" />}
              </Link>
              <h1 className="font-display font-black text-2xl sm:text-3xl text-foreground mt-1 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Rating */}
            {product.review_count > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`w-4 h-4 ${n <= Math.round(product.average_rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                  ))}
                </div>
                <span className="text-sm font-semibold text-foreground">{(product.average_rating ?? 0).toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({product.review_count} <LText k="reviews" />)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-black text-3xl text-foreground">{formatTZS(product.price)}</span>
              {product.compare_at_price && (
                <>
                  <span className="text-muted-foreground line-through text-lg">{formatTZS(product.compare_at_price)}</span>
                  <span className="badge-orange">
                    -{Math.round((1 - product.price / product.compare_at_price) * 100)}%
                  </span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${product.stock_quantity > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-sm text-foreground">
                {product.stock_quantity > 0 ? (
                  <><LText k="inStock" /> — {product.stock_quantity} <LText k="pieces" /></>
                ) : (
                  <LText k="outOfStock" />
                )}
              </span>
            </div>

            {/* Add to cart */}
            <AddToCartSection product={product} />

            {/* WhatsApp + In-app chat */}
            {seller && (
              <ContactSellerButtons
                seller={seller}
                productName={product.name}
                priceLabel={formatTZS(product.price)}
              />
            )}

            {/* Description */}
            <div>
              <h3 className="font-semibold text-sm text-foreground mb-2"><LText k="description" /></h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {product.description || <LText k="noDescription" />}
              </p>
            </div>

            {/* Seller card */}
            {seller && (
              <div className="bg-card border border-border p-4">
                <p className="text-xs text-muted-foreground font-semibold mb-3 uppercase tracking-wide"><LText k="aboutStore" /></p>
                <Link href={`/sellers/${seller.store_slug}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  {seller.logo_url ? (
                    <Image src={seller.logo_url} alt={seller.store_name} width={48} height={48} unoptimized className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-700 dark:text-brand-300 font-bold text-xl">{seller.store_name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-foreground">{seller.store_name}</p>
                      {isVerifiedSeller && <BadgeCheck className="w-4 h-4 text-brand-500" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ⭐ {(seller.average_rating ?? 0).toFixed(1)} · {seller.review_count} <LText k="reviews" /> · <LText k="sales" /> {seller.total_sales ?? 0}
                    </p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-10">
          <h2 className="font-display font-bold text-xl text-foreground mb-4">
            <LText k="customerReviews" /> ({product.review_count})
          </h2>
          {reviews.length === 0 ? (
            <div className="bg-card border border-border p-8 text-center">
              <p className="text-muted-foreground text-sm"><LText k="noReviewsPrompt" /></p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review: Review & { buyer?: { full_name: string; avatar_url: string | null } | null }) => (
                <div key={review.id} className="bg-card border border-border p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      {review.buyer?.avatar_url ? (
                        <Image src={review.buyer.avatar_url} alt="" width={32} height={32} unoptimized className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                          {review.buyer?.full_name?.charAt(0) ?? 'M'}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-foreground">{review.buyer?.full_name ?? <LText k="customer" />}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`w-3.5 h-3.5 ${n <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                      ))}
                    </div>
                  </div>
                  {review.comment && <p className="text-sm text-foreground">{review.comment}</p>}
                  {review.seller_reply && (
                    <div className="mt-3 p-3 bg-brand-50 dark:bg-brand-500/10 rounded-xl border border-brand-100 dark:border-brand-800">
                      <p className="text-xs text-brand-700 dark:text-brand-300 font-semibold mb-1"><LText k="sellerReply" /></p>
                      <p className="text-sm text-foreground">{review.seller_reply}</p>
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
            <h2 className="font-display font-bold text-xl text-foreground mb-4"><LText k="relatedProducts" /></h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {related.map((p: Product) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        <RecentlyViewedRow excludeProductId={product.id} />
      </div>
    </main>
  )
}
