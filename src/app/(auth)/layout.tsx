import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-white dark:bg-ink-950">
      {/* Left — visual panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image
          src="/images/zanzibar/stone-town-aerial.jpg"
          alt="Stone Town, Zanzibar"
          fill
          priority
          className="object-cover"
        />
        {/* Gradient wash so text stays readable over the photo */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/30 to-brand-900/20" />

        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <Link href="/" className="inline-flex items-center gap-2 w-fit">
            <div className="w-9 h-9 bg-white/95 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-brand-600 font-black text-sm">DJ</span>
            </div>
            <span className="font-display font-black text-white text-xl">Duka Janja</span>
          </Link>

          <div className="max-w-md">
            <p className="text-brand-200 font-semibold text-sm tracking-wide uppercase mb-3">
              Soko la Zanzibar
            </p>
            <h2 className="font-display font-black text-3xl xl:text-4xl text-white leading-tight mb-4">
              Shop smart. Support local sellers across Zanzibar.
            </h2>
            <p className="text-ink-100/80 text-sm leading-relaxed">
              Thousands of authentic products, fast boda-boda delivery, and secure local payments — all in one marketplace.
            </p>
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex-1 flex flex-col">
        <header className="p-5 sm:p-6 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">DJ</span>
            </div>
            <span className="font-display font-black text-brand-700 dark:text-brand-300 text-xl">Duka Janja</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
          {children}
        </main>

        <footer className="p-4 text-center text-xs text-ink-400">
          © 2026 Duka Janja · Zanzibar, Tanzania
        </footer>
      </div>
    </div>
  )
}
