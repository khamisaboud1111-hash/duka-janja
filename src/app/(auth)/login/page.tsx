'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, Store, Bike, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useLangStore } from '@/store'
import { t, type Language } from '@/i18n/translations'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: string
          full_name: string | null
          avatar_url: string | null
        }
      }
    }
  }
}

type Profile = Database['public']['Tables']['profiles']['Row']

const USER_ROLES = {
  BUYER: 'buyer',
  SELLER: 'seller',
  RIDER: 'rider',
  ADMIN: 'admin',
} as const

const ROUTES = {
  [USER_ROLES.BUYER]: '/',
  [USER_ROLES.SELLER]: '/seller/dashboard',
  [USER_ROLES.RIDER]: '/rider/dashboard',
  [USER_ROLES.ADMIN]: '/admin/dashboard',
} as const

function makeLoginSchema(lang: Language) {
  return z.object({
    email: z.string().trim().email(t('invalidEmail', lang)),
    password: z.string().min(6, t('passwordMinLength', lang)),
  })
}
type FormData = z.infer<ReturnType<typeof makeLoginSchema>>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get('redirect') || ''
  const supabase = createClient()
  const { lang } = useLangStore()

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockoutTimer, setLockoutTimer] = useState(0)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(makeLoginSchema(lang)),
    shouldFocusError: true,
  })

  useEffect(() => {
    if (lockoutTimer <= 0) return
    const interval = setInterval(() => {
      setLockoutTimer((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [lockoutTimer])

  async function onSubmit({ email, password }: FormData) {
    if (loading || lockoutTimer > 0) return

    if (attempts >= 5) {
      setLockoutTimer(30)
      setAttempts(0)
      toast.error(t('tooManyAttempts', lang).replace('{seconds}', '30'))
      return
    }

    setLoading(true)

    try {
      await new Promise((r) => setTimeout(r, 800))

      const normalizedEmail = email.trim().toLowerCase()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })

      if (authError) {
        setAttempts((prev) => prev + 1)
        if (authError.message.includes('Invalid') || authError.status === 400) {
          toast.error('Barua pepe au nywila si sahihi')
        } else if (authError.message.includes('confirmed')) {
          toast.error(t('pleaseVerifyEmail', lang))
        } else {
          toast.error('Imeshindikana kuingia. Angalia mtandao wako.')
        }
        setLoading(false)
        return
      }

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        toast.error('Hitilafu imetokea wakati wa kuthibitisha mtumiaji.')
        setLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name, avatar_url')
        .eq('id', userData.user.id)
        .single()

      if (profileError || !profile) {
        toast.error(t('profileUpdateFailed', lang))
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      if (!(profile.role in ROUTES)) {
        toast.error(t('unrecognizedRole', lang))
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      setSuccess(true)
      toast.success(t('redirecting', lang))

      const destination =
        redirectPath && redirectPath.startsWith('/')
          ? redirectPath
          : ROUTES[profile.role as keyof typeof ROUTES] ?? '/'

      setTimeout(() => {
        router.replace(destination)
      }, 500)
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error('Network error. Please try again.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className={`card dark:bg-ink-900 dark:border-ink-800 p-6 sm:p-8 transition-all ${loading ? 'backdrop-blur animate-pulse opacity-70 pointer-events-none' : ''}`}>
        <div className="text-center mb-6">
          <h1 className="font-display font-black text-2xl text-ink-900 dark:text-white mb-1">{t('welcomeBack', lang)}</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">{t('loginSubtitle', lang)}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label dark:text-ink-300">{t('email', lang)}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                {...register('email')}
                type="email"
                inputMode="email"
                enterKeyHint="next"
                autoComplete="username"
                disabled={loading || lockoutTimer > 0}
                autoFocus
                placeholder={t('emailPlaceholder', lang)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={`input dark:bg-ink-800 dark:border-ink-700 dark:text-white pl-9 ${
                  errors.email ? 'border-red-400' : ''
                }`}
              />
            </div>
            {errors.email && (
              <p id="email-error" role="alert" className="mt-1 text-xs text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="label dark:text-ink-300 mb-0">{t('password', lang)}</label>
              <Link href="/forgot-password" className="text-xs text-brand-600 dark:text-brand-300 hover:underline">
                {t('forgotPassword', lang)}
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                inputMode="text"
                enterKeyHint="go"
                autoComplete="current-password"
                disabled={loading || lockoutTimer > 0}
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
                className={`input dark:bg-ink-800 dark:border-ink-700 dark:text-white pl-9 pr-10 ${
                  errors.password ? 'border-red-400' : ''
                }`}
              />
              <button
                type="button"
                tabIndex={0}
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p id="password-error" role="alert" className="mt-1 text-xs text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || lockoutTimer > 0}
            className="btn-primary w-full justify-center py-3 mt-2 flex items-center gap-2 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {loading || success ? (
              <>
                <Loader2 className="animate-spin w-4 h-4" />
                <span>{success ? t('redirecting', lang) : t('loggingIn', lang)}</span>
              </>
            ) : lockoutTimer > 0 ? (
              <span>{t('pleaseWait', lang).replace('{seconds}', String(lockoutTimer))}</span>
            ) : (
              t('signInWith', lang)
            )}
          </button>
        </form>

        <p className="text-center text-sm text-ink-500 dark:text-ink-400 mt-4">
          {t('noAccount', lang)}{' '}
          <Link href="/register" className="text-brand-600 dark:text-brand-300 font-semibold hover:underline">
            {t('createAccount', lang)}
          </Link>
        </p>

        <div className="flex items-center gap-2 my-4">
          <div className="h-px flex-1 bg-ink-100 dark:bg-ink-800" />
          <span className="text-xs text-ink-400">{t('or', lang)}</span>
          <div className="h-px flex-1 bg-ink-100 dark:bg-ink-800" />
        </div>

        <div className="flex gap-2">
          <Link
            href="/register?type=seller"
            className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl bg-ink-50 dark:bg-ink-800 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
          >
            <Store className="w-4 h-4 text-brand-600 dark:text-brand-300" />
            <span className="text-[11px] font-semibold text-ink-600 dark:text-ink-300">{t('openSellerAccount', lang)}</span>
          </Link>
          <Link
            href="/register?type=rider"
            className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl bg-ink-50 dark:bg-ink-800 hover:bg-ink-100 dark:hover:bg-ink-700 transition-colors"
          >
            <Bike className="w-4 h-4 text-brand-600 dark:text-brand-300" />
            <span className="text-[11px] font-semibold text-ink-600 dark:text-ink-300">{t('joinAsRider', lang)}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
