'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Power, Wallet, Package, Star, TrendingUp, ShieldAlert } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useRiderTracking } from '@/hooks/useRiderTracking'
import { createClient } from '@/lib/supabase/client'
import { PageLoader } from '@/components/ui'
import { Button } from '@/components/ui/Button'
import ActiveJobOverlay from '@/components/rider/ActiveJobOverlay'

interface RiderProfileRow {
  id: string
  is_verified: boolean
  is_online: boolean
  account_status: 'active' | 'suspended'
  wallet_balance: number
  rating_average: number
  total_ratings: number
  total_deliveries: number
}

interface Metrics {
  todayEarnings: number
  weekEarnings: number
  completedToday: number
}

export default function RiderDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile, loading: userLoading } = useUser()
  const [riderProfile, setRiderProfile] = useState<RiderProfileRow | null>(null)
  const [metrics, setMetrics] = useState<Metrics>({ todayEarnings: 0, weekEarnings: 0, completedToday: 0 })
  const [loadingData, setLoadingData] = useState(true)
  const [togglingOnline, setTogglingOnline] = useState(false)

  const { isOnline, setIsOnline, toggleOnline, offer, acceptOffer, declineOffer } = useRiderTracking(profile?.id)

  useEffect(() => {
    if (!profile) return
    loadRiderData()
  }, [profile])

  async function loadRiderData() {
    if (!profile) return
    setLoadingData(true)

    const { data: rp } = await supabase.from('rider_profiles').select('*').eq('id', profile.id).single()
    if (rp) {
      setRiderProfile(rp)
      setIsOnline(rp.is_online)
    }

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - 7)

    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('delivery_fee, delivered_at, status')
      .eq('rider_id', profile.id)
      .eq('status', 'delivered')
      .gte('delivered_at', startOfWeek.toISOString())

    let todayEarnings = 0
    let weekEarnings = 0
    let completedToday = 0

    for (const d of deliveries ?? []) {
      if (!d.delivered_at) continue
      weekEarnings += d.delivery_fee
      if (new Date(d.delivered_at) >= startOfDay) {
        todayEarnings += d.delivery_fee
        completedToday += 1
      }
    }

    setMetrics({ todayEarnings, weekEarnings, completedToday })
    setLoadingData(false)
  }

  async function handleToggle() {
    if (!riderProfile) return
    if (!riderProfile.is_verified) {
      toast.error('Akaunti yako bado inasubiri uthibitisho wa msimamizi')
      return
    }
    setTogglingOnline(true)
    const ok = await toggleOnline(!isOnline)
    if (!ok) toast.error('Imeshindikana kubadilisha hali')
    setTogglingOnline(false)
  }

  if (userLoading || loadingData) return <PageLoader />

  if (!profile || profile.role !== 'rider') {
    return (
      <div className="page-container py-16 text-center">
        <p className="text-ink-600 mb-4">Ukurasa huu ni kwa madereva tu.</p>
        <Button onClick={() => router.push('/rider/apply')}>Jiunge kama Dereva</Button>
      </div>
    )
  }

  if (!riderProfile) return <PageLoader />

  if (riderProfile.account_status === 'suspended') {
    return (
      <div className="page-container py-16 text-center max-w-md mx-auto">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h1 className="font-display font-bold text-xl text-ink-900 mb-2">Akaunti Imesimamishwa</h1>
        <p className="text-ink-600 text-sm">
          Akaunti yako ya dereva imesimamishwa kwa sasa kutokana na tathmini ya chini. Wasiliana na msimamizi kwa maelezo zaidi.
        </p>
      </div>
    )
  }

  if (!riderProfile.is_verified) {
    return (
      <div className="page-container py-16 text-center max-w-md mx-auto">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6 text-amber-600" />
        </div>
        <h1 className="font-display font-bold text-xl text-ink-900 mb-2">Inasubiri Uthibitisho</h1>
        <p className="text-ink-600 text-sm">
          Maombi yako yanahakikiwa na msimamizi. Utaweza kuanza kupokea safari pindi utakapothibitishwa.
        </p>
      </div>
    )
  }

  return (
    <div className="page-container py-6 sm:py-8 max-w-3xl mx-auto">
      {/* Online toggle header */}
      <div className="flex items-center justify-between bg-white rounded-2xl shadow-card p-4 sm:p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-ink-300'}`} />
          <div>
            <p className="font-display font-bold text-ink-900">{isOnline ? 'Uko Mtandaoni' : 'Uko Nje ya Mtandao'}</p>
            <p className="text-xs text-ink-500">{isOnline ? 'Unapokea safari mpya' : 'Bonyeza ili kuanza kupokea safari'}</p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={togglingOnline}
          className={`w-16 h-9 rounded-full relative transition-colors flex-shrink-0 ${isOnline ? 'bg-emerald-500' : 'bg-ink-200'} disabled:opacity-60`}
        >
          <span
            className={`absolute top-1 left-1 w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform ${isOnline ? 'translate-x-7' : ''}`}
          >
            <Power className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-600' : 'text-ink-400'}`} />
          </span>
        </button>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <MetricCard icon={<Wallet className="w-4 h-4" />} label="Mapato ya Leo" value={`TZS ${metrics.todayEarnings.toLocaleString()}`} accent="brand" />
        <MetricCard icon={<TrendingUp className="w-4 h-4" />} label="Mapato ya Wiki" value={`TZS ${metrics.weekEarnings.toLocaleString()}`} accent="green" />
        <MetricCard icon={<Wallet className="w-4 h-4" />} label="Salio la Pochi" value={`TZS ${riderProfile.wallet_balance.toLocaleString()}`} accent="gold" />
        <MetricCard icon={<Package className="w-4 h-4" />} label="Safari Zilizokamilika" value={String(riderProfile.total_deliveries)} accent="spice" />
        <MetricCard icon={<Star className="w-4 h-4" />} label="Tathmini" value={riderProfile.rating_average.toFixed(1)} accent="gold" />
      </div>

      <div className="bg-white rounded-2xl shadow-card p-5 text-center">
        <p className="text-sm text-ink-500">
          {isOnline ? 'Tunakutafutia safari karibu na eneo lako...' : 'Washa hali ya mtandaoni ili kuanza kupokea ofa za safari.'}
        </p>
      </div>

      {offer && (
        <ActiveJobOverlay offer={offer} onAccept={acceptOffer} onDecline={declineOffer} />
      )}
    </div>
  )
}

function MetricCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: 'brand' | 'spice' | 'green' | 'gold' }) {
  const colors = {
    brand: 'text-brand-600 bg-brand-50',
    spice: 'text-spice-600 bg-spice-50',
    green: 'text-emerald-600 bg-emerald-50',
    gold: 'text-amber-600 bg-amber-50',
  }
  return (
    <div className="bg-white rounded-2xl shadow-card p-3.5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${colors[accent]}`}>{icon}</div>
      <p className="font-display font-black text-base text-ink-900 leading-tight">{value}</p>
      <p className="text-[10px] text-ink-500 leading-tight mt-0.5">{label}</p>
    </div>
  )
}
