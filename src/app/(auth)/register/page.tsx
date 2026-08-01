'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, User, Phone, Eye, EyeOff, ShoppingBag, Store, Bike, Check, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useLangStore } from '@/store'
import { t, type Language } from '@/i18n/translations'
import toast from 'react-hot-toast'
import ShippingSteps from '@/components/home/ShippingSteps'

const ROLES = [
  {
    id: 'buyer' as const,
    label: 'Mnunuzi',
    tagline: 'Nunua bidhaa halisi za Zanzibar kwa urahisi na uhakika.',
    icon: ShoppingBag,
  },
  {
    id: 'seller' as const,
    label: 'Muuzaji',
    tagline: 'Fungua duka lako na ufikie wateja kote Zanzibar.',
    icon: Store,
  },
  {
    id: 'rider' as const,
    label: 'Dereva',
    tagline: 'Pata kipato kwa kusafirisha bidhaa kwa bodaboda yako.',
    icon: Bike,
  },
]

function makeRegisterSchema(lang: Language) {
  return z.object({
    full_name: z.string().min(2, t('nameRequired', lang)),
    email:     z.string().email(t('invalidEmail', lang)),
    phone:     z.string().min(10, t('phoneRequired', lang)),
    password:  z.string().min(8, t('passwordMinLength', lang)),
    type:      z.enum(['buyer', 'seller', 'rider']),
  })
}
type FormData = z.infer<ReturnType<typeof makeRegisterSchema>>

const TYPE_PARAM_MAP: Record<string, FormData['type']> = { seller: 'seller', rider: 'rider', buyer: 'buyer' }

const slide = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 56 : -56 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -56 : 56 }),
}

export default function RegisterPage() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()
  const { lang } = useLangStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState(1)
  const [direction, setDirection] = useState(1)

  const defaultType = TYPE_PARAM_MAP[params.get('type') ?? ''] ?? 'buyer'

  const STAGES = [
    { id: 1, label: t('welcome', lang) },
    { id: 2, label: t('accountType', lang) },
    { id: 3, label: t('details', lang) },
  ]

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(makeRegisterSchema(lang)),
    defaultValues: { type: defaultType },
  })

  const accountType = watch('type')

  function goTo(next: number) {
    setDirection(next > stage ? 1 : -1)
    setStage(next)
  }

  async function onSubmit(data: FormData) {
    setLoading(true)

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.full_name, phone: data.phone, role: data.type },
      },
    })

    if (error) {
      toast.error(error.message === 'User already registered' ? t('emailAlreadyRegistered', lang) : error.message)
      setLoading(false)
      return
    }

    if (!authData.user) {
      toast.error(t('accountCreateFailed', lang))
      setLoading(false)
      return
    }

    // No session means the Supabase project still requires email
    // confirmation, so there's no authenticated context yet to update the
    // profile under RLS, and nothing to redirect the user into. Send them
    // to login with a clear message instead of a protected page that will
    // just bounce them.
    if (!authData.session) {
      toast.success(t('accountCreatedVerifyEmail', lang))
      router.push('/login')
      setLoading(false)
      return
    }

    // We have a real session now (auto-confirm is on) — set the role/phone
    // under proper RLS auth context, and actually check for failure instead
    // of silently ignoring it.
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: data.full_name, phone: data.phone, role: data.type })
      .eq('id', authData.user.id)

    if (profileError) {
      toast.error(t('profileUpdateFailed', lang))
      router.push('/')
      router.refresh()
      setLoading(false)
      return
    }

    toast.success(t('welcome', lang))
    if (data.type === 'seller') router.push('/seller/settings?onboarding=true')
    else if (data.type === 'rider') router.push('/rider/apply')
    else router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full max-w-4xl">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
        {/* ─── Staged signup card ─────────────────────────────────────── */}
        <div className="card dark:bg-ink-900 dark:border-ink-800 p-6 sm:p-8">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-2 mb-7">
            {STAGES.map((s, i) => {
              const active = stage === s.id
              const done = stage > s.id
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <motion.div
                      animate={{ scale: active ? 1.08 : 1 }}
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                        done
                          ? 'bg-teal-500 text-white'
                          : active
                            ? 'bg-teal-500 text-white shadow-glow-brand'
                            : 'bg-ink-100 dark:bg-ink-800 text-ink-400'
                      }`}
                    >
                      {done ? <Check className="w-4 h-4" strokeWidth={3} /> : s.id}
                    </motion.div>
                    <span className={`text-[10px] font-semibold ${active ? 'text-teal-600 dark:text-teal-300' : 'text-ink-400'}`}>
                      {s.label}
                    </span>
                  </div>
                  {i < STAGES.length - 1 && (
                    <div className={`w-8 h-0.5 rounded-full mb-4 transition-colors ${stage > s.id ? 'bg-teal-400' : 'bg-ink-100 dark:bg-ink-800'}`} />
                  )}
                </div>
              )
            })}
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            {/* ── Stage 1: Welcome ── */}
            {stage === 1 && (
              <motion.div
                key="welcome"
                custom={direction}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-center"
              >
                <div className="relative mx-auto w-24 h-24 mb-5">
                  <div className="absolute inset-0 rounded-full bg-teal-500/15 animate-pulse-glow" />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-glow-brand animate-float-slow">
                    <ShoppingBag className="w-11 h-11 text-white" />
                  </div>
                </div>

                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 text-[11px] font-bold tracking-wide uppercase mb-3"
                >
                  <Sparkles className="w-3.5 h-3.5" /> {t('welcomeToDukaJanja', lang)}
                </motion.span>

                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="font-display font-black text-2xl sm:text-3xl text-ink-900 dark:text-white mb-2"
                >
                  {t('startBuyingSellingToday', lang)}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-sm text-ink-500 dark:text-ink-400 max-w-sm mx-auto mb-7"
                >
                  {t('joinThousands', lang)}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="space-y-2.5"
                >
                  <button
                    type="button"
                    onClick={() => goTo(2)}
                    className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold rounded-xl hover:from-teal-500 hover:to-emerald-500 transition-all shadow-lg hover:shadow-2xl hover:-translate-y-0.5 active:scale-95"
                  >
                    {t('startNow', lang)}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <p className="text-sm text-ink-500 dark:text-ink-400">
                    {t('haveAccount', lang)}{' '}
                    <Link href="/login" className="text-brand-600 dark:text-brand-300 font-semibold hover:underline">{t('loginHere', lang)}</Link>
                  </p>
                </motion.div>
              </motion.div>
            )}

            {/* ── Stage 2: Choose role ── */}
            {stage === 2 && (
              <motion.div
                key="role"
                custom={direction}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <div className="text-center mb-5">
                  <h2 className="font-display font-black text-2xl text-ink-900 dark:text-white mb-1">{t('getStartedLabel', lang)}</h2>
                  <p className="text-sm text-ink-500 dark:text-ink-400">{t('wantToJoinAs', lang)}</p>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-2">
                  {ROLES.map((role, i) => {
                    const Icon = role.icon
                    const isSelected = accountType === role.id
                    return (
                      <motion.button
                        key={role.id}
                        type="button"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.1 }}
                        onClick={() => setValue('type', role.id)}
                        aria-pressed={isSelected}
                        className={`relative rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-3 p-6 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
                          isSelected
                            ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-ink-900 bg-brand-50 dark:bg-brand-950/30 scale-[1.03] shadow-xl'
                            : 'ring-1 ring-ink-200 dark:ring-ink-700 bg-ink-50 dark:bg-ink-800 opacity-75 hover:opacity-100 hover:scale-[1.01]'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center shadow"
                          >
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                          isSelected
                            ? 'bg-brand-500 text-white shadow-lg'
                            : 'bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-400'
                        }`}>
                          <Icon className="w-7 h-7" />
                        </div>
                        <span className={`font-bold text-sm ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-ink-700 dark:text-ink-300'}`}>
                          {role.label}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>
                <p className="text-xs text-ink-500 dark:text-ink-400 text-center min-h-[2.2em] mb-4 px-1">
                  {ROLES.find((r) => r.id === accountType)?.tagline}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => goTo(1)}
                    className="btn-secondary px-4 py-2.5 shrink-0"
                    aria-label={t('goBack', lang)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo(3)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold rounded-xl hover:from-teal-500 hover:to-emerald-500 transition-all shadow-lg hover:shadow-2xl hover:-translate-y-0.5 active:scale-95"
                  >
                    {t('continueLabel', lang)}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Stage 3: Details form ── */}
            {stage === 3 && (
              <motion.div
                key="form"
                custom={direction}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <div className="text-center mb-5">
                  <h2 className="font-display font-black text-2xl text-ink-900 dark:text-white mb-1">
                    {t('createAccount', lang)}
                  </h2>
                  <p className="text-sm text-ink-500 dark:text-ink-400">
                    {t('asRoleDetails', lang).replace('{role}', ROLES.find((r) => r.id === accountType)?.label ?? '')} — maelezo yako ya kuingia
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                  <input type="hidden" {...register('type')} />

                  <div>
                    <label className="label dark:text-ink-300">{t('fullName', lang)}</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                      <input {...register('full_name')} placeholder={t('fullNamePlaceholder', lang)} className={`input dark:bg-ink-800 dark:border-ink-700 dark:text-white pl-9 ${errors.full_name ? 'border-red-400' : ''}`} />
                    </div>
                    {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>}
                  </div>

                  <div>
                    <label className="label dark:text-ink-300">{t('email', lang)}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                      <input {...register('email')} type="email" autoComplete="email" placeholder={t('emailPlaceholder', lang)} className={`input dark:bg-ink-800 dark:border-ink-700 dark:text-white pl-9 ${errors.email ? 'border-red-400' : ''}`} />
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                  </div>

                  <div>
                    <label className="label dark:text-ink-300">{t('phone', lang)}</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                      <input {...register('phone')} placeholder="255777000000" className={`input dark:bg-ink-800 dark:border-ink-700 dark:text-white pl-9 ${errors.phone ? 'border-red-400' : ''}`} />
                    </div>
                    {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                  </div>

                  <div>
                    <label className="label dark:text-ink-300">{t('password', lang)}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                      <input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder={t('min8Chars', lang)} className={`input dark:bg-ink-800 dark:border-ink-700 dark:text-white pl-9 pr-10 ${errors.password ? 'border-red-400' : ''}`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => goTo(2)}
                      className="btn-secondary px-4 py-3 shrink-0"
aria-label={t('goBack', lang)}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                      {loading ? t('creatingAccount', lang) : t('createAccount', lang)}
                    </button>
                  </div>
                </form>

                <p className="text-center text-sm text-ink-500 dark:text-ink-400 mt-4">
                  {t('haveAccount', lang)}{' '}
                  <Link href="/login" className="text-brand-600 dark:text-brand-300 font-semibold hover:underline">{t('loginHere', lang)}</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── Shipping steps sidebar ──────────────────────────────────── */}
        <div className="hidden lg:block lg:sticky lg:top-6">
          <div className="rounded-2xl bg-white/70 dark:bg-ink-900/60 backdrop-blur-sm border border-ink-100 dark:border-ink-800 shadow-card p-6">
            <ShippingSteps />
          </div>
        </div>
      </div>

      {/* Shipping steps on mobile — below the card */}
      <div className="lg:hidden mt-8">
        <div className="rounded-2xl bg-white/70 dark:bg-ink-900/60 backdrop-blur-sm border border-ink-100 dark:border-ink-800 shadow-card p-6">
          <ShippingSteps />
        </div>
      </div>
    </div>
  )
}
