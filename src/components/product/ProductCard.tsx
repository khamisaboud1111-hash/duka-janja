'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Star, BadgeCheck, Eye, PlayCircle, Truck, Check } from 'lucide-react'
import { useState } from 'react'
import { useCartStore, useLangStore } from '@/store'
import { formatTZS, cn } from '@/utils'
import { t } from '@/i18n/translations'
import type { Product } from '@/types'
import toast from 'react-hot-toast'
import { useWishlist } from '@/hooks/useWishlist'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore()
  const { lang } = useLangStore()
  const { isWishlisted, toggleWishlist, loading: wishlistLoading } = useWishlist(product.id)
  const [justAdded, setJustAdded] = useState(false)
  const [justLiked, setJustLiked] = useState(false)

  const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0]
  const discount = product.compare_at_price
    ? Math.round((1 - product.price / product.compare_at_price) * 100)
    : null

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (product.stock_quantity === 0) return
    addItem(product)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 900)
    toast.success(`${product.name} ${t('addedToCart', lang)}`)
  }

  function handleWishlistClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!isWishlisted) setJustLiked(true)
    toggleWishlist()
    if (!isWishlisted) setTimeout(() => setJustLiked(false), 450)
  }

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="bg-card border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-200">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {primaryImage ? (
            <Image
              src={primaryImage.url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <span className="text-muted-foreground text-4xl">📦</span>
            </div>
          )}

          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount && (
              <span className="badge bg-spice-500 text-white text-xs">-{discount}%</span>
            )}
            {product.is_made_in_zanzibar && (
              <span className="badge bg-amber-100 text-amber-700 text-xs">
                <span className="text-xs">🏅</span>
                {t('madeInZanzibar', lang)}
              </span>
            )}
          </div>

          <button
            onClick={handleWishlistClick}
            disabled={wishlistLoading}
            className={cn(
              'absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all',
              isWishlisted ? 'bg-red-500 text-white' : 'bg-background/90 text-muted-foreground hover:bg-background opacity-0 group-hover:opacity-100',
              justLiked && 'animate-pop'
            )}
          >
            <Heart className={cn('w-4 h-4', isWishlisted && 'fill-current')} />
          </button>

          <Link
            href={`/products/${product.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/95 text-foreground text-xs font-semibold shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" /> {t('view', lang)}
          </Link>

          <div className="absolute bottom-2 right-2 flex items-center gap-1">
            {(product as any).videos?.length > 0 && (
              <span className="w-6 h-6 rounded-full bg-black/55 flex items-center justify-center" aria-label={t('videoAvailable', lang)}>
                <PlayCircle className="w-3.5 h-3.5 text-white" />
              </span>
            )}
            {product.images && product.images.length > 1 && (
              <span className="px-1.5 py-0.5 rounded-full bg-black/55 text-white text-[10px] font-semibold">
                1/{product.images.length}
              </span>
            )}
          </div>

          {product.stock_quantity === 0 && (
            <div className="absolute inset-0 bg-background/70 dark:bg-background/80 flex items-center justify-center">
              <span className="badge-gray text-xs font-bold">{t('outOfStock', lang)}</span>
            </div>
          )}
        </div>

        <div className="p-3">
          <p className="text-xs text-ink-500 dark:text-ink-400 mb-0.5 truncate">
            {product.seller?.store_name}
            {(product.seller as any)?.national_id_verified && (
              <BadgeCheck className="w-3 h-3 inline ml-1 text-brand-500" />
            )}
          </p>
          <h3 className="font-semibold text-sm text-ink-900 dark:text-white line-clamp-2 leading-tight mb-2">
            {product.name}
          </h3>

          {product.review_count > 0 && (
            <div className="flex items-center gap-1 mb-1.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-ink-600 dark:text-ink-300 font-medium">{product.average_rating.toFixed(1)}</span>
              <span className="text-xs text-ink-400">({product.review_count})</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 mb-2">
            {product.stock_quantity > 0 ? (
              <span className={cn('text-xs font-medium', product.stock_quantity <= 5 ? 'text-spice-600' : 'text-brand-600 dark:text-brand-300')}>
                {product.stock_quantity <= 5 ? t('onlyLeft', lang).replace('{count}', String(product.stock_quantity)) : t('inStock', lang)}
              </span>
            ) : (
              <span className="text-xs font-medium text-ink-400">{t('outOfStock', lang)}</span>
            )}
            <span className="flex items-center gap-0.5 text-xs text-ink-400">
              <Truck className="w-3 h-3" /> {t('delivers', lang)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="font-bold text-sm text-ink-900 dark:text-white">{formatTZS(product.price)}</span>
              {product.compare_at_price && (
                <span className="text-xs text-ink-400 line-through ml-1.5">
                  {formatTZS(product.compare_at_price)}
                </span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center transition-colors flex-shrink-0',
                product.stock_quantity > 0
                  ? justAdded ? 'bg-emerald-500 text-white' : 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700'
                  : 'bg-ink-100 text-ink-400 cursor-not-allowed',
                justAdded && 'animate-pop'
              )}
            >
              {justAdded ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}