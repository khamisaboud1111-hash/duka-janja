'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, useRouter } from 'next/navigation'
import { Store, Loader2, MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useSeller } from '@/hooks/useSeller'
import ImageUploader from '@/components/shared/ImageUploader'
import { slugify } from '@/utils'
import { PageLoader } from '@/components/ui'
import toast from 'react-hot-toast'

const schema = z.object({
  store_name:      z.string().min(2, 'Jina la duka linahitajika'),
  description:     z.string().max(500).optional(),
  whatsapp_number: z.string().min(10, 'Nambari ya WhatsApp inahitajika'),
})
type FormData = z.infer<typeof schema>

export default function SellerSettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useSearchParams()
  const isOnboarding = params.get('onboarding') === 'true'
  const { profile, loading: authLoading } = useUser()
  const { seller, loading: sellerLoading, refetch } = useSeller()

  const [logo, setLogo] = useState<string | undefined>()
  const [banner, setBanner] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [locating, setLocating] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (seller) {
      reset({
        store_name: seller.store_name,
        description: seller.description ?? '',
        whatsapp_number: seller.whatsapp_number,
      })
      setLogo(seller.logo_url ?? undefined)
      setBanner(seller.banner_url ?? undefined)
            if ((seller as any).latitude && (seller as any).longitude) {
      setCoords({ lat: (seller as any).latitude, lng: (seller as any).longitude })
    }
    setLocationLabel((seller as any).location_label ?? '')

    } else if (profile) {
      reset({ whatsapp_number: profile.phone ?? '' })
    }
  }, [seller, profile])

  async function onSubmit(data: FormData) {
    if (!profile) return
    setSaving(true)

    const payload = {
      ...data,
      logo_url: logo ?? null,
      banner_url: banner ?? null,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      location_label: locationLabel || null,
      updated_at: new Date().toISOString(),
    }

    if (seller) {
      await supabase.from('sellers').update(payload).eq('id', seller.id)
      toast.success('Maelezo ya duka yamesasishwa')
    } else {
      const slug = slugify(data.store_name) + '-' + Date.now().toString(36).slice(-4)
      const { error } = await supabase.from('sellers').insert({
        ...payload,
        user_id: profile.id,
        store_slug: slug,
        status: 'pending',
      })
      if (error) { toast.error(error.message); setSaving(false); return }
      toast.success('Ombi limetumwa! Tutakagua na kukujibu hivi karibuni.')
      router.push('/seller/dashboard')
    }

    refetch()
    setSaving(false)
  }

  if (authLoading || sellerLoading) return <PageLoader />

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <h1 className="font-display font-black text-2xl text-ink-900 mb-1">
        {seller ? 'Mipangilio ya Duka' : 'Fungua Duka Lako'}
      </h1>
      <p className="text-sm text-ink-500 mb-6">
        {seller ? 'Hariri maelezo ya duka lako' : 'Jaza maelezo ili kuomba kuwa muuzaji'}
      </p>

      {isOnboarding && !seller && (
        <div className="card p-4 mb-5 bg-brand-50 border-brand-100">
          <p className="text-sm text-brand-800">
            👋 Karibu! Jaza maelezo ya duka lako hapa chini. Tutakagua ombi lako ndani ya masaa 24-48.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Logo & banner */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-ink-800 flex items-center gap-2">
            <Store className="w-4 h-4" /> Muonekano wa Duka
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <ImageUploader
              bucket="seller-logos"
              folder={profile?.id ?? 'temp'}
              value={logo}
              onChange={setLogo}
              onRemove={() => setLogo(undefined)}
              label="Logo ya duka"
              aspectRatio="logo"
            />
            <div className="col-span-2 sm:col-span-1">
              <ImageUploader
                bucket="seller-banners"
                folder={profile?.id ?? 'temp'}
                value={banner}
                onChange={setBanner}
                onRemove={() => setBanner(undefined)}
                label="Picha ya jalada (banner)"
                aspectRatio="banner"
              />
            </div>
          </div>
        </div>

        {/* Store info */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-ink-800">Maelezo ya Duka</h2>
          <div>
            <label className="label">Jina la duka *</label>
            <input {...register('store_name')} className={`input ${errors.store_name ? 'border-red-400' : ''}`} placeholder="Mfano: Spice Island Store" />
            {errors.store_name && <p className="mt-1 text-xs text-red-500">{errors.store_name.message}</p>}
          </div>
          <div>
            <label className="label">Maelezo ya duka (hiari)</label>
            <textarea {...register('description')} rows={3} className="input resize-none" placeholder="Eleza duka lako kifupi..." />
          </div>
          <div>
            <label className="label">Nambari ya WhatsApp *</label>
            <input {...register('whatsapp_number')} className={`input ${errors.whatsapp_number ? 'border-red-400' : ''}`} placeholder="255777000000" />
            {errors.whatsapp_number && <p className="mt-1 text-xs text-red-500">{errors.whatsapp_number.message}</p>}
            <p className="text-xs text-ink-400 mt-1">Wateja watawasiliana nawe kupitia nambari hii</p>
          </div>
        </div>

        {/* Store location — shown as a marker on the homepage marketplace map */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-ink-800 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Mahali pa Duka
          </h2>
          <p className="text-xs text-ink-500">
            Hii itaonyesha duka lako kwenye Ramani ya Soko ukurasa wa nyumbani, ili wateja walio karibu wakupate.
          </p>
          <div>
            <label className="label">Eneo (mfano: Mji Mkongwe, Paje)</label>
            <input
              value={locationLabel}
              onChange={(e) => setLocationLabel(e.target.value)}
              className="input"
              placeholder="Mfano: Mji Mkongwe, Zanzibar"
            />
          </div>
          <button
            type="button"
            disabled={locating}
            onClick={() => {
              if (!navigator.geolocation) {
                toast.error('Kivinjari chako hakitumii huduma ya mahali')
                return
              }
              setLocating(true)
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                  setLocating(false)
                  toast.success('Mahali pa duka pamenaswa')
                },
                () => {
                  setLocating(false)
                  toast.error('Imeshindwa kupata mahali. Ruhusu ufikiaji wa mahali kwenye kivinjari.')
                },
                { enableHighAccuracy: true, timeout: 10000 }
              )
            }}
            className="btn-secondary text-sm"
          >
            {locating && <Loader2 className="w-4 h-4 animate-spin" />}
            {coords ? 'Sasisha Mahali pa Sasa' : 'Tumia Mahali Pangu pa Sasa'}
          </button>
          {coords && (
            <p className="text-xs text-brand-600">
              ✓ Mahali pamenaswa ({coords.lat.toFixed(4)}, {coords.lng.toFixed(4)})
            </p>
          )}
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? 'Inahifadhi...' : seller ? 'Hifadhi mabadiliko' : 'Tuma ombi la kuwa muuzaji'}
        </button>
      </form>
    </div>
  )
}
