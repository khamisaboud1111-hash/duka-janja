import Link from 'next/link'
import { ClipboardCheck, PackageCheck, Bike, Navigation, CheckCircle2 } from 'lucide-react'

const STEPS = [
  { icon: ClipboardCheck, title: 'Mteja Anaweka Agizo', desc: 'Chagua bidhaa, lipa kwa M-Pesa, Tigo Pesa au Airtel Money.' },
  { icon: PackageCheck, title: 'Muuzaji Anaandaa Agizo', desc: 'Duka linathibitisha na kufunga bidhaa zako.' },
  { icon: Bike, title: 'Dereva Anachukua Agizo', desc: 'Rider wa eneo lako anapokea agizo na kuanza safari.' },
  { icon: Navigation, title: 'Ufuatiliaji wa Moja kwa Moja (GPS)', desc: 'Fuatilia agizo lako moja kwa moja kwenye ramani.' },
  { icon: CheckCircle2, title: 'Imefikishwa', desc: 'Agizo linafika nyumbani kwako salama.' },
]

export default function DeliveryProcess() {
  return (
    <section className="section bg-ink-50/50 dark:bg-ink-900/40">
      <div className="page-container">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="font-display font-bold text-xl sm:text-2xl text-ink-900 dark:text-white">Jinsi Usafirishaji Unavyofanya Kazi</h2>
          <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">
            Ufuatiliaji wa moja kwa moja kwa GPS — kutoka duka hadi mlangoni kwako.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-ink-900 border border-ink-100 dark:border-ink-800 shadow-card flex items-center justify-center mb-3">
                  <Icon className="w-6 h-6 text-brand-500" />
                </div>
                <p className="text-xs font-bold text-ink-400 mb-1">Hatua {i + 1}</p>
                <p className="text-sm font-semibold text-ink-900 dark:text-white leading-tight mb-1">{step.title}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400 leading-snug">{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <span className="hidden sm:block absolute top-7 left-[calc(100%-0.5rem)] w-full h-px bg-ink-200 dark:bg-ink-700" />
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-8 text-center">
          <Link href="/orders" className="text-sm font-semibold text-brand-600 dark:text-brand-300">
            Fuatilia agizo lako moja kwa moja →
          </Link>
        </div>
      </div>
    </section>
  )
}
