'use client'

import { useEffect, useState, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import toast from 'react-hot-toast'
import { Power, Wallet, Package, Star, TrendingUp, ShieldAlert, RefreshCw, Clock, MapPin, Navigation, Banknote, Phone, MessageCircle, ChevronRight, Zap, ArrowUpRight, Calendar } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { useRiderTracking } from '@/hooks/useRiderTracking'
import { createClient } from '@/lib/supabase/client'
import { StatCard, PageLoader } from '@/components/ui'
import ActiveJobOverlay from '@/components/rider/ActiveJobOverlay'
import { formatTZS } from '@/utils'
import { useLangStore } from '@/store'
import { t, type Language } from '@/i18n/translations'

const RiderNavigationMap = dynamic(
  () => import('@/components/rider/RiderNavigationMap').then((mod) => mod.RiderNavigationMap),
  {
    ssr: false,
    loading: () => <div className="w-full h-64 bg-ink-100 dark:bg-ink-800 rounded-2xl animate-pulse flex items-center justify-center text-ink-500 text-xs">Loading map...</div>
  }
)

enum DeliveryStatus {
  Accepted = 'accepted',
  PickedUp = 'picked_up',
  Delivered = 'delivered',
}

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
  monthEarnings: number
  completedToday: number
  completedWeek: number
  avgRating: number
}

interface ActiveDelivery {
  delivery_id: string
  status: DeliveryStatus
  pickup_lat: number
  pickup_lng: number
  delivery_lat: number | null
  delivery_lng: number | null
  pickup_address: string
  delivery_address: string
  customer_name?: string
  customer_phone?: string
  delivery_fee: number
  distance_meters?: number
}

