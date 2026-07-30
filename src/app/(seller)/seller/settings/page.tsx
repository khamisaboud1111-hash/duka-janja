'use client'

import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useSeller } from '@/hooks/useSeller'
import { slugify } from '@/utils'
import { PageLoader } from '@/components/ui'
import toast from 'react-hot-toast'

export default function SellerSettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const params = useSearchParams()
  const isOnboarding = params.get('onboarding') === 'true'
  const { profile, loading: authLoading } = useUser()
  const { seller, loading: sellerLoading, refetch } = useSeller()

  const [saving, setSaving] = useState(false)

  const [editField, setEditField] = useState<string | null>(null)
  const [fieldValue, setFieldValue] = useState('')

  const [logo, setLogo] = useState<string | undefined>()
  const [banner, setBanner] = useState<string | undefined>()
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [locationLabel, setLocationLabel] = useState('')
  const [locating, setLocating] = useState(false)

  const logoRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (seller) {
      setLogo(seller.logo_url ?? undefined)
      setBanner(seller.banner_url ?? undefined)
      const s = seller as any
      if (s.latitude && s.longitude) setCoords({ lat: s.latitude, lng: s.longitude })
      setLocationLabel(s.location_label ?? '')
    }
  }, [seller])

  async function uploadImage(file: File, bucket: string, field: 'logo' | 'banner') {
    if (!profile) return
    const ext = file.name.split('.').pop()
    const path = `${profile.id}/${field}.${ext}`
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (uploadError) { toast.error(uploadError.message); return }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
    const url = publicUrl
    if (field === 'logo') setLogo(url)
    else setBanner(url)
    if (seller) {
      await supabase.from('sellers').update({ [`${field}_url`]: url, updated_at: new Date().toISOString() }).eq('id', seller.id)
      refetch()
    }
    toast.success(`${field === 'logo' ? 'Logo' : 'Banner'} updated`)
  }

  function startEdit(field: string, current: string) {
    setEditField(field)
    setFieldValue(current)
  }

  function cancelEdit() {
    setEditField(null)
    setFieldValue('')
  }

  async function saveField() {
    if (!editField) return
    setSaving(true)
    if (seller) {
      await supabase.from('sellers').update({ [editField]: fieldValue || null, updated_at: new Date().toISOString() }).eq('id', seller.id)
      refetch()
    }
    toast.success('Updated')
    setSaving(false)
    setEditField(null)
  }

  async function saveLocation() {
    if (!seller) return
    setSaving(true)
    const s = seller as any
    await supabase.from('sellers').update({
      latitude: coords?.lat ?? s.latitude ?? null,
      longitude: coords?.lng ?? s.longitude ?? null,
      location_label: locationLabel || null,
      updated_at: new Date().toISOString(),
    }).eq('id', seller.id)
    refetch()
    toast.success('Location updated')
    setSaving(false)
  }

  async function handleCreateStore() {
    if (!editField || !profile) return
    setSaving(true)
    const slug = slugify(fieldValue) + '-' + Date.now().toString(36).slice(-4)
    const { error } = await supabase.from('sellers').insert({
      user_id: profile.id,
      store_name: fieldValue,
      store_slug: slug,
      whatsapp_number: profile.phone ?? '',
      status: 'pending',
    })
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Store created! Awaiting approval.')
    router.push('/seller/dashboard')
  }

  if (authLoading || sellerLoading) return <PageLoader />

  return (
    <div className="max-w-lg mx-auto py-0">
      {/* Banner + Logo Hero */}
      <div className="relative">
        <div className="h-36 sm:h-44 bg-gradient-to-br from-brand-400 via-brand-500 to-teal-500 overflow-hidden relative">
          {banner && <img src={banner} alt="" className="w-full h-full object-cover" />}
          <div className="absolute inset-0 bg-black/20" />
          <button onClick={() => bannerRef.current?.click()} className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-lg transition-all hover:scale-105">
            <svg className="w-4 h-4 text-ink-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
            </svg>
          </button>
          <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'seller-banners', 'banner') }} />
        </div>

        <div className="px-4">
          <div className="relative -mt-14 mb-4 flex items-end gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white dark:bg-ink-800 ring-4 ring-white dark:ring-ink-900 shadow-lg">
                {logo ? (
                  <img src={logo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-400 to-brand-600">
                    <span className="text-3xl font-bold text-white">{seller?.store_name?.charAt(0)?.toUpperCase() ?? '?'}</span>
                  </div>
                )}
              </div>
              <button onClick={() => logoRef.current?.click()} className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center shadow-lg transition-all hover:scale-105 border-2 border-white dark:border-ink-900">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'seller-logos', 'logo') }} />
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <h1 className="font-display font-bold text-lg text-ink-900 dark:text-white truncate">
                {seller?.store_name ?? 'Your Store'}
              </h1>
              {seller && (
                <span className={`inline-flex items-center text-[11px] font-semibold mt-0.5 px-2 py-0.5 rounded-full ${
                  seller.status === 'approved' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30'
                  : seller.status === 'pending' ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30'
                  : 'text-red-600 bg-red-50 dark:bg-red-950/30'
                }`}>
                  {seller.status}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding banner */}
      {isOnboarding && !seller && (
        <div className="mx-4 mb-4 px-4 py-3 bg-brand-50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-900/50 rounded-xl">
          <p className="text-sm text-brand-800 dark:text-brand-200 font-medium">👋 Karibu! Jaza maelezo ya duka lako.</p>
        </div>
      )}

      {/* Info Section */}
      <div className="px-4 space-y-3 pb-4">
        {seller ? (
          <>
            <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-sm border border-ink-100 dark:border-ink-800 overflow-hidden divide-y divide-ink-100 dark:divide-ink-800">
              <ProfileRow
                icon={
                  <svg className="w-5 h-5 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                  </svg>
                }
                label="Store Name"
                value={seller.store_name}
                editing={editField === 'store_name'}
                editValue={fieldValue}
                onEditValue={setFieldValue}
                onStartEdit={() => startEdit('store_name', seller.store_name)}
                onSave={saveField}
                onCancel={cancelEdit}
                saving={saving}
              />
              <ProfileRow
                icon={
                  <svg className="w-5 h-5 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                }
                label="Description"
                value={seller.description || '—'}
                editing={editField === 'description'}
                editValue={fieldValue}
                onEditValue={setFieldValue}
                onStartEdit={() => startEdit('description', seller.description ?? '')}
                onSave={saveField}
                onCancel={cancelEdit}
                saving={saving}
              />
              <ProfileRow
                icon={
                  <svg className="w-5 h-5 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                }
                label="WhatsApp"
                value={seller.whatsapp_number}
                editing={editField === 'whatsapp_number'}
                editValue={fieldValue}
                onEditValue={setFieldValue}
                onStartEdit={() => startEdit('whatsapp_number', seller.whatsapp_number)}
                onSave={saveField}
                onCancel={cancelEdit}
                saving={saving}
              />
            </div>

            {/* Location */}
            <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-sm border border-ink-100 dark:border-ink-800 overflow-hidden">
              <div className="px-4 py-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-ink-50 dark:bg-ink-800 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-wider">Location</p>
                  <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{locationLabel || 'Not set'}</p>
                </div>
              </div>
              <div className="px-4 pb-4 space-y-3">
                <input value={locationLabel} onChange={(e) => setLocationLabel(e.target.value)} className="input dark:bg-ink-800 dark:border-ink-700 dark:text-white text-sm" placeholder="e.g. Mji Mkongwe, Zanzibar" />
                <div className="flex gap-2">
                  <button type="button" disabled={locating} onClick={() => {
                    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return }
                    setLocating(true)
                    navigator.geolocation.getCurrentPosition(
                      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); toast.success('Location captured') },
                      () => { setLocating(false); toast.error('Failed to get location') },
                      { enableHighAccuracy: true, timeout: 10000 }
                    )
                  }} className="flex-1 btn-secondary text-xs justify-center py-2">
                    {locating ? 'Getting location...' : coords ? 'Update location' : 'Use my location'}
                  </button>
                  <button onClick={saveLocation} disabled={saving} className="btn-primary text-xs py-2 px-4">
                    Save
                  </button>
                </div>
                {coords && <p className="text-[11px] text-brand-600">✓ {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>}
              </div>
            </div>
          </>
        ) : (
          /* Create store form - simplified */
          <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-sm border border-ink-100 dark:border-ink-800 overflow-hidden">
            <div className="px-4 py-4 space-y-3">
              <p className="text-sm font-semibold text-ink-900 dark:text-white">What should we call your store?</p>
              <input value={fieldValue} onChange={(e) => setFieldValue(e.target.value)} className="input dark:bg-ink-800 dark:border-ink-700 dark:text-white text-sm" placeholder="e.g. Spice Island Store" autoFocus />
              <button onClick={handleCreateStore} disabled={saving || fieldValue.trim().length < 2} className="btn-primary w-full justify-center py-2.5 text-sm">
                {saving ? 'Creating...' : 'Create Store'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileRow({
  icon, label, value, editing, editValue, onEditValue, onStartEdit, onSave, onCancel, saving,
}: {
  icon: React.ReactNode
  label: string
  value: string
  editing: boolean
  editValue: string
  onEditValue: (v: string) => void
  onStartEdit: () => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  if (editing) {
    return (
      <div className="px-4 py-3 bg-brand-50/50 dark:bg-brand-950/20">
        <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-2">{label}</p>
        <input value={editValue} onChange={(e) => onEditValue(e.target.value)} className="input dark:bg-ink-800 dark:border-ink-700 dark:text-white text-sm" autoFocus />
        <div className="flex gap-2 mt-2">
          <button onClick={onSave} disabled={saving} className="text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/30 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={onCancel} className="text-xs font-semibold text-ink-500 bg-ink-50 dark:bg-ink-800 px-3 py-1.5 rounded-lg hover:bg-ink-100 transition-colors">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <button onClick={onStartEdit} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors text-left group">
      <div className="w-8 h-8 rounded-xl bg-ink-50 dark:bg-ink-800 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/30 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{value}</p>
      </div>
      <svg className="w-4 h-4 text-ink-300 dark:text-ink-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
    </button>
  )
}
