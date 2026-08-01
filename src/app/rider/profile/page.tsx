'use client'

import { useEffect, useState, useRef } from 'react'
import { User, Phone, Mail, Star, Package, MapPin, Shield, Camera, Save, LogOut } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PageLoader, StatCard } from '@/components/ui'
import { formatTZS } from '@/utils'
import toast from 'react-hot-toast'

export default function RiderProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const { profile, loading: userLoading } = useUser()
  const [riderProfile, setRiderProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editField, setEditField] = useState<string | null>(null)
  const [fieldValue, setFieldValue] = useState('')

  useEffect(() => {
    if (!profile) return
    async function load() {
      setLoading(true)
      const { data } = await supabase.from('rider_profiles').select('*').eq('id', profile!.id).single()
      setRiderProfile(data)
      setLoading(false)
    }
    load()
  }, [profile, supabase])

  function startEdit(field: string, current: string) {
    setEditField(field)
    setFieldValue(current)
  }

  function cancelEdit() {
    setEditField(null)
    setFieldValue('')
  }

  async function saveField() {
    if (!editField || !profile) return
    setSaving(true)
    const updateData: any = {}
    updateData[editField] = fieldValue || null
    const { error } = await supabase.from('rider_profiles').update(updateData).eq('id', profile.id)
    if (error) {
      toast.error('Imeshindikana kusasisha')
    } else {
      setRiderProfile((prev: any) => prev ? { ...prev, [editField]: fieldValue } : prev)
      toast.success('Imesasishwa')
    }
    setSaving(false)
    setEditField(null)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (userLoading || loading) return <PageLoader />

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="font-display font-black text-2xl text-ink-900 dark:text-white mb-6">Wasifu Wangu</h1>

      {/* Profile Header */}
      <div className="card rounded-2xl p-6 mb-6 text-center">
        <div className="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl font-bold text-brand-600 dark:text-brand-300">{profile?.full_name?.charAt(0)?.toUpperCase() ?? 'D'}</span>
        </div>
        <h2 className="font-display font-bold text-lg text-ink-900 dark:text-white">{profile?.full_name}</h2>
        <p className="text-sm text-ink-500">{profile?.email}</p>
        {riderProfile?.is_verified && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-0.5 rounded-full mt-2">
            <Shield className="w-3 h-3" /> Dereva Aliyethibitishwa
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatCard label="Safari" value={String(riderProfile?.total_deliveries || 0)} icon={<Package className="w-5 h-5" />} accent="brand" />
        <StatCard label="Ukadiriaji" value={`${(riderProfile?.rating_average || 0).toFixed(1)} ★`} icon={<Star className="w-5 h-5" />} accent="gold" />
        <StatCard label="Pochi" value={formatTZS(riderProfile?.wallet_balance || 0)} icon={<MapPin className="w-5 h-5" />} accent="green" />
      </div>

      {/* Profile Details */}
      <div className="card rounded-2xl overflow-hidden mb-6">
        <ProfileRow
          icon={<User className="w-5 h-5 text-ink-400" />}
          label="Jina"
          value={profile?.full_name || '—'}
          editing={editField === 'full_name'}
          editValue={fieldValue}
          onEditValue={setFieldValue}
          onStartEdit={() => startEdit('full_name', profile?.full_name ?? '')}
          onSave={saveField}
          onCancel={cancelEdit}
          saving={saving}
        />
        <ProfileRow
          icon={<Phone className="w-5 h-5 text-ink-400" />}
          label="Simu"
          value={riderProfile?.payout_account_number || profile?.phone || '—'}
          editing={editField === 'payout_account_number'}
          editValue={fieldValue}
          onEditValue={setFieldValue}
          onStartEdit={() => startEdit('payout_account_number', riderProfile?.payout_account_number ?? '')}
          onSave={saveField}
          onCancel={cancelEdit}
          saving={saving}
        />
        <ProfileRow
          icon={<Mail className="w-5 h-5 text-ink-400" />}
          label="Barua Pepe"
          value={profile?.email || '—'}
          editing={false}
          editValue=""
          onEditValue={() => {}}
          onStartEdit={() => {}}
          onSave={() => {}}
          onCancel={() => {}}
          saving={false}
        />
        <ProfileRow
          icon={<MapPin className="w-5 h-5 text-ink-400" />}
          label="Njia ya Malipo"
          value={riderProfile?.payout_method === 'mpesa' ? 'M-Pesa' : riderProfile?.payout_method === 'tigo_pesa' ? 'Tigo Pesa' : riderProfile?.payout_method === 'airtel_money' ? 'Airtel Money' : riderProfile?.payout_method === 'halopesa' ? 'Halopesa' : '—'}
          editing={editField === 'payout_method'}
          editValue={fieldValue}
          onEditValue={setFieldValue}
          onStartEdit={() => startEdit('payout_method', riderProfile?.payout_method ?? '')}
          onSave={saveField}
          onCancel={cancelEdit}
          saving={saving}
        />
      </div>

      {/* Sign Out */}
      <button onClick={handleSignOut} className="w-full btn-secondary justify-center py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 gap-2">
        <LogOut className="w-4 h-4" /> Ondoka
      </button>
    </div>
  )
}

function ProfileRow({ icon, label, value, editing, editValue, onEditValue, onStartEdit, onSave, onCancel, saving }: {
  icon: React.ReactNode; label: string; value: string; editing: boolean; editValue: string
  onEditValue: (v: string) => void; onStartEdit: () => void; onSave: () => void
  onCancel: () => void; saving: boolean
}) {
  if (editing) {
    return (
      <div className="px-4 py-3 bg-brand-50/50 dark:bg-brand-950/20">
        <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider mb-2">{label}</p>
        <input value={editValue} onChange={e => onEditValue(e.target.value)} className="input text-sm" autoFocus />
        <div className="flex gap-2 mt-2">
          <button onClick={onSave} disabled={saving} className="text-xs font-semibold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100">
            {saving ? 'Inahifadhi...' : 'Hifadhi'}
          </button>
          <button onClick={onCancel} className="text-xs font-semibold text-ink-500 bg-ink-50 px-3 py-1.5 rounded-lg hover:bg-ink-100">Ghairi</button>
        </div>
      </div>
    )
  }
  return (
    <button onClick={onStartEdit} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-ink-50 dark:hover:bg-ink-800/50 transition-colors text-left border-b border-ink-100 dark:border-ink-800 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-ink-50 dark:bg-ink-800 flex items-center justify-center flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-ink-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{value}</p>
      </div>
      <span className="text-xs text-brand-600 font-medium flex-shrink-0">Badilisha</span>
    </button>
  )
}
