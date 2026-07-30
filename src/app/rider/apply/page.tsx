'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { useUser } from '@/hooks/useUser'
import { PageLoader } from '@/components/ui'
import RiderDocumentUploader from '@/components/rider/RiderDocumentUploader'

interface FormState {
  full_name: string
  phone_number: string
  national_id: string
  driving_license: string
  motorcycle_registration: string
  emergency_contact: string
  payout_method: 'mpesa' | 'tigo_pesa' | 'airtel_money' | 'halopesa'
  payout_account_number: string
  selfie_url: string
  license_scan_url: string
}

const STEPS = [
  { key: 'personal', label: 'Personal Info' },
  { key: 'documents', label: 'Documents' },
  { key: 'payout', label: 'Payout' },
  { key: 'review', label: 'Review' },
] as const

export default function RiderApplyPage() {
  const router = useRouter()
  const { profile, loading } = useUser()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState<FormState>({
    full_name: '',
    phone_number: '',
    national_id: '',
    driving_license: '',
    motorcycle_registration: '',
    emergency_contact: '',
    payout_method: 'mpesa',
    payout_account_number: '',
    selfie_url: '',
    license_scan_url: '',
  })

  if (loading) return <PageLoader />

  if (!profile) {
    return (
      <div className="page-container py-16 text-center">
        <p className="text-ink-600 mb-4">Tafadhali ingia kwanza kabla ya kujiunga kama dereva.</p>
        <Button onClick={() => router.push('/login?redirect=/rider/apply')}>Ingia</Button>
      </div>
    )
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function updatePhone(
    key: 'phone_number' | 'emergency_contact' | 'payout_account_number',
    value: string
  ) {
    update(key, value.replace(/[\s-]/g, '') as FormState[typeof key])
  }

  const phonePattern = /^(\+?255|0)[67]\d{8}$/

  function cleanPhone(v: string) {
    return v.trim().replace(/[\s-]/g, '')
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (form.full_name.trim().length < 3) return 'Jina kamili linahitajika'
      if (!phonePattern.test(cleanPhone(form.phone_number))) return 'Namba ya simu si sahihi'
      if (!phonePattern.test(cleanPhone(form.emergency_contact))) return 'Namba ya dharura si sahihi'
    }

    if (step === 1) {
      if (form.national_id.trim().length < 5) return 'Namba ya kitambulisho inahitajika'
      if (form.driving_license.trim().length < 3) return 'Namba ya leseni inahitajika'
      if (form.motorcycle_registration.trim().length < 3) return 'Namba ya usajili wa pikipiki inahitajika'
      if (!form.selfie_url) return 'Picha ya selfie inahitajika'
      if (!form.license_scan_url) return 'Picha ya leseni inahitajika'
    }

    if (step === 2) {
      if (!phonePattern.test(cleanPhone(form.payout_account_number))) {
        return 'Namba ya akaunti ya malipo si sahihi'
      }
    }

    return null
  }

  function next() {
    const err = validateStep()
    if (err) {
      toast.error(err)
      return
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0))
  }

  async function submit() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/rider/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error ?? 'Imeshindikana kutuma maombi')
        if (json.details?.length) console.error(json.details)
        setSubmitting(false)
        return
      }

      setSubmitted(true)
    } catch {
      toast.error('Hitilafu ya mtandao')
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="page-container py-20 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="font-display font-bold text-2xl text-ink-900 mb-2">Maombi Yamepokelewa!</h1>
        <p className="text-ink-600 mb-6">
          Asante kwa kujiunga na Duka Janja kama dereva. Msimamizi atahakiki vyeti vyako ndani ya saa 24-48.
          Utapokea taarifa pindi utakapothibitishwa.
        </p>
        <Button onClick={() => router.push('/')}>Rudi Nyumbani</Button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto py-0">
      {/* Header */}
      <div className="bg-white dark:bg-ink-900 pt-8 pb-6 px-4">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mb-4 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <h1 className="font-display font-bold text-xl text-ink-900 dark:text-white">Jiunge kama Dereva</h1>
          <p className="text-sm text-ink-500 mt-1">Pata kipato kwa kusafirisha bidhaa Zanzibar</p>
        </div>

        {/* Progress stepper */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                i < step ? 'bg-emerald-500 text-white'
                : i === step ? 'bg-brand-500 text-white'
                : 'bg-ink-100 dark:bg-ink-800 text-ink-400'
              }`}>
                {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${i < step ? 'bg-emerald-400' : 'bg-ink-100 dark:bg-ink-800'}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-[11px] font-semibold text-ink-400 dark:text-ink-500 uppercase tracking-wider mt-2">
          {STEPS[step].label}
        </p>
      </div>

      {/* Form Content */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-ink-900 rounded-2xl shadow-sm border border-ink-100 dark:border-ink-800 overflow-hidden p-4 space-y-3">
          {step === 0 && (
            <>
              <Input
                label="Jina Kamili"
                value={form.full_name}
                onChange={(e) => update('full_name', e.target.value)}
                placeholder="Juma Hassan Ali"
              />
              <Input
                label="Namba ya Simu"
                value={form.phone_number}
                onChange={(e) => updatePhone('phone_number', e.target.value)}
                placeholder="0712 345 678"
              />
              <Input
                label="Namba ya Dharura"
                value={form.emergency_contact}
                onChange={(e) => updatePhone('emergency_contact', e.target.value)}
                placeholder="Namba ya jamaa/rafiki"
                hint="Tutawasiliana naye tu wakati wa dharura"
              />
            </>
          )}

          {step === 1 && (
            <>
              <Input
                label="Namba ya Kitambulisho cha Taifa/Zanzibar"
                value={form.national_id}
                onChange={(e) => update('national_id', e.target.value)}
              />
              <Input
                label="Namba ya Leseni ya Udereva"
                value={form.driving_license}
                onChange={(e) => update('driving_license', e.target.value)}
              />
              <Input
                label="Namba ya Usajili wa Pikipiki"
                value={form.motorcycle_registration}
                onChange={(e) => update('motorcycle_registration', e.target.value)}
                placeholder="T123 ABC"
              />
              <div className="grid grid-cols-2 gap-3 pt-1">
                <RiderDocumentUploader
                  userId={profile.id}
                  docType="selfie"
                  value={form.selfie_url}
                  onChange={(path) => update('selfie_url', path)}
                  label="Selfie"
                />
                <RiderDocumentUploader
                  userId={profile.id}
                  docType="license"
                  value={form.license_scan_url}
                  onChange={(path) => update('license_scan_url', path)}
                  label="License"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <Select
                label="Njia ya Malipo"
                value={form.payout_method}
                onChange={(e) => update('payout_method', e.target.value as FormState['payout_method'])}
              >
                <option value="mpesa">M-Pesa</option>
                <option value="tigo_pesa">Tigo Pesa</option>
                <option value="airtel_money">Airtel Money</option>
                <option value="halopesa">Halopesa</option>
              </Select>
              <Input
                label="Namba ya Akaunti ya Malipo"
                value={form.payout_account_number}
                onChange={(e) => updatePhone('payout_account_number', e.target.value)}
                placeholder="0712 345 678"
                hint="Mapato yako yatatumwa hapa"
              />
            </>
          )}

          {step === 3 && (
            <div className="space-y-3 text-sm">
              <ReviewRow label="Jina" value={form.full_name} />
              <ReviewRow label="Simu" value={form.phone_number} />
              <ReviewRow label="Kitambulisho" value={form.national_id} />
              <ReviewRow label="Leseni" value={form.driving_license} />
              <ReviewRow label="Pikipiki" value={form.motorcycle_registration} />
              <ReviewRow label="Malipo" value={`${form.payout_method.replace('_', ' ')} — ${form.payout_account_number}`} />
              <p className="text-xs text-ink-500 pt-2">
                Kwa kutuma, unakubali vyeti vyako vitahakikiwa na msimamizi kabla ya kuanza kupokea safari.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          {step > 0 && (
            <Button variant="secondary" onClick={back} disabled={submitting} className="flex-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Rudi
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={next} fullWidth>
              Endelea
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Button>
          ) : (
            <Button onClick={submit} loading={submitting} fullWidth>
              Tuma Maombi
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-ink-100 dark:border-ink-800 pb-2">
      <span className="text-ink-500 dark:text-ink-400">{label}</span>
      <span className="font-medium text-ink-800 dark:text-ink-100 text-right">{value || '—'}</span>
    </div>
  )
}
