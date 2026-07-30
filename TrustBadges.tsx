import { ShieldCheck, CreditCard, Undo2, Truck, MessageCircleHeart, Star, Headphones } from 'lucide-react'

const TRUST_ITEMS = [
  { icon: ShieldCheck, title: 'Wauzaji Waliothibitishwa', desc: 'Kila duka linapitia uhakiki wa kitambulisho.' },
  { icon: CreditCard, title: 'Malipo Salama', desc: 'M-Pesa, Tigo Pesa, Airtel Money.' },
  { icon: MessageCircleHeart, title: 'Ulinzi wa Mnunuzi', desc: 'Fedha zako zinalindwa hadi upokee agizo.' },
  { icon: Undo2, title: 'Urejeshaji Rahisi', desc: 'Sera wazi ya marejesho na kubadilisha.' },
  { icon: Truck, title: 'Usafirishaji wa Haraka', desc: 'Ufuatiliaji wa moja kwa moja kote Zanzibar.' },
  { icon: Star, title: 'Maoni Halisi', desc: 'Tathmini kutoka kwa wateja walionunua kweli.' },
  { icon: Headphones, title: 'Msaada kwa Wateja', desc: 'Tupo tayari kukusaidia Kiswahili na Kiingereza.' },
]

export default function TrustBadges() {
  return (
    <section className="py-8 bg-white dark:bg-ink-950 border-y border-ink-100 dark:border-ink-800">
      <div className="page-container">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {TRUST_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="flex flex-col items-center text-center gap-2">
                <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-900/40 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-brand-600 dark:text-brand-300" />
                </div>
                <p className="text-xs font-semibold text-ink-800 dark:text-ink-100 leading-tight">{item.title}</p>
                <p className="text-[11px] text-ink-500 dark:text-ink-400 leading-snug hidden sm:block">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
