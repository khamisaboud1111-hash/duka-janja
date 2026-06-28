'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Bike, ChevronLeft, ChevronRight, User, FileText, Wallet, CheckCircle2 } from 'lucide-react'
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
  { key: 'personal', label: 'Taarifa Binafsi', icon: User },
  { key: 'documents', label: 'Vyeti', icon: FileText },
  { key: 'payout', label: 'Malipo', icon: Wallet },
  { key: 'review', label: 'Hakiki', icon: CheckCircle2 },
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

  function validateStep(): string | null {
    if (step === 0) {
      if (form.full_name.trim().length < 3) return 'Jina kamili linahitajika'
      if (!/^(\+?255|0)[67]\d{8}$/.test(form.phone_number.trim())) return 'Namba ya simu si sahihi'
      if (!/^(\+?255|0)[67]\d{8}$/.test(form.emergency_contact.trim())) return 'Namba ya dharura si sahihi'
    }
    if (step === 1) {
      if (form.national_id.trim().length < 5) return 'Namba ya kitambulisho inahitajika'
      if (form.driving_license.trim().length < 3) return 'Namba ya leseni inahitajika'
      if (form.motorcycle_registration.trim().length < 3) return 'Namba ya usajili wa pikipiki inahitajika'
      if (!form.selfie_url) return 'Picha ya selfie inahitajika'
      if (!form.license_scan_url) return 'Picha ya leseni inahitajika'
    }
    if (step === 2) {
      if (!/^(\+?255|0)[67]\d{8}$/.test(form.payout_account_number.trim())) return 'Namba ya akaunti ya malipo si sahihi'
    }
    return null
  }

  function next() {
    const err = validateStep()
    if (err) { toast.error(err); return }
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
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
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

  const StepIcon = STEPS[step].icon

  return (
    <div className="page-container py-8 sm:py-12 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center">
          <Bike className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-ink-900">Jiunge kama Dereva</h1>
          <p className="text-sm text-ink-500">Pata kipato kwa kusafirisha bidhaa Zanzibar</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 my-6">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-400'
              }`}
            >
              {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 ${i < step ? 'bg-emerald-500' : 'bg-ink-100'}`} />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-500 font-semibold uppercase tracking-wide mb-4 flex items-center gap-1.5">
        <StepIcon className="w-3.5 h-3.5" /> {STEPS[step].label}
      </p>

      <div className="card p-5 sm:p-6 space-y-4">
        {step === 0 && (
          <>
            <Input label="Jina Kamili" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} placeholder="Mfano: Juma Hassan Ali" />
            <Input label="Namba ya Simu" value={form.phone_number} onChange={(e) => update('phone_number', e.target.value)} placeholder="0712 345 678" />
            <Input label="Namba ya Dharura" value={form.emergency_contact} onChange={(e) => update('emergency_contact', e.target.value)} placeholder="Namba ya jamaa/rafiki" hint="Tutawasiliana naye tu wakati wa dharura" />
          </>
        )}

        {step === 1 && (
          <>
            <Input label="Namba ya Kitambulisho cha Taifa/Zanzibar" value={form.national_id} onChange={(e) => update('national_id', e.target.value)} />
            <Input label="Namba ya Leseni ya Udereva" value={form.driving_license} onChange={(e) => update('driving_license', e.target.value)} />
            <Input label="Namba ya Usajili wa Pikipiki" value={form.motorcycle_registration} onChange={(e) => update('motorcycle_registration', e.target.value)} placeholder="Mfano: T123 ABC" />
            <div className="grid grid-cols-2 gap-3 pt-2">
              <RiderDocumentUploader
                userId={profile.id}
                docType="selfie"
                value={form.selfie_url}
                onChange={(path) => update('selfie_url', path)}
                label="Picha ya Selfie"
              />
              <RiderDocumentUploader
                userId={profile.id}
                docType="license"
                value={form.license_scan_url}
                onChange={(path) => update('license_scan_url', path)}
                label="Picha ya Leseni"
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Select label="Njia ya Malipo" value={form.payout_method} onChange={(e) => update('payout_method', e.target.value as FormState['payout_method'])}>
              <option value="mpesa">M-Pesa</option>
              <option value="tigo_pesa">Tigo Pesa</option>
              <option value="airtel_money">Airtel Money</option>
              <option value="halopesa">Halopesa</option>
            </Select>
            <Input label="Namba ya Akaunti ya Malipo" value={form.payout_account_number} onChange={(e) => update('payout_account_number', e.target.value)} placeholder="0712 345 678" hint="Mapato yako yatatumwa hapa" />
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

      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <Button variant="secondary" onClick={back} disabled={submitting}>
            <ChevronLeft className="w-4 h-4" /> Rudi
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button onClick={next} fullWidth>
            Endelea <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={submit} loading={submitting} fullWidth>
            Tuma Maombi
          </Button>
        )}
      </div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-ink-100 pb-2">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-800 text-right">{value || '—'}</span>
    </div>
  )
}
