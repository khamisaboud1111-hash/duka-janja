import Image from 'next/image'

interface Place {
  name: string
  src: string
  desc: string
}

const PLACES: Place[] = [
  {
    name: 'Mji Mkongwe (Stone Town)',
    src: 'https://images.unsplash.com/photo-1688904524620-527b42849240?q=80&w=1200&auto=format&fit=crop',
    desc: 'Urithi wa Dunia wa UNESCO, mitaa ya kale na milango ya kihistoria.',
  },
  {
    name: 'Nyumba ya Maajabu',
    src: 'https://images.unsplash.com/photo-1678042956696-e072ff82cff5?q=80&w=1200&auto=format&fit=crop',
    desc: 'Jengo maarufu lililokuwa la kwanza kuwa na umeme Afrika Mashariki.',
  },
  {
    name: 'Bustani ya Forodhani',
    src: 'https://images.unsplash.com/photo-1676480162770-ef5a83baba3b?q=80&w=1200&auto=format&fit=crop',
    desc: 'Soko la jioni la chakula maarufu kando ya bahari Mji Mkongwe.',
  },
  {
    name: 'Ngome Kongwe (Old Fort)',
    src: '/images/zanzibar/old-fort.jpg',
    desc: 'Ngome ya kihistoria ya Kiarabu iliyojengwa karne ya 17.',
  },
  {
    name: 'Msitu wa Jozani',
    src: 'https://images.unsplash.com/photo-1679079998628-5f4677f474a1?q=80&w=1200&auto=format&fit=crop',
    desc: 'Nyumbani kwa Red Colobus, tumbili wa kipekee wa Zanzibar.',
  },
]

export default function ZanzibarDiscovery() {
  return (
    <section className="section dark:bg-ink-950">
      <div className="page-container">
        <div className="text-center max-w-xl mx-auto mb-8">
          <p className="text-brand-600 dark:text-brand-300 text-xs font-bold uppercase tracking-widest mb-2">
            Fahari ya Zanzibar
          </p>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-ink-900 dark:text-white">
            Kununua Kunakuunganisha na Utamaduni Wetu
          </h2>
          <p className="text-sm text-ink-500 dark:text-ink-300 mt-1">
            Duka Janja ni soko la Wazanzibari, kwa Wazanzibari.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {PLACES.map((place, i) => (
            <div
              key={place.name}
              className={`relative rounded-2xl overflow-hidden group ${i === 0 ? 'col-span-2 row-span-2 aspect-square sm:aspect-auto' : 'aspect-square'}`}
            >
              <Image
                src={place.src}
                alt={place.name}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 p-3">
                <p className="text-white font-bold text-sm leading-tight">{place.name}</p>
                <p className="text-white/80 text-[11px] leading-snug hidden sm:block mt-0.5">{place.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
