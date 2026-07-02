'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Phone, MapPin, Lock, Loader2, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'
import { useLangStore } from '@/store'
import { PageLoader } from '@/components/ui'
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

export default function SettingsPage() {
  const supabase = createClient()
  const router = useRouter()
  const { profile, loading: authLoading } = useUser()
  const { lang } = useLangStore()

  const [avatar, setAvatar] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

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
    }
  }, [profile])

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

  async function handleLogout() {
    await supabase.auth.signOut()
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
        {lang === 'en' ? 'Manage your profile, delivery details, and password' : 'Simamia wasifu wako, maelezo ya utoaji, na nywila'}
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
          <label className="label dark:text-ink-300">{lang === 'en' ? 'Email' : 'Barua pepe'}</label>
          <input value={profile.email} disabled className="input bg-ink-50 dark:bg-ink-800/50 text-ink-400 cursor-not-allowed" />
          <p className="mt-1 text-xs text-ink-400">
            {lang === 'en' ? 'Email cannot be changed here. Contact support if you need to update it.' : 'Barua pepe haiwezi kubadilishwa hapa. Wasiliana na msaada ukihitaji kuibadilisha.'}
          </p>
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
    </div>
  )
}