export default function RiderDashboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const { profile, loading: userLoading } = useUser()
  const lang = useLangStore((s) => s.lang)

  const [riderProfile, setRiderProfile] = useState<RiderProfileRow | null>(null)
  const [metrics, setMetrics] = useState<Metrics>({ todayEarnings: 0, weekEarnings: 0, monthEarnings: 0, completedToday: 0, completedWeek: 0, avgRating: 0 })
  const [loadingData, setLoadingData] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [togglingOnline, setTogglingOnline] = useState(false)
  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(null)
  const [riderLatLng, setRiderLatLng] = useState<{ lat: number; lng: number } | null>(null)
  const [updatingDeliveryStatus, setUpdatingDeliveryStatus] = useState(false)

  const { isOnline, setIsOnline, toggleOnline, offer, acceptOffer, declineOffer, activeDeliveryId } = useRiderTracking(profile?.id)

  const loadRiderData = useCallback(async () => {
    if (!profile) return
    setLoadingData(true)
    setLoadError(null)
    let isMounted = true

    try {
      const [profileResult, metricsResult] = await Promise.all([
        supabase.from('rider_profiles').select('*').eq('id', profile.id).single(),
        (async () => {
          try { return await supabase.rpc('get_rider_metrics', { p_rider_id: profile.id }) }
          catch { return { data: null, error: null } }
        })()
      ])

      if (!isMounted) return

      if (profileResult.error && profileResult.error.code !== 'PGRST116') {
        throw new Error(profileResult.error.message)
      }

      if (profileResult.data) {
        setRiderProfile(profileResult.data)
        setIsOnline(profileResult.data.is_online)
      }

      if (metricsResult.data) {
        setMetrics({
          todayEarnings: metricsResult.data.todayEarnings || 0,
          weekEarnings: metricsResult.data.weekEarnings || 0,
          monthEarnings: metricsResult.data.monthEarnings || 0,
          completedToday: metricsResult.data.completedToday || 0,
          completedWeek: metricsResult.data.completedWeek || 0,
          avgRating: metricsResult.data.avgRating || 0,
        })
      }
    } catch (err: any) {
      if (isMounted) {
        setLoadError(err.message || t('riderProfileLoadFailed', lang))
        toast.error(t('networkErrorOccurred', lang))
      }
    } finally {
      if (isMounted) setLoadingData(false)
    }

    return () => { isMounted = false }
  }, [profile, supabase, setIsOnline])

  useEffect(() => { if (profile) loadRiderData() }, [profile, loadRiderData])

  useEffect(() => {
    if (!profile) return
    const channel = supabase
      .channel(`rider-profile-changes-${profile.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rider_profiles', filter: `id=eq.${profile.id}` },
        (payload) => setRiderProfile(payload.new as RiderProfileRow))
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [profile, supabase])

  useEffect(() => {
    const interval = setInterval(() => { if (profile) loadRiderData() }, 60000)
    return () => clearInterval(interval)
  }, [profile, loadRiderData])

  useEffect(() => {
    if (!loadingData && profile?.role === 'rider' && !riderProfile) router.replace('/rider/apply')
  }, [loadingData, profile, riderProfile, router])

  useEffect(() => {
    if (!activeDeliveryId || !profile) { setActiveDelivery(null); return }
    supabase.rpc('get_active_delivery_for_rider', { p_rider_id: profile.id }).then(({ data, error }) => {
      if (error) { toast.error(t('failedToGetTrip', lang)); return }
      const row = Array.isArray(data) ? data[0] : null
      setActiveDelivery(row ?? null)
    })
  }, [activeDeliveryId, profile, supabase])

  useEffect(() => {
    if (!activeDelivery || !isOnline || !('geolocation' in navigator)) { setRiderLatLng(null); return }
    const id = navigator.geolocation.watchPosition(
      (pos) => { if (pos.coords.accuracy <= 25) setRiderLatLng({ lat: pos.coords.latitude, lng: pos.coords.longitude }) },
      (err) => { if (err.code === err.PERMISSION_DENIED) toast.error(t('gpsPermissionDenied', lang)) },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [activeDelivery, isOnline])

  async function handleToggle() {
    if (!riderProfile) return
    if (!riderProfile.is_verified) { toast.error(t('accountPendingVerification', lang)); return }
    const previousState = isOnline
    setTogglingOnline(true)
    setIsOnline(!previousState)
    setRiderProfile((prev) => prev ? { ...prev, is_online: !previousState } : null)
    const ok = await toggleOnline(!previousState)
    if (!ok) {
      setIsOnline(previousState)
      setRiderProfile((prev) => prev ? { ...prev, is_online: previousState } : null)
      toast.error(t('onlineStatusFailed', lang))
    }
    setTogglingOnline(false)
  }

  async function handleUpdateStatus() {
    if (!activeDelivery || updatingDeliveryStatus) return
    setUpdatingDeliveryStatus(true)
    try {
      const nextStatus = activeDelivery.status === DeliveryStatus.Accepted ? DeliveryStatus.PickedUp : DeliveryStatus.Delivered
      const res = await fetch('/api/delivery/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_id: activeDelivery.delivery_id, status: nextStatus }),
      })
      const json = await res.json()
      if (res.ok) {
        if (nextStatus === DeliveryStatus.Delivered) {
          setActiveDelivery(null)
          toast.success(t('tripCompleted', lang))
          loadRiderData()
        } else {
          setActiveDelivery({ ...activeDelivery, status: DeliveryStatus.PickedUp })
          toast.success(t('itemsPickedUp', lang))
        }
      } else {
        toast.error(json.message || t('statusUpdateFailed', lang))
      }
    } catch {
      toast.error(t('networkErrorOccurred', lang))
    } finally {
      setUpdatingDeliveryStatus(false)
    }
  }

  if (userLoading || loadingData) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
        <div className="h-20 bg-ink-100 dark:bg-ink-800 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-ink-100 dark:bg-ink-800 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-48 bg-ink-100 dark:bg-ink-800 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto text-center space-y-4 pt-16">
        <p className="text-red-500 font-medium">{t('loadDashboardFailed', lang)}</p>
        <button onClick={loadRiderData} className="btn-primary gap-1.5"><RefreshCw className="w-4 h-4" /> {t('retry', lang)}</button>
      </div>
    )
  }

  if (!profile || profile.role !== 'rider') {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto text-center pt-16">
        <p className="text-ink-600 dark:text-ink-300 mb-4">{t('riderOnlyPage', lang)}</p>
        <button onClick={() => router.replace('/rider/apply')} className="btn-primary">{t('joinAsRider', lang)}</button>
      </div>
    )
  }

  if (!riderProfile) return null

  if (riderProfile.account_status === 'suspended') {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto text-center pt-16">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-2">{t('accountSuspended', lang)}</h1>
        <p className="text-ink-600 dark:text-ink-300 text-sm">{t('contactAdmin', lang)}</p>
      </div>
    )
  }

  if (!riderProfile.is_verified) {
    return (
      <div className="p-4 sm:p-6 max-w-md mx-auto text-center pt-16">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-amber-600" />
        </div>
        <h1 className="font-display font-bold text-xl text-ink-900 dark:text-white mb-2">{t('verificationPending', lang)}</h1>
        <p className="text-ink-600 dark:text-ink-300 text-sm">{t('accountPendingVerificationDesc', lang)}</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4">
      {/* Online Status Bar */}
      <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-ink-300'}`} />
          <div>
            <p className="font-display font-bold text-ink-900 dark:text-white">{isOnline ? t('online', lang) : t('offline', lang)}</p>
            <p className="text-xs text-ink-500">{isOnline ? t('receivingNewTrips', lang) : t('goOnlineToStart', lang)}</p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={togglingOnline}
          role="switch" aria-checked={isOnline}
          className={`w-16 h-9 rounded-full relative transition-colors flex-shrink-0 ${isOnline ? 'bg-emerald-500' : 'bg-ink-200 dark:bg-ink-700'} disabled:opacity-60 cursor-pointer`}
        >
          <span className={`absolute top-1 left-1 w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center transition-transform ${isOnline ? 'translate-x-7' : ''}`}>
            <Power className={`w-3.5 h-3.5 ${isOnline ? 'text-emerald-600' : 'text-ink-400'}`} />
          </span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label={t('todayEarnings', lang)} value={formatTZS(metrics.todayEarnings)} icon={<Wallet className="w-5 h-5" />} accent="brand" />
        <StatCard label={t('weekEarnings', lang)} value={formatTZS(metrics.weekEarnings)} icon={<TrendingUp className="w-5 h-5" />} accent="green" />
        <StatCard label={t('walletBalance', lang)} value={formatTZS(riderProfile.wallet_balance)} icon={<Banknote className="w-5 h-5" />} accent="gold" />
        <StatCard label={t('rating', lang)} value={`${riderProfile.rating_average.toFixed(1)} ★`} icon={<Star className="w-5 h-5" />} accent="gold" subtitle={`${riderProfile.total_ratings} ${t('ratingCount', lang)}`} />
      </div>

      {/* Quick Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-ink-900 rounded-xl shadow-card p-3 text-center">
          <p className="font-display font-bold text-lg text-ink-900 dark:text-white">{riderProfile.total_deliveries}</p>
          <p className="text-[10px] text-ink-500">{t('totalDeliveries', lang)}</p>
        </div>
        <div className="bg-white dark:bg-ink-900 rounded-xl shadow-card p-3 text-center">
          <p className="font-display font-bold text-lg text-emerald-600">{metrics.completedToday}</p>
          <p className="text-[10px] text-ink-500">{t('today', lang)}</p>
        </div>
        <div className="bg-white dark:bg-ink-900 rounded-xl shadow-card p-3 text-center">
          <p className="font-display font-bold text-lg text-brand-600">{metrics.completedWeek}</p>
          <p className="text-[10px] text-ink-500">{t('week', lang)}</p>
        </div>
      </div>

      {/* Active Delivery */}
      {activeDelivery && (
        <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-card overflow-hidden">
          <div className="p-4 border-b border-ink-100 dark:border-ink-800 flex items-center justify-between">
            <h2 className="font-display font-bold text-ink-900 dark:text-white">{t('activeDelivery', lang)}</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-900/40 text-brand-600 dark:text-brand-300">
              {activeDelivery.status === DeliveryStatus.Accepted ? t('goingToPickup', lang) : t('pickedUp', lang)}
            </span>
          </div>

          {/* Delivery Info Cards */}
          <div className="p-4 space-y-3">
            {/* Pickup */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-ink-500 font-semibold uppercase">{t('pickupLocation', lang)}</p>
                <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{activeDelivery.pickup_address}</p>
              </div>
            </div>
            {/* Delivery */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Navigation className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-ink-500 font-semibold uppercase">{t('deliveryLocation', lang)}</p>
                <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{activeDelivery.delivery_address}</p>
              </div>
            </div>

            {/* Customer Info */}
            {activeDelivery.customer_name && (
              <div className="flex items-center gap-3 bg-ink-50 dark:bg-ink-800 rounded-xl p-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                  {activeDelivery.customer_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 dark:text-white truncate">{activeDelivery.customer_name}</p>
                  {activeDelivery.customer_phone && (
                    <p className="text-xs text-ink-500">{activeDelivery.customer_phone}</p>
                  )}
                </div>
                {activeDelivery.customer_phone && (
                  <div className="flex gap-2">
                    <a href={`tel:${activeDelivery.customer_phone}`} className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-200 transition-colors">
                      <Phone className="w-4 h-4" />
                    </a>
                    <a href={`https://wa.me/${activeDelivery.customer_phone.replace('+', '')}`} target="_blank" className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-200 transition-colors">
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Earnings for this delivery */}
            <div className="flex items-center justify-between bg-brand-50 dark:bg-brand-900/20 rounded-xl p-3">
              <span className="text-sm text-brand-700 dark:text-brand-300 font-medium">{t('tripEarnings', lang)}</span>
              <span className="font-display font-bold text-brand-700 dark:text-brand-300">{formatTZS(activeDelivery.delivery_fee)}</span>
            </div>
          </div>

          {/* Map */}
          <div className="px-4 pb-4">
            <RiderNavigationMap
              riderLocation={riderLatLng}
              pickupLocation={{ lat: activeDelivery.pickup_lat, lng: activeDelivery.pickup_lng }}
              deliveryLocation={activeDelivery.delivery_lat && activeDelivery.delivery_lng ? { lat: activeDelivery.delivery_lat, lng: activeDelivery.delivery_lng } : null}
              leg={activeDelivery.status === DeliveryStatus.Accepted ? 'to_pickup' : 'to_delivery'}
              customerName={activeDelivery.customer_name}
              customerPhone={activeDelivery.customer_phone}
              customerAddress={activeDelivery.delivery_address}
            />
          </div>

          {/* Action Button */}
          <div className="px-4 pb-4">
            <button
              onClick={handleUpdateStatus}
              disabled={updatingDeliveryStatus}
              className="btn-primary w-full justify-center py-3.5 text-base gap-2"
            >
               {updatingDeliveryStatus ? (
                t('updating', lang)
              ) : activeDelivery.status === DeliveryStatus.Accepted ? (
                <><Package className="w-5 h-5" /> {t('pickUpItems', lang)}</>
              ) : (
                <><CheckCircle className="w-5 h-5" /> {t('delivered', lang)}</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Waiting State */}
      {!activeDelivery && isOnline && (
        <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-brand-500 animate-pulse" />
          </div>
          <p className="font-semibold text-ink-800 dark:text-white mb-1">{t('searchingForTrips', lang)}</p>
          <p className="text-sm text-ink-500">{t('estimatedArrival', lang)}</p>
        </div>
      )}

      {!activeDelivery && !isOnline && (
        <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-ink-100 dark:bg-ink-800 flex items-center justify-center mx-auto mb-4">
            <Power className="w-8 h-8 text-ink-400" />
          </div>
          <p className="font-semibold text-ink-800 dark:text-white mb-1">{t('goOffline', lang)}</p>
          <p className="text-sm text-ink-500">{t('switchOnlineDesc', lang)}</p>
        </div>
      )}

      {/* Offer Overlay */}
      {offer && <ActiveJobOverlay offer={offer} onAccept={acceptOffer} onDecline={declineOffer} />}
    </div>
  )
}

import { CheckCircle } from 'lucide-react'
