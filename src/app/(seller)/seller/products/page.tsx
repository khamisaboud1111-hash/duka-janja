'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useSeller } from '@/hooks/useSeller'
import { ProductStatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog, PageLoader, EmptyState } from '@/components/ui'
import { formatTZS } from '@/utils'
import type { Product } from '@/types'
import toast from 'react-hot-toast'

export default function SellerProductsPage() {
  const supabase = createClient()
  const { seller, loading: sellerLoading } = useSeller()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  if (sellerLoading) return <PageLoader />

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="font-display font-black text-2xl text-ink-900">Bidhaa Zangu</h1>
        <Link href="/seller/products/new" className="btn-primary gap-1.5 text-sm">
          <Plus className="w-4 h-4" /> Ongeza bidhaa
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="card h-20 animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Plus className="w-10 h-10" />}
          title="Huna bidhaa bado"
          description="Ongeza bidhaa yako ya kwanza"
          action={<Link href="/seller/products/new" className="btn-primary">Ongeza bidhaa</Link>}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 border-b border-ink-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">Bidhaa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide hidden sm:table-cell">Aina</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">Bei</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">Hisa</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">Hali</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">Vitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {products.map((p) => {
                  const img = p.images?.find(i => i.is_primary) ?? p.images?.[0]
                  return (
                    <tr key={p.id} className="hover:bg-ink-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-ink-100 flex-shrink-0">
                            {img ? <Image src={img.url} alt="" fill sizes="40px" className="object-cover" /> : <div className="w-full h-full bg-ink-100" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-ink-900 truncate max-w-[140px]">{p.name}</p>
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
                          <Link href={`/seller/products/edit/${p.id}`} className="p-1.5 rounded-lg text-ink-500 hover:bg-brand-50 hover:text-brand-600 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          <button onClick={() => toggleStatus(p)} className="p-1.5 rounded-lg text-ink-500 hover:bg-brand-50 hover:text-brand-600 transition-colors" title={p.status === 'active' ? 'Ficha' : 'Chapisha'}>
                            {p.status === 'active' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
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
