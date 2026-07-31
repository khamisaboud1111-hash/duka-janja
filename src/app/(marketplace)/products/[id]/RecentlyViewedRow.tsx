'use client'

import { useRecentlyViewed } from '@/hooks/useRecentlyViewed'
import ProductCard from '@/components/product/ProductCard'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'

export default function RecentlyViewedRow({ excludeProductId }: { excludeProductId: string }) {
  const { products, loading } = useRecentlyViewed(excludeProductId, 8)
  const lang = useLangStore((s) => s.lang)

  if (loading || products.length === 0) return null

  return (
    <section className="mt-10">
      <h2 className="font-display font-bold text-xl text-ink-900 mb-4">{t('recentlyViewed', lang)}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  )
}
