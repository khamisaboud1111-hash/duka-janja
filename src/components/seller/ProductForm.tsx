'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ImageUploader from '@/components/shared/ImageUploader'
import VideoUploader from '@/components/shared/VideoUploader'
import { slugify, generateSKU } from '@/utils'
import type { Product, Category, Seller } from '@/types'
import toast from 'react-hot-toast'

const schema = z.object({
  name:               z.string().min(2, 'Jina linahitajika'),
  description:        z.string().min(10, 'Maelezo yanachukua angalau herufi 10'),
  category_id:        z.string().min(1, 'Chagua aina'),
  price:              z.coerce.number().min(100, 'Bei lazima iwe zaidi ya TZS 100'),
  compare_at_price:   z.coerce.number().optional(),
  stock_quantity:     z.coerce.number().min(0),
  sku:                z.string().optional(),
  weight_grams:       z.coerce.number().optional(),
  is_made_in_zanzibar: z.boolean(),
  location_area:      z.string().optional(),
  pickup_available:   z.boolean(),
  delivery_available: z.boolean(),
  status:             z.enum(['draft', 'active']),
})
type FormData = z.infer<typeof schema>

interface Props {
  seller: Seller
  product?: Product
}

export default function ProductForm({ seller, product }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [categories, setCategories] = useState<Category[]>([])
  const [images, setImages] = useState<string[]>(product?.images?.map(i => i.url) ?? [])
  const [videos, setVideos] = useState<string[]>(product?.videos?.map(v => v.url) ?? [])
  const [saving, setSaving] = useState(false)
  const isEdit = !!product

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: product ? {
      name:                product.name,
      description:         product.description,
      category_id:         product.category_id,
      price:               product.price,
      compare_at_price:    product.compare_at_price ?? undefined,
      stock_quantity:      product.stock_quantity,
      sku:                 product.sku ?? '',
      weight_grams:        product.weight_grams ?? undefined,
      is_made_in_zanzibar: product.is_made_in_zanzibar,
      location_area:       product.location_area ?? '',
      pickup_available:    product.pickup_available ?? false,
      delivery_available:  product.delivery_available ?? true,
      status:              product.status as 'draft' | 'active',
    } : {
      is_made_in_zanzibar: false,
      pickup_available: false,
      delivery_available: true,
      status: 'draft',
      stock_quantity: 0,
    }
  })

  const name = watch('name')

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories(data ?? []))
  }, [])

  async function onSubmit(data: FormData) {
    if (images.length === 0) { toast.error('Ongeza picha angalau moja'); return }
    setSaving(true)

    const slug = slugify(data.name) + '-' + Date.now().toString(36)
    const sku  = data.sku || generateSKU(seller.store_name, data.name)

    let productId = product?.id

    if (isEdit) {
      const { error } = await supabase.from('products').update({ ...data, updated_at: new Date().toISOString() }).eq('id', productId!)
      if (error) { toast.error(error.message); setSaving(false); return }
    } else {
      const { data: created, error } = await supabase.from('products').insert({
        ...data, seller_id: seller.id, slug, sku,
      }).select().single()
      if (error || !created) { toast.error(error?.message ?? 'Hitilafu'); setSaving(false); return }
      productId = created.id
    }

    // Sync images
    if (productId) {
      // Delete old images on edit
      if (isEdit) await supabase.from('product_images').delete().eq('product_id', productId)
      // Insert new
      const imgRows = images.map((url, i) => ({
        product_id: productId!, url, sort_order: i, is_primary: i === 0,
      }))
      await supabase.from('product_images').insert(imgRows)

      // Sync videos
      if (isEdit) await supabase.from('product_videos').delete().eq('product_id', productId)
      if (videos.length > 0) {
        const vidRows = videos.map((url, i) => ({ product_id: productId!, url, sort_order: i }))
        await supabase.from('product_videos').insert(vidRows)
      }
    }

    toast.success(isEdit ? 'Bidhaa imesasishwa' : 'Bidhaa imeundwa!')
    router.push('/seller/products')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {/* Basic info */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-ink-800">Maelezo ya Msingi</h2>

        <div>
          <label className="label">Jina la bidhaa *</label>
          <input {...register('name')} className={`input ${errors.name ? 'border-red-400' : ''}`} placeholder="Mfano: Kikoi ya Zanzibar" />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label">Maelezo *</label>
          <textarea {...register('description')} rows={4} className={`input resize-none ${errors.description ? 'border-red-400' : ''}`} placeholder="Elezea bidhaa yako vizuri..." />
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
        </div>

        <div>
          <label className="label">Aina *</label>
          <select {...register('category_id')} className={`input ${errors.category_id ? 'border-red-400' : ''}`}>
            <option value="">-- Chagua aina --</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name_sw}</option>)}
          </select>
          {errors.category_id && <p className="mt-1 text-xs text-red-500">{errors.category_id.message}</p>}
        </div>

        <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200 cursor-pointer"
          onClick={() => setValue('is_made_in_zanzibar', !watch('is_made_in_zanzibar'))}>
          <input type="checkbox" {...register('is_made_in_zanzibar')} className="w-4 h-4 rounded accent-amber-500" />
          <div>
            <p className="text-sm font-semibold text-amber-800">🏅 Imezalishwa Zanzibar</p>
            <p className="text-xs text-amber-600">Tiki hii kama bidhaa yako imezalishwa Zanzibar</p>
          </div>
        </div>
      </div>

      {/* Pricing & stock */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-ink-800">Bei na Hisa</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Bei (TZS) *</label>
            <input type="number" {...register('price')} className={`input ${errors.price ? 'border-red-400' : ''}`} placeholder="15000" />
            {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
          </div>
          <div>
            <label className="label">Bei ya zamani (hiari)</label>
            <input type="number" {...register('compare_at_price')} className="input" placeholder="20000" />
          </div>
          <div>
            <label className="label">Idadi ya hisa *</label>
            <input type="number" {...register('stock_quantity')} className="input" placeholder="10" />
          </div>
          <div>
            <label className="label">SKU (hiari)</label>
            <input {...register('sku')} className="input" placeholder={name ? generateSKU(seller.store_name, name) : 'Auto'} />
          </div>
          <div>
            <label className="label">Uzito (gramu, hiari)</label>
            <input type="number" {...register('weight_grams')} className="input" placeholder="500" />
          </div>
        </div>
      </div>

      {/* Location & delivery options */}
      <div className="card p-5 space-y-4">
        <h2 className="font-semibold text-ink-800">Mahali na Uwasilishaji</h2>
        <div>
          <label className="label">Eneo la bidhaa (hiari)</label>
          <input {...register('location_area')} className="input" placeholder="Mfano: Stone Town, Michenzani" />
        </div>
        <div className="flex gap-3">
          <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${watch('delivery_available') ? 'border-brand-500 bg-brand-50' : 'border-ink-200'}`}>
            <input type="checkbox" {...register('delivery_available')} className="w-4 h-4 rounded accent-brand-500" />
            <span className="text-sm font-medium">🚚 Uwasilishaji unapatikana</span>
          </label>
          <label className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${watch('pickup_available') ? 'border-brand-500 bg-brand-50' : 'border-ink-200'}`}>
            <input type="checkbox" {...register('pickup_available')} className="w-4 h-4 rounded accent-brand-500" />
            <span className="text-sm font-medium">🏪 Kuchukua dukani</span>
          </label>
        </div>
      </div>

      {/* Videos */}
      <div className="card p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-ink-800">Video za Bidhaa (hiari)</h2>
          <p className="text-xs text-ink-500 mt-0.5">Ongeza hadi video 2 kuonyesha bidhaa yako vizuri zaidi.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {videos.map((url, i) => (
            <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-ink-100 group">
              <video src={url} className="w-full h-full object-cover" muted />
              <button type="button" onClick={() => setVideos(v => v.filter((_, idx) => idx !== i))}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {videos.length < 2 && (
            <VideoUploader
              folder={`${seller.id}`}
              onChange={(url) => setVideos(prev => [...prev, url])}
            />
          )}
        </div>
      </div>

      {/* Images */}
      <div className="card p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-ink-800">Picha za Bidhaa</h2>
          <p className="text-xs text-ink-500 mt-0.5">Picha ya kwanza itakuwa kuu. Ongeza hadi picha 6.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-ink-100 group">
              <img src={url} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 text-xs bg-brand-500 text-white px-1.5 py-0.5 rounded-full font-medium">Kuu</span>
              )}
              <button type="button" onClick={() => setImages(imgs => imgs.filter((_, idx) => idx !== i))}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {images.length < 6 && (
            <ImageUploader
              bucket="product-images"
              folder={`${seller.id}`}
              aspectRatio="square"
              onChange={(url) => setImages(prev => [...prev, url])}
              label=""
            />
          )}
        </div>
        {images.length === 0 && <p className="text-xs text-red-500">Angalau picha moja inahitajika</p>}
      </div>

      {/* Status & submit */}
      <div className="card p-5">
        <h2 className="font-semibold text-ink-800 mb-3">Hali ya Bidhaa</h2>
        <div className="flex gap-3 mb-5">
          {['draft', 'active'].map(s => (
            <label key={s} className={`flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${watch('status') === s ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-brand-200'}`}>
              <input type="radio" {...register('status')} value={s} className="sr-only" />
              <div>
                <p className="font-semibold text-sm">{s === 'draft' ? '📝 Rasimu' : '✅ Inauzwa'}</p>
                <p className="text-xs text-ink-500">{s === 'draft' ? 'Haitaonekana dukani' : 'Itaonekana dukani mara moja'}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="btn-secondary flex-1 justify-center">
            Ghairi
          </button>
          <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Inahifadhi...' : isEdit ? 'Sasisha bidhaa' : 'Unda bidhaa'}
          </button>
        </div>
      </div>
    </form>
  )
}
