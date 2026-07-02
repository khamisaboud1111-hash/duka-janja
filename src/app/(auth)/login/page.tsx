'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useLangStore } from '@/store'
import { t } from '@/i18n/translations'
import toast from 'react-hot-toast'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const { lang, setLang } = useLangStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit({ email, password }: FormData) {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(
        error.message === 'Invalid login credentials'
          ? (lang === 'en' ? 'Incorrect email or password' : 'Barua pepe au nywila si sahihi')
          : error.message
      )
      setLoading(false)
      return
    }
    toast.success(lang === 'en' ? 'Welcome back!' : 'Karibu!')
    router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full max-w-[400px]">
      {/* Language toggle */}
      <div className="flex justify-end mb-5">
        <div className="inline-flex rounded-full border border-ink-200 dark:border-ink-700 p-0.5 bg-ink-50 dark:bg-ink-900">
          <button
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              lang === 'en' ? 'bg-white dark:bg-ink-800 text-brand-600 shadow-sm' : 'text-ink-500'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLang('sw')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              lang === 'sw' ? 'bg-white dark:bg-ink-800 text-brand-600 shadow-sm' : 'text-ink-500'
            }`}
          >
            Kiswahili
          </button>
        </div>
      </div>

      <div className="card p-7 sm:p-9 dark:bg-ink-900 dark:border-ink-800">
        <div className="mb-7">
          <h1 className="font-display font-black text-[26px] leading-tight text-ink-900 dark:text-white mb-1.5">
            {lang === 'en' ? 'Welcome back' : 'Karibu tena'}
          </h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            {lang === 'en' ? 'Sign in to continue to your account' : 'Ingia kuendelea na akaunti yako'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label dark:text-ink-300">{t('email', lang)}</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-ink-400" />
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`input pl-11 h-12 dark:bg-ink-800 dark:border-ink-700 dark:text-white ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
            </div>
            {errors.email && <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="label mb-0 dark:text-ink-300">{t('password', lang)}</label>
              <Link href="/forgot-password" className="text-xs font-medium text-brand-600 hover:text-brand-700 hover:underline">
                {t('forgotPassword', lang)}
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-ink-400" />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`input pl-11 pr-11 h-12 dark:bg-ink-800 dark:border-ink-700 dark:text-white ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 rounded-xl bg-brand-500 hover:bg-brand-600 active:bg-brand-700 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-[0_4px_14px_rgba(29,168,171,0.35)]"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {lang === 'en' ? 'Log in' : 'Ingia'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-ink-100 dark:bg-ink-800" />
          <span className="text-xs text-ink-400">
            {lang === 'en' ? 'New to Duka Janja?' : 'Mgeni Duka Janja?'}
          </span>
          <div className="h-px flex-1 bg-ink-100 dark:bg-ink-800" />
        </div>

        <Link
          href="/register"
          className="w-full h-12 rounded-xl border-2 border-brand-500 text-brand-600 dark:text-brand-300 font-semibold text-sm flex items-center justify-center hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
        >
          {t('createAccount', lang)}
        </Link>
      </div>

      <p className="text-center text-xs text-ink-400 mt-6">
        {lang === 'en' ? 'By continuing you agree to our' : 'Kwa kuendelea unakubali'}{' '}
        <Link href="/policies" className="text-ink-500 dark:text-ink-300 hover:underline font-medium">
          {lang === 'en' ? 'Terms & Privacy Policy' : 'Sera na Masharti'}
        </Link>
      </p>
    </div>
  )
}
