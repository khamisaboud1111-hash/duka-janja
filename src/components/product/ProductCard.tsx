'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Star, BadgeCheck } from 'lucide-react'
import { useState } from 'react'
import { useCartStore, useLangStore } from '@/store'
import { createClient } from '@/lib/supabase/client'
import { formatTZS, cn } from '@/utils'
import { t } from '@/i18n/translations'
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
  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : null

  async function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error(lang === 'sw' ? 'Ingia kwanza' : 'Please log in first'); return }

    setWishlistLoading(true)
    if (wishlisted) {
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', product.id)
      setWishlisted(false)
    } else {
      await supabase.from('wishlists').insert({ user_id: user.id, product_id: product.id })
      setWishlisted(true)
    }
    setWishlistLoading(false)
  }

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
 if (Number(product.stock_quantity) > 0 && product.status !== 'sold') {
  addItem(product);
  toast.success(lang === 'sw' ? `${product.name} imeongezwa kikapuni` : `${product.name} added to cart`);
} else {
  toast.error(lang === 'sw' ? `${product.name} imeishiwa stok` : `${product.name} is out of stock`);
}


  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="card overflow-hidden hover:shadow-card-hover transition-shadow duration-200">
        {/* Image */}
        <div className="product-image-container">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-100">
              <span className="text-ink-300 text-4xl">📦</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.status === 'sold' && (
              <span className="badge bg-red-600 text-white text-xs font-bold tracking-wide shadow-sm">
                {t('sold', lang).toUpperCase()}
              </span>
            )}
            {discount && product.status !== 'sold' && (
              <span className="badge bg-spice-500 text-white text-xs">-{discount}%</span>
            )}
            {product.is_made_in_zanzibar && (
              <span className="badge bg-amber-100 text-amber-700 text-xs">
                <span className="text-xs">🏅</span>
                {lang === 'sw' ? 'Zanzibar' : 'Made in ZNZ'}
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            className={cn(
              'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all',
              wishlisted ? 'bg-red-500 text-white' : 'bg-white/90 text-ink-600 hover:bg-white opacity-0 group-hover:opacity-100'
            )}
          >
            <Heart className={cn('w-4 h-4', wishlisted && 'fill-current')} />
          </button>

          {/* Sold overlay — red diagonal-style stamp, takes priority over generic out-of-stock */}
          {product.status === 'sold' ? (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="px-4 py-1.5 bg-red-600 text-white text-sm font-bold uppercase tracking-wider rounded-md shadow-md -rotate-6 border-2 border-white">
                {t('sold', lang)}
              </span>
            </div>
          ) : product.stock_quantity === 0 && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="badge-gray text-xs font-bold">{t('outOfStock', lang)}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-xs text-ink-500 mb-0.5 truncate">
            {product.seller?.store_name}
            {(product.seller as any)?.national_id_verified && (
              <BadgeCheck className="w-3 h-3 inline ml-1 text-brand-500" />
            )}
          </p>
          <h3 className="font-semibold text-sm text-ink-900 line-clamp-2 leading-tight mb-2">
            {product.name}
          </h3>

          {/* Rating */}
          {product.review_count > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-ink-600 font-medium">{product.average_rating.toFixed(1)}</span>
              <span className="text-xs text-ink-400">({product.review_count})</span>
            </div>
          )}

          {/* Price & cart */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="font-bold text-sm text-ink-900">{formatTZS(product.price)}</span>
              {product.compare_at_price && (
                <span className="text-xs text-ink-400 line-through ml-1.5">
                  {formatTZS(product.compare_at_price)}
                </span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0 || product.status === 'sold'}
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0',
                product.stock_quantity > 0 && product.status !== 'sold'
                  ? 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700'
                  : 'bg-ink-100 text-ink-400 cursor-not-allowed'
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
