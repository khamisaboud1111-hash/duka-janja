'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Eye, EyeOff, AlertTriangle, Search, Filter, Download, Grid3X3, List, CheckSquare, Square, ChevronDown, Package, ArrowUpDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSeller } from '@/hooks/useSeller'
import { ProductStatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog, PageLoader, EmptyState, StatCard } from '@/components/ui'
import { formatTZS } from '@/utils'
import type { Product } from '@/types'
import toast from 'react-hot-toast'

type SortKey = 'name' | 'price' | 'stock' | 'created'
type FilterStatus = 'all' | 'active' | 'draft' | 'out_of_stock'

export default function SellerProductsPage() {
  const supabase = createClient()
  const { seller, loading: sellerLoading } = useSeller()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [sortBy, setSortBy] = useState<SortKey>('created')
  const [sortAsc, setSortAsc] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete' | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  async function load() {
    if (!seller) return
    const { data } = await supabase
      .from('products')
      .select(`*, category:categories(name_sw), images:product_images(*)`)
      .eq('seller_id', seller.id)
      .order('created_at', { ascending: false })
    setProducts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { if (seller) load() }, [seller])

  const filtered = useMemo(() => {
    let result = products
    if (statusFilter !== 'all') result = result.filter(p => p.status === statusFilter)
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
    }
    result.sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortBy === 'price') cmp = a.price - b.price
      else if (sortBy === 'stock') cmp = a.stock_quantity - b.stock_quantity
      else cmp = a.created_at.localeCompare(b.created_at)
      return sortAsc ? cmp : -cmp
    })
    return result
  }, [products, search, statusFilter, sortBy, sortAsc])

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    draft: products.filter(p => p.status === 'draft').length,
    lowStock: products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length,
    totalValue: products.reduce((s, p) => s + p.price * p.stock_quantity, 0),
  }), [products])

  function toggleSort(key: SortKey) {
    if (sortBy === key) setSortAsc(!sortAsc)
    else { setSortBy(key); setSortAsc(false) }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(p => p.id)))
  }

  async function toggleStatus(product: Product) {
    const newStatus = product.status === 'active' ? 'draft' : 'active'
    await supabase.from('products').update({ status: newStatus }).eq('id', product.id)
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, status: newStatus } : p))
    toast.success(newStatus === 'active' ? 'Bidhaa imewekwa kwenye soko' : 'Bidhaa imefichwa')
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await supabase.from('products').delete().eq('id', deleteId)
    setProducts(prev => prev.filter(p => p.id !== deleteId))
    setDeleteId(null)
    setDeleting(false)
    toast.success('Bidhaa imefutwa')
  }

  async function handleBulkAction() {
    if (!bulkAction || selected.size === 0) return
    setBulkLoading(true)
    const ids = Array.from(selected)

    if (bulkAction === 'delete') {
      await supabase.from('products').delete().in('id', ids)
      setProducts(prev => prev.filter(p => !selected.has(p.id)))
      toast.success(`${ids.length} bidhaa zimefutwa`)
    } else {
      const newStatus = bulkAction === 'activate' ? 'active' : 'draft'
      await supabase.from('products').update({ status: newStatus }).in('id', ids)
      setProducts(prev => prev.map(p => selected.has(p.id) ? { ...p, status: newStatus as any } : p))
      toast.success(`${ids.length} bidhaa zimebadilishwa hadi ${newStatus}`)
    }

    setSelected(new Set())
    setBulkAction(null)
    setBulkLoading(false)
  }

  function exportCSV() {
    const header = 'Name,Price,Stock,Status,Category\n'
    const rows = filtered.map(p =>
      `"${p.name}",${p.price},${p.stock_quantity},${p.status},"${(p as any).category?.name_sw ?? ''}"`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'bidhaa.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV imetolewa')
  }

  if (sellerLoading) return <PageLoader />

  return (
    <div className="p-4 sm:p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-2xl text-ink-900">Bidhaa Zangu</h1>
          <p className="text-sm text-ink-500 mt-0.5">{stats.total} bidhaa jumla</p>
        </div>
        <Link href="/seller/products/new" className="btn-primary gap-1.5 text-sm">
          <Plus className="w-4 h-4" /> Ongeza bidhaa
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Jumla" value={stats.total} icon={<Package className="w-5 h-5" />} accent="brand" />
        <StatCard label="Hudumu" value={stats.active} icon={<Eye className="w-5 h-5" />} accent="green" />
        <StatCard label="Rasimu" value={stats.draft} icon={<EyeOff className="w-5 h-5" />} accent="gold" />
        <StatCard label="Hisa Chache" value={stats.lowStock} icon={<AlertTriangle className="w-5 h-5" />} accent="spice" />
      </div>

      {/* Search & Toolbar */}
      <div className="card p-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tafuta bidhaa..."
              className="input pl-9 text-sm w-full"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFilters(!showFilters)} className={`btn-secondary text-sm gap-1.5 ${showFilters ? 'bg-brand-50 text-brand-600' : ''}`}>
              <Filter className="w-4 h-4" /> Vichujio
              {statusFilter !== 'all' && <span className="w-2 h-2 rounded-full bg-brand-500" />}
            </button>
            <button onClick={exportCSV} className="btn-secondary text-sm gap-1.5">
              <Download className="w-4 h-4" /> CSV
            </button>
            <div className="flex bg-ink-100 rounded-lg p-0.5">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-ink-900' : 'text-ink-400'}`}>
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-ink-900' : 'text-ink-400'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-ink-100 flex flex-wrap gap-2">
            {(['all', 'active', 'draft', 'out_of_stock'] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === s ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                }`}>
                {s === 'all' ? 'Zote' : s === 'active' ? 'Hudumu' : s === 'draft' ? 'Rasimu' : 'Zimeisha'}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1 text-xs text-ink-500">
              <ArrowUpDown className="w-3 h-3" />
              <button onClick={() => toggleSort('name')} className={`hover:text-ink-800 ${sortBy === 'name' ? 'text-brand-600 font-bold' : ''}`}>Jina</button>
              <span>/</span>
              <button onClick={() => toggleSort('price')} className={`hover:text-ink-800 ${sortBy === 'price' ? 'text-brand-600 font-bold' : ''}`}>Bei</button>
              <span>/</span>
              <button onClick={() => toggleSort('stock')} className={`hover:text-ink-800 ${sortBy === 'stock' ? 'text-brand-600 font-bold' : ''}`}>Hisa</button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="mb-4 p-3 bg-brand-50 border border-brand-200 rounded-xl flex items-center justify-between">
          <span className="text-sm font-medium text-brand-800">{selected.size} imechaguliwa</span>
          <div className="flex gap-2">
            <button onClick={() => setBulkAction('activate')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors">
              Washa
            </button>
            <button onClick={() => setBulkAction('deactivate')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
              Zima
            </button>
            <button onClick={() => setBulkAction('delete')} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors">
              Futa
            </button>
            <button onClick={() => setSelected(new Set())} className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-ink-100 text-ink-600 hover:bg-ink-200 transition-colors">
              Ondoa
            </button>
          </div>
        </div>
      )}

      {/* Product Grid / List */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3' : 'space-y-2'}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-48 animate-pulse rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="w-10 h-10" />}
          title={search || statusFilter !== 'all' ? 'Hakuna bidhaa zinazolingana' : 'Huna bidhaa bado'}
          description={search || statusFilter !== 'all' ? 'Badilisha vichujio au ongeza bidhaa mpya' : 'Ongeza bidhaa yako ya kwanza'}
          action={!search && statusFilter === 'all' ? <Link href="/seller/products/new" className="btn-primary">Ongeza bidhaa</Link> : undefined}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(p => {
            const img = p.images?.find(i => i.is_primary) ?? p.images?.[0]
            const isSelected = selected.has(p.id)
            return (
              <div key={p.id} className={`card rounded-2xl overflow-hidden group transition-all hover:shadow-lg ${isSelected ? 'ring-2 ring-brand-500' : ''}`}>
                {/* Image */}
                <div className="relative aspect-square bg-ink-100">
                  {img ? (
                    <Image src={img.url} alt={p.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-ink-300" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    <ProductStatusBadge status={p.status} />
                  </div>
                  {/* Select Checkbox */}
                  <button onClick={(e) => { e.stopPropagation(); toggleSelect(p.id) }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-md bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-all">
                    {isSelected ? <CheckSquare className="w-4 h-4 text-brand-600" /> : <Square className="w-4 h-4 text-ink-300" />}
                  </button>
                  {/* Low Stock Alert */}
                  {p.stock_quantity > 0 && p.stock_quantity <= 5 && (
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Hisa: {p.stock_quantity}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-3">
                  <p className="font-semibold text-sm text-ink-900 truncate">{p.name}</p>
                  <p className="text-xs text-ink-500 mt-0.5">{(p as any).category?.name_sw ?? 'Haina aina'}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-display font-bold text-brand-700">{formatTZS(p.price)}</span>
                    <span className={`text-xs font-medium ${p.stock_quantity === 0 ? 'text-red-500' : p.stock_quantity <= 5 ? 'text-amber-500' : 'text-emerald-600'}`}>
                      {p.stock_quantity} mfuko
                    </span>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 mt-2 pt-2 border-t border-ink-100">
                    <button onClick={() => toggleStatus(p)} className="p-1.5 rounded-lg text-ink-400 hover:bg-brand-50 hover:text-brand-600 transition-colors" title={p.status === 'active' ? 'Ficha' : 'Chapisha'}>
                      {p.status === 'active' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <Link href={`/seller/products/edit/${p.id}`} className="p-1.5 rounded-lg text-ink-400 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg text-ink-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* List View */
        <div className="card overflow-hidden rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 border-b border-ink-100">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <button onClick={toggleSelectAll} className="text-ink-400 hover:text-ink-600">
                      {selected.size === filtered.length && filtered.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">Bidhaa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide hidden sm:table-cell">Aina</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">Bei</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">Hisa</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">Hali</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">Vitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map(p => {
                  const img = p.images?.find(i => i.is_primary) ?? p.images?.[0]
                  const isSelected = selected.has(p.id)
                  return (
                    <tr key={p.id} className={`hover:bg-ink-50 transition-colors ${isSelected ? 'bg-brand-50/50' : ''}`}>
                      <td className="px-4 py-3">
                        <button onClick={() => toggleSelect(p.id)} className="text-ink-400 hover:text-ink-600">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-brand-600" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-ink-100 flex-shrink-0">
                            {img ? <Image src={img.url} alt="" fill sizes="40px" className="object-cover" /> : <div className="w-full h-full bg-ink-100 flex items-center justify-center"><Package className="w-5 h-5 text-ink-300" /></div>}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-ink-900 truncate max-w-[180px]">{p.name}</p>
                            {p.stock_quantity <= 5 && p.stock_quantity > 0 && (
                              <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Hisa chache</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-ink-500">{(p as any).category?.name_sw}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-semibold text-ink-900">{formatTZS(p.price)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${p.stock_quantity === 0 ? 'text-red-500' : p.stock_quantity <= 5 ? 'text-amber-500' : 'text-emerald-600'}`}>
                          {p.stock_quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <ProductStatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => toggleStatus(p)} className="p-1.5 rounded-lg text-ink-500 hover:bg-brand-50 hover:text-brand-600 transition-colors" title={p.status === 'active' ? 'Ficha' : 'Chapisha'}>
                            {p.status === 'active' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <Link href={`/seller/products/edit/${p.id}`} className="p-1.5 rounded-lg text-ink-500 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg text-ink-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Action Confirm Modal */}
      <Modal open={!!bulkAction} onClose={() => setBulkAction(null)} title={
        bulkAction === 'delete' ? 'Futa bidhaa' : bulkAction === 'activate' ? 'Washa bidhaa' : 'Zima bidhaa'
      } size="sm">
        <ConfirmDialog
          message={bulkAction === 'delete'
            ? `Una uhakika wa kufuta bidhaa ${selected.size}? Hii haiwezi kurudishwa.`
            : `Badilisha hadi ${bulkAction === 'activate' ? 'hudumu' : 'rasimu'} kwa bidhaa ${selected.size}?`}
          onConfirm={handleBulkAction}
          onCancel={() => setBulkAction(null)}
          loading={bulkLoading}
          variant={bulkAction === 'delete' ? 'danger' : 'primary'}
        />
      </Modal>

      {/* Delete Single Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Futa bidhaa" size="sm">
        <ConfirmDialog
          message="Una uhakika wa kufuta bidhaa hii? Kitendo hiki hakiwezi kurudishwa."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
          loading={deleting}
        />
      </Modal>
    </div>
  )
}
