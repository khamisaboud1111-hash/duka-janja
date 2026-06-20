'use client'

import { useState } from 'react'
import { ShoppingCart, Minus, Plus } from 'lucide-react'
import { useCartStore, useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import type { Product } from '@/types'
import toast from 'react-hot-toast'
import { cn } from '@/utils'

export default function AddToCartSection({ product }: { product: Product }) {
  const [qty, setQty] = useState(1)
  const { addItem } = useCartStore()
  const { lang } = useLangStore()
  const inStock = product.stock_quantity > 0

  function handleAdd() {
    for (let i = 0; i < qty; i++) addItem(product)
    toast.success(`${product.name} imeongezwa kikapuni`)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Quantity selector */}
      <div className="flex items-center gap-2 bg-ink-100 rounded-xl p-1">
        <button
          onClick={() => setQty(Math.max(1, qty - 1))}
          disabled={qty <= 1}
          className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-ink-700 disabled:opacity-40 hover:bg-ink-50 transition-colors shadow-sm"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-6 text-center text-sm font-bold text-ink-900">{qty}</span>
        <button
          onClick={() => setQty(Math.min(product.stock_quantity, qty + 1))}
          disabled={qty >= product.stock_quantity}
          className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-ink-700 disabled:opacity-40 hover:bg-ink-50 transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Add button */}
      <button
        onClick={handleAdd}
        disabled={!inStock}
        className={cn(
          'flex-1 btn-primary py-3',
          !inStock && 'opacity-50 cursor-not-allowed bg-ink-400'
        )}
      >
        <ShoppingCart className="w-4 h-4" />
        {inStock ? t('addToCart', lang) : t('outOfStock', lang)}
      </button>
    </div>
  )
}
