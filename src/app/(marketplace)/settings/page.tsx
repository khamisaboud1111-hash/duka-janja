'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, Phone, MapPin, Lock, Loader2, LogOut,
  Store, Bike, ShoppingBag, Mail, AlertTriangle, CheckCircle2, Clock,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useLangStore } from '@/store'
import { PageLoader } from '@/components/ui'
import { Modal } from '@/components/ui/Modal'
import ImageUploader from '@/components/shared/ImageUploader'
import { DELIVERY_ZONES } from '@/utils'
import type { DeliveryZone } from '@/types'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  phone: z.string().min(9, 'Enter a valid phone number').optional().or(z.literal('')),
  delivery_zone: z.string().optional().or(z.literal('')),
  delivery_address: z.string().optional().or(z.literal('')),
})
type ProfileFormData = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
type PasswordFormData = z.infer<typeof passwordSchema>

const emailSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})
type EmailFormData = z.infer<typeof emailSchema>

type SellerSummary = { status: 'pending' | 'approved' | 'suspended' } | null
type RiderSummary = { is_verified: boolean; account_status: 'active' | 'suspended' } | null

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { profile, loading: authLoading } = useUser()
  const { lang } = useLangStore()

  const [avatar, setAvatar] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [changingEmail, setChangingEmail] = useState(false)
  const [switchingRole, setSwitchingRole] = useState(false)

  const [seller, setSeller] = useState<SellerSummary>(null)
  const [rider, setRider] = useState<RiderSummary>(null)
  const [rolesLoading, setRolesLoading] = useState(true)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({ resolver: zodResolver(profileSchema) })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema) })

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm<EmailFormData>({ resolver: zodResolver(emailSchema) })

  useEffect(() => {
    if (!authLoading && !profile) {
      router.push('/login')
    }
  }, [authLoading, profile, router])

  useEffect(() => {
    if (profile) {
      resetProfile({
        full_name: profile.full_name ?? '',
        phone: profile.phone ?? '',
        delivery_zone: profile.delivery_zone ?? '',
        delivery_address: profile.delivery_address ?? '',
      })
      setAvatar(profile.avatar_url ?? undefined)
      loadRoleInfo(profile.id)
    }
  }, [profile])

  async function loadRoleInfo(userId: string) {
    setRolesLoading(true)
    const [{ data: sellerRow }, { data: riderRow }] = await Promise.all([
      supabase.from('sellers').select('status').eq('user_id', userId).maybeSingle(),
      supabase.from('rider_profiles').select('is_verified, account_status').eq('id', userId).maybeSingle(),
    ])
    setSeller(sellerRow ?? null)
    setRider(riderRow ?? null)
    setRolesLoading(false)
  }

  async function onSaveProfile(data: ProfileFormData) {
    if (!profile) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: data.full_name,
        phone: data.phone || null,
        avatar_url: avatar ?? null,
        delivery_zone: (data.delivery_zone || null) as DeliveryZone | null,
        delivery_address: data.delivery_address || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(lang === 'en' ? 'Profile updated' : 'Wasifu umesasishwa')
      router.refresh()
    }
    setSaving(false)
  }

  async function onChangePassword(data: PasswordFormData) {
    setChangingPassword(true)
    const { error } = await supabase.auth.updateUser({ password: data.password })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(lang === 'en' ? 'Password updated' : 'Nywila imesasishwa')
      resetPassword({ password: '', confirmPassword: '' })
    }
    setChangingPassword(false)
  }

  async function onChangeEmail(data: EmailFormData) {
    setChangingEmail(true)
    const { error } = await supabase.auth.updateUser({ email: data.email })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success(
        lang === 'en'
          ? 'Check both your old and new inbox to confirm the change.'
          : 'Angalia barua pepe yako ya zamani na mpya kuthibitisha mabadiliko.'
      )
    }
    setChangingEmail(false)
  }

  async function switchRole(role: 'buyer' | 'seller' | 'rider') {
    if (!profile || profile.role === role) return
    setSwitchingRole(true)
    const res = await fetch('/api/account/switch-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.message || json.error || 'Could not switch account type')
    } else {
      toast.success(lang === 'en' ? 'Switched account type' : 'Umebadilisha aina ya akaunti')
      router.refresh()
    }
    setSwitchingRole(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    const res = await fetch('/api/account/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: deleteText }),
    })
    const json = await res.json()
    if (!res.ok) {
      toast.error(json.error || 'Could not delete account')
      setDeleting(false)
      return
    }
    await supabase.auth.signOut()
    toast.success(lang === 'en' ? 'Your account has been deleted' : 'Akaunti yako imefutwa')
    router.push('/')
    router.refresh()
  }

  if (authLoading || !profile) return <PageLoader />

  return (
    <div className="page-container max-w-2xl py-6 sm:py-8">
      <h1 className="font-display font-black text-2xl text-ink-900 dark:text-white mb-1">
        {lang === 'en' ? 'Account settings' : 'Mipangilio ya Akaunti'}
      </h1>
      <p className="text-sm text-ink-500 dark:text-ink-400 mb-6">
        {lang === 'en' ? 'Manage your profile, account type, and security' : 'Simamia wasifu wako, aina ya akaunti, na usalama'}
      </p>

      {/* Profile */}
      <form onSubmit={handleProfileSubmit(onSaveProfile)} className="card p-5 sm:p-6 space-y-5 dark:bg-ink-900 dark:border-ink-800">
        <h2 className="font-semibold text-ink-800 dark:text-ink-100 flex items-center gap-2">
          <User className="w-4 h-4" /> {lang === 'en' ? 'Profile' : 'Wasifu'}
        </h2>

        <div className="flex justify-center">
          <ImageUploader
            bucket="avatars"
            folder={profile.id}
            value={avatar}
            onChange={setAvatar}
            onRemove={() => setAvatar(undefined)}
            label={lang === 'en' ? 'Profile photo' : 'Picha ya wasifu'}
            aspectRatio="square"
          />
        </div>

        <div>
          <label className="label dark:text-ink-300">{lang === 'en' ? 'Full name' : 'Jina kamili'}</label>
          <input
            {...registerProfile('full_name')}
            className={`input dark:bg-ink-800 dark:border-ink-700 dark:text-white ${profileErrors.full_name ? 'border-red-400' : ''}`}
          />
          {profileErrors.full_name && <p className="mt-1 text-xs text-red-500">{profileErrors.full_name.message}</p>}
        </div>

        <div>
          <label className="label dark:text-ink-300 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" /> {lang === 'en' ? 'Phone number' : 'Nambari ya simu'}
          </label>
          <input
            {...registerProfile('phone')}
            placeholder="255…"
            className={`input dark:bg-ink-800 dark:border-ink-700 dark:text-white ${profileErrors.phone ? 'border-red-400' : ''}`}
          />
          {profileErrors.phone && <p className="mt-1 text-xs text-red-500">{profileErrors.phone.message}</p>}
        </div>

        <div className="pt-2 border-t border-ink-100 dark:border-ink-800 space-y-4">
          <h3 className="text-sm font-semibold text-ink-700 dark:text-ink-200 flex items-center gap-1.5">
            <MapPin className="w-4 h-4" /> {lang === 'en' ? 'Default delivery details' : 'Maelezo ya utoaji chaguo-msingi'}
          </h3>
          <div>
            <label className="label dark:text-ink-300">{lang === 'en' ? 'Delivery zone' : 'Eneo la utoaji'}</label>
            <select {...registerProfile('delivery_zone')} className="input dark:bg-ink-800 dark:border-ink-700 dark:text-white">
              <option value="">{lang === 'en' ? '-- Select a zone --' : '-- Chagua eneo --'}</option>
              {Object.entries(DELIVERY_ZONES).map(([key, zone]) => (
                <option key={key} value={key}>
                  {lang === 'en' ? zone.nameEn : zone.nameSw}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label dark:text-ink-300">{lang === 'en' ? 'Delivery address' : 'Anwani ya utoaji'}</label>
            <textarea
              {...registerProfile('delivery_address')}
              rows={2}
              className="input resize-none dark:bg-ink-800 dark:border-ink-700 dark:text-white"
              placeholder={lang === 'en' ? 'Street, nearby landmark…' : 'Mtaa, karibu na alama gani...'}
            />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? (lang === 'en' ? 'Saving…' : 'Inahifadhi...') : (lang === 'en' ? 'Save changes' : 'Hifadhi mabadiliko')}
        </button>
      </form>

      {/* Account type switcher */}
      <div className="card p-5 sm:p-6 space-y-4 mt-6 dark:bg-ink-900 dark:border-ink-800">
        <div>
          <h2 className="font-semibold text-ink-800 dark:text-ink-100 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4" /> {lang === 'en' ? 'Account type' : 'Aina ya Akaunti'}
          </h2>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-1">
            {lang === 'en'
              ? 'Switch how you use Duka Janja. Your buyer history, store, and rider profile are all kept — this just changes which dashboard you see.'
              : 'Badilisha jinsi unavyotumia Duka Janja. Historia yako ya ununuzi, duka, na wasifu wa dereva vinabaki salama — hii inabadilisha tu dashibodi unayoona.'}
          </p>
        </div>

        {rolesLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-ink-400" /></div>
        ) : (
          <div className="grid gap-3">
            {/* Buyer */}
            <RoleCard
              icon={<ShoppingBag className="w-5 h-5" />}
              title={lang === 'en' ? 'Buyer' : 'Mnunuzi'}
              status="active"
              statusLabel={lang === 'en' ? 'Always available' : 'Inapatikana kila wakati'}
              isCurrent={profile.role === 'buyer'}
              actionLabel={lang === 'en' ? 'Switch to buyer' : 'Badilisha kuwa mnunuzi'}
              onAction={() => switchRole('buyer')}
              loading={switchingRole}
            />

            {/* Seller */}
            <RoleCard
              icon={<Store className="w-5 h-5" />}
              title={lang === 'en' ? 'Seller' : 'Muuzaji'}
              status={seller ? seller.status : 'none'}
              statusLabel={
                !seller
                  ? (lang === 'en' ? 'Not set up yet' : 'Bado hujafungua')
                  : seller.status === 'approved'
                    ? (lang === 'en' ? 'Approved' : 'Imeidhinishwa')
                    : seller.status === 'pending'
                      ? (lang === 'en' ? 'Awaiting approval' : 'Inasubiri idhini')
                      : (lang === 'en' ? 'Suspended' : 'Imesimamishwa')
              }
              isCurrent={profile.role === 'seller'}
              actionLabel={
                seller
                  ? (lang === 'en' ? 'Switch to seller' : 'Badilisha kuwa muuzaji')
                  : (lang === 'en' ? 'Open a store' : 'Fungua Duka')
              }
              onAction={() => (seller ? switchRole('seller') : router.push('/seller/settings?onboarding=true'))}
              loading={switchingRole}
              disabled={seller?.status === 'suspended'}
            />

            {/* Rider */}
            <RoleCard
              icon={<Bike className="w-5 h-5" />}
              title={lang === 'en' ? 'Rider' : 'Dereva'}
              status={rider ? (rider.is_verified ? 'approved' : 'pending') : 'none'}
              statusLabel={
                !rider
                  ? (lang === 'en' ? 'Not applied yet' : 'Bado hujaomba')
                  : rider.account_status === 'suspended'
                    ? (lang === 'en' ? 'Suspended' : 'Imesimamishwa')
                    : rider.is_verified
                      ? (lang === 'en' ? 'Verified' : 'Imethibitishwa')
                      : (lang === 'en' ? 'Awaiting verification' : 'Inasubiri uthibitisho')
              }
              isCurrent={profile.role === 'rider'}
              actionLabel={
                rider
                  ? (lang === 'en' ? 'Switch to rider' : 'Badilisha kuwa dereva')
                  : (lang === 'en' ? 'Apply as a rider' : 'Omba kuwa Dereva')
              }
              onAction={() => (rider ? switchRole('rider') : router.push('/rider/apply'))}
              loading={switchingRole}
              disabled={rider?.account_status === 'suspended'}
            />
          </div>
        )}
      </div>

      {/* Change email */}
      <form onSubmit={handleEmailSubmit(onChangeEmail)} className="card p-5 sm:p-6 space-y-4 mt-6 dark:bg-ink-900 dark:border-ink-800">
        <h2 className="font-semibold text-ink-800 dark:text-ink-100 flex items-center gap-2">
          <Mail className="w-4 h-4" /> {lang === 'en' ? 'Change email' : 'Badilisha Barua Pepe'}
        </h2>
        <div>
          <label className="label dark:text-ink-300">{lang === 'en' ? 'Current email' : 'Barua pepe ya sasa'}</label>
          <input value={profile.email} disabled className="input bg-ink-50 dark:bg-ink-800/50 text-ink-400 cursor-not-allowed" />
        </div>
        <div>
          <label className="label dark:text-ink-300">{lang === 'en' ? 'New email' : 'Barua pepe mpya'}</label>
          <input
            {...registerEmail('email')}
            type="email"
            placeholder="new@example.com"
            className={`input dark:bg-ink-800 dark:border-ink-700 dark:text-white ${emailErrors.email ? 'border-red-400' : ''}`}
          />
          {emailErrors.email && <p className="mt-1 text-xs text-red-500">{emailErrors.email.message}</p>}
          <p className="mt-1.5 text-xs text-ink-400">
            {lang === 'en'
              ? "You'll get a confirmation link at both your old and new email — the change only applies once you confirm."
              : 'Utapokea kiungo cha kuthibitisha kwenye barua pepe zote mbili — mabadiliko yatatumika baada ya kuthibitisha.'}
          </p>
        </div>
        <button type="submit" disabled={changingEmail} className="btn-secondary w-full justify-center py-3">
          {changingEmail && <Loader2 className="w-4 h-4 animate-spin" />}
          {changingEmail ? (lang === 'en' ? 'Sending…' : 'Inatuma...') : (lang === 'en' ? 'Send confirmation' : 'Tuma Uthibitisho')}
        </button>
      </form>

      {/* Password */}
      <form onSubmit={handlePasswordSubmit(onChangePassword)} className="card p-5 sm:p-6 space-y-4 mt-6 dark:bg-ink-900 dark:border-ink-800">
        <h2 className="font-semibold text-ink-800 dark:text-ink-100 flex items-center gap-2">
          <Lock className="w-4 h-4" /> {lang === 'en' ? 'Change password' : 'Badilisha Nywila'}
        </h2>
        <div>
          <label className="label dark:text-ink-300">{lang === 'en' ? 'New password' : 'Nywila mpya'}</label>
          <input
            {...registerPassword('password')}
            type="password"
            className={`input dark:bg-ink-800 dark:border-ink-700 dark:text-white ${passwordErrors.password ? 'border-red-400' : ''}`}
            placeholder="••••••••"
          />
          {passwordErrors.password && <p className="mt-1 text-xs text-red-500">{passwordErrors.password.message}</p>}
        </div>
        <div>
          <label className="label dark:text-ink-300">{lang === 'en' ? 'Confirm new password' : 'Thibitisha nywila mpya'}</label>
          <input
            {...registerPassword('confirmPassword')}
            type="password"
            className={`input dark:bg-ink-800 dark:border-ink-700 dark:text-white ${passwordErrors.confirmPassword ? 'border-red-400' : ''}`}
            placeholder="••••••••"
          />
          {passwordErrors.confirmPassword && <p className="mt-1 text-xs text-red-500">{passwordErrors.confirmPassword.message}</p>}
        </div>
        <button type="submit" disabled={changingPassword} className="btn-secondary w-full justify-center py-3">
          {changingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
          {changingPassword ? (lang === 'en' ? 'Updating…' : 'Inasasisha...') : (lang === 'en' ? 'Update password' : 'Sasisha Nywila')}
        </button>
      </form>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 mt-6 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors"
      >
        <LogOut className="w-4 h-4" />
        {lang === 'en' ? 'Log out' : 'Toka'}
      </button>

      {/* Danger zone */}
      <div className="mt-8 rounded-2xl border-2 border-red-200 dark:border-red-900/50 p-5 sm:p-6 bg-red-50/50 dark:bg-red-950/10">
        <h2 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-1.5">
          <AlertTriangle className="w-4 h-4" /> {lang === 'en' ? 'Danger zone' : 'Eneo la Hatari'}
        </h2>
        <p className="text-xs text-red-600/80 dark:text-red-400/70 mb-4">
          {lang === 'en'
            ? 'Deleting your account is permanent. Your profile, orders history, and store (if any) will be removed and cannot be recovered.'
            : 'Kufuta akaunti yako ni la kudumu. Wasifu wako, historia ya maagizo, na duka lako (kama lipo) vitaondolewa na haviwezi kurejeshwa.'}
        </p>
        <button
          onClick={() => setDeleteOpen(true)}
          className="text-sm font-semibold text-red-600 border-2 border-red-300 dark:border-red-800 rounded-xl px-4 py-2.5 hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
        >
          {lang === 'en' ? 'Delete my account' : 'Futa Akaunti Yangu'}
        </button>
      </div>

      <Modal open={deleteOpen} onClose={() => { setDeleteOpen(false); setDeleteText('') }} title={lang === 'en' ? 'Delete account' : 'Futa Akaunti'} size="sm">
        <p className="text-sm text-ink-600 dark:text-ink-300 mb-4">
          {lang === 'en'
            ? 'This cannot be undone. Type DELETE below to confirm.'
            : 'Hii haiwezi kutenduliwa. Andika DELETE hapa chini kuthibitisha.'}
        </p>
        <input
          value={deleteText}
          onChange={(e) => setDeleteText(e.target.value)}
          placeholder="DELETE"
          className="input mb-4"
        />
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => { setDeleteOpen(false); setDeleteText('') }}
            className="btn-secondary text-sm"
          >
            {lang === 'en' ? 'Cancel' : 'Ghairi'}
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={deleteText !== 'DELETE' || deleting}
            className="btn-danger text-sm"
          >
            {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
            {lang === 'en' ? 'Delete permanently' : 'Futa Kabisa'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

function RoleCard({
  icon, title, status, statusLabel, isCurrent, actionLabel, onAction, loading, disabled,
}: {
  icon: React.ReactNode
  title: string
  status: 'active' | 'approved' | 'pending' | 'suspended' | 'none'
  statusLabel: string
  isCurrent: boolean
  actionLabel: string
  onAction: () => void
  loading: boolean
  disabled?: boolean
}) {
  const statusColor = {
    active: 'text-brand-600 bg-brand-50 dark:bg-brand-950/30',
    approved: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
    pending: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
    suspended: 'text-red-600 bg-red-50 dark:bg-red-950/30',
    none: 'text-ink-400 bg-ink-50 dark:bg-ink-800',
  }[status]

  const StatusIcon = status === 'approved' || status === 'active' ? CheckCircle2 : status === 'pending' ? Clock : AlertTriangle

  return (
    <div className={`flex items-center justify-between gap-3 p-4 rounded-xl border ${isCurrent ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-950/20' : 'border-ink-100 dark:border-ink-800'}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCurrent ? 'bg-brand-500 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-500 dark:text-ink-300'}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-ink-800 dark:text-ink-100 flex items-center gap-1.5">
            {title}
            {isCurrent && <span className="text-[10px] font-bold text-brand-600 bg-brand-100 dark:bg-brand-900/50 px-1.5 py-0.5 rounded-full">ACTIVE</span>}
          </p>
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium mt-0.5 px-1.5 py-0.5 rounded-md ${statusColor}`}>
            <StatusIcon className="w-3 h-3" /> {statusLabel}
          </span>
        </div>
      </div>
      {!isCurrent && (
        <button
          onClick={onAction}
          disabled={loading || disabled}
          className="btn-secondary text-xs flex-shrink-0 whitespace-nowrap"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
