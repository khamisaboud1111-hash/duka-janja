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

  const isAvailable = Number(product.stock_quantity) > 0 && product.status !== 'sold'

  // --- HANDLERS ---
  
  async function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) { 
      toast.error(lang === 'sw' ? 'Ingia kwanza' : 'Please log in first')
      return 
    }

    setWishlistLoading(true)
    // Add your supabase logic here
    setWishlistLoading(false)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isAvailable) {
      addItem(product)
      toast.success(lang === 'sw' ? `${product.name} imeongezwa kikapuni` : `${product.name} added to cart`)
    } else {
      toast.error(lang === 'sw' ? `${product.name} imeishiwa stok` : `${product.name} is out of stock`)
    }
  }

  // --- UI ---
  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="card overflow-hidden hover:shadow-card-hover transition-shadow duration-200">
        
        {/* Image */}
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
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0',
                isAvailable
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
