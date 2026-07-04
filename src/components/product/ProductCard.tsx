'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Star, BadgeCheck, Zap } from 'lucide-react'
import { useState } from 'react'
import { useCartStore, useLangStore } from '@/store'
import { createClient } from '@/lib/supabase/client'
import { formatTZS, cn } from '@/utils'
import type { Product } from '@/types'
import toast from 'react-hot-toast'

interface ProductCardProps {
  product: Product
  wishlisted?: boolean
}

export default function ProductCard({ product, wishlisted: initialWishlisted = false }: ProductCardProps) {
  const { addItem } = useCartStore()
  const { lang } = useLangStore()
  const supabase = createClient()
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0]

  const isAvailable = Number(product.stock_quantity) > 0 && product.status !== 'sold'
  const isVerifiedSeller = (product as any).seller?.national_id_verified ?? false
  const sellerName = (product as any).seller?.store_name
  const hasDiscount = (product as any).compare_at_price && (product as any).compare_at_price > product.price
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / (product as any).compare_at_price) * 100)
    : 0
  const rating = (product as any).average_rating
  const reviewCount = (product as any).review_count

  async function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error(lang === 'sw' ? 'Ingia kwanza' : 'Please log in first')
      return
    }
    setWishlistLoading(true)
    // TODO: wire up to wishlist table
    setWishlisted((w) => !w)
    setWishlistLoading(false)
  }

 const [burst, setBurst] = useState(false)

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isAvailable) {
      addItem(product)
      setBurst(true)
      setTimeout(() => setBurst(false), 500)
      toast.success(lang === 'sw' ? `${product.name} imeongezwa kikapuni` : `${product.name} added to cart`)
    } else {
      toast.error(lang === 'sw' ? `${product.name} imeishiwa stok` : `${product.name} is out of stock`)
    }
  }

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="card overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200 dark:bg-ink-900 dark:border-ink-800">
        <div className="product-image-container relative h-64 w-full">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-100 dark:bg-ink-800">
              <span className="text-ink-300 dark:text-ink-600 text-4xl">📦</span>
            </div>
          )}

          {/* Top-left badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {hasDiscount && (
              <span className="badge bg-spice-500 text-white shadow-sm">-{discountPct}%</span>
            )}
            {!isAvailable && (
              <span className="badge bg-ink-900/80 text-white shadow-sm">
                {lang === 'sw' ? 'Imeisha' : 'Out of stock'}
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            className={cn(
              'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all active:scale-90',
              wishlisted
                ? 'bg-red-500 text-white'
                : 'bg-white/90 dark:bg-ink-900/80 text-ink-600 dark:text-ink-300 hover:bg-white dark:hover:bg-ink-800 opacity-0 group-hover:opacity-100'
            )}
          >
            <Heart className={cn('w-4 h-4', wishlisted && 'fill-current')} />
          </button>

          {/* Fast delivery hint, bottom-left */}
          <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="inline-flex items-center gap-1 bg-white/90 dark:bg-ink-900/85 backdrop-blur-sm text-ink-700 dark:text-ink-200 text-[10px] font-semibold px-2 py-1 rounded-full shadow-sm">
              <Zap className="w-3 h-3 text-brand-500" /> {lang === 'sw' ? 'Haraka' : 'Fast'}
            </span>
          </div>
        </div>

        <div className="p-3">
          {sellerName && (
            <p className="flex items-center gap-1 text-[11px] text-ink-400 dark:text-ink-500 font-medium mb-1 truncate">
              {sellerName}
              {isVerifiedSeller && <BadgeCheck className="w-3 h-3 text-brand-500 flex-shrink-0" />}
            </p>
          )}

          <h3 className="font-semibold text-sm text-ink-900 dark:text-white line-clamp-2 leading-tight mb-1.5">
            {product.name}
          </h3>

          {typeof rating === 'number' && reviewCount > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-medium text-ink-600 dark:text-ink-300">{rating.toFixed(1)}</span>
              <span className="text-xs text-ink-400 dark:text-ink-500">({reviewCount})</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 mt-1">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="font-bold text-sm text-ink-900 dark:text-white truncate">{formatTZS(product.price)}</span>
              {hasDiscount && (
                <span className="text-[11px] text-ink-400 dark:text-ink-500 line-through truncate">
                  {formatTZS((product as any).compare_at_price)}
                </span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90 flex-shrink-0',
                isAvailable
                  ? 'bg-brand-500 text-white hover:bg-brand-600 hover:shadow-glow-brand'
                  : 'bg-ink-100 dark:bg-ink-800 text-ink-400 dark:text-ink-600 cursor-not-allowed'
              )}
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
