'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { SlidersHorizontal, X, Search } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import { useProducts } from '@/hooks/useProducts'
import { useLangStore } from '@/store'
import { createClient } from '@/lib/supabase/client'
import { LoadingSpinner, EmptyState } from '@/components/ui'
import type { Category } from '@/types'

export default function SearchPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { lang } = useLangStore()
  const supabase = createClient()

  const [categories, setCategories] = useState<Category[]>([])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const q          = params.get('q') ?? ''
  const category   = params.get('category') ?? ''
  const sort       = (params.get('sort') ?? 'newest') as any
  const madeInZnz  = params.get('made_in_zanzibar') === 'true'
  const page       = Number(params.get('page') ?? '1')

  const { products, loading, count, totalPages } = useProducts({
    search: q, category, sort, madeInZanzibar: madeInZnz, page, pageSize: 24,
  })

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories(data ?? []))
  }, [])

  function setParam(key: string, value: string | null) {
    const p = new URLSearchParams(params.toString())
    if (value) p.set(key, value)
    else p.delete(key)
    p.set('page', '1')
    router.push(`/search?${p.toString()}`)
  }

  function clearAll() {
    router.push('/search')
  }

  const hasFilters = !!(q || category || madeInZnz || sort !== 'newest')

  return (
    <main className="pb-20 sm:pb-8">
      <div className="page-container py-4 sm:py-6">
        <div className="flex items-center gap-3 mb-4">
          {/* Search bar */}
          <form
            onSubmit={(e) => { e.preventDefault(); setParam('q', (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value) }}
            className="flex-1 relative"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              name="q"
              defaultValue={q}
              placeholder={lang === 'sw' ? 'Tafuta bidhaa...' : 'Search products...'}
              className="input pl-9 w-full"
            />
          </form>
          <button onClick={() => setFiltersOpen(!filtersOpen)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${filtersOpen ? 'bg-brand-500 text-white border-brand-500' : 'bg-white border-ink-200 text-ink-700 hover:border-brand-300'}`}>
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Chuja</span>
          </button>
        </div>

        {/* Active filters */}
        {hasFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {q && <FilterChip label={`"${q}"`} onRemove={() => setParam('q', null)} />}
            {category && <FilterChip label={categories.find(c => c.slug === category)?.name_sw ?? category} onRemove={() => setParam('category', null)} />}
            {madeInZnz && <FilterChip label="🏅 Imezalishwa Zanzibar" onRemove={() => setParam('made_in_zanzibar', null)} />}
            {sort !== 'newest' && <FilterChip label={sortLabel(sort)} onRemove={() => setParam('sort', null)} />}
            <button onClick={clearAll} className="text-xs text-red-500 font-medium hover:underline px-1">Futa chujio zote</button>
          </div>
        )}

        {/* Filter panel */}
        {filtersOpen && (
          <div className="card p-4 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Categories */}
            <div>
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Aina</p>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button key={cat.id} onClick={() => setParam('category', category === cat.slug ? null : cat.slug)}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${category === cat.slug ? 'bg-brand-500 text-white border-brand-500' : 'border-ink-200 text-ink-600 hover:border-brand-300'}`}>
                    {cat.icon} {cat.name_sw}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div>
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Panga kwa</p>
              <div className="flex flex-col gap-1.5">
                {[['newest','Mpya zaidi'],['price_asc','Bei: chini kwenda juu'],['price_desc','Bei: juu kwenda chini'],['popular','Maarufu zaidi']].map(([v, label]) => (
                  <button key={v} onClick={() => setParam('sort', v)}
                    className={`text-xs text-left px-3 py-1.5 rounded-lg border transition-colors ${sort === v ? 'bg-brand-50 border-brand-400 text-brand-700 font-semibold' : 'border-ink-200 text-ink-600 hover:border-brand-300'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Special */}
            <div>
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Maalum</p>
              <button onClick={() => setParam('made_in_zanzibar', madeInZnz ? null : 'true')}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${madeInZnz ? 'bg-amber-100 text-amber-700 border-amber-300' : 'border-ink-200 text-ink-600 hover:border-amber-300'}`}>
                🏅 Imezalishwa Zanzibar
              </button>
            </div>
          </div>
        )}

        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-ink-500">
            {loading ? 'Inatafuta...' : `Bidhaa ${count.toLocaleString()}`}
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Search className="w-10 h-10" />}
            title="Hakuna bidhaa zilizopatikana"
            description={q ? `Hakuna matokeo kwa "${q}"` : 'Jaribu kubadilisha vichujio'}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button onClick={() => setParam('page', String(page - 1))} disabled={page <= 1} className="btn-secondary py-2 px-3 text-sm disabled:opacity-40">← Nyuma</button>
            <span className="text-sm text-ink-600 px-2">Ukurasa {page} / {totalPages}</span>
            <button onClick={() => setParam('page', String(page + 1))} disabled={page >= totalPages} className="btn-secondary py-2 px-3 text-sm disabled:opacity-40">Mbele →</button>
          </div>
        )}
      </div>
    </main>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-100 text-brand-700 rounded-full text-xs font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-brand-900"><X className="w-3 h-3" /></button>
    </span>
  )
}

function sortLabel(sort: string) {
  const map: Record<string, string> = { price_asc: 'Bei: Chini', price_desc: 'Bei: Juu', popular: 'Maarufu' }
  return map[sort] ?? sort
}

function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="aspect-square bg-ink-100" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-ink-100 rounded w-2/3" />
        <div className="h-3 bg-ink-100 rounded w-full" />
        <div className="h-4 bg-ink-100 rounded w-1/2" />
      </div>
    </div>
  )
}
