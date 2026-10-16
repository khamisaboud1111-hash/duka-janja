import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator'
import { Inter, Poppins } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { cookies } from 'next/headers'
import { getSiteOrigin } from '@/lib/site'
import { GlobalErrorBoundary } from '@/components/shared/GlobalErrorBoundary'
import GlobalErrorHandler from '@/components/shared/GlobalErrorHandler'
import { QueryProvider } from '@/lib/query/provider'
import { StoresProvider } from '@/store'
import { ClientInitializer } from '@/components/shared/ClientInitializer'
import PWAinitializer from '@/components/layout/PWAinitializer'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1da8ab' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  applicationName: 'Duka Janja',
  authors: [{ name: 'Duka Janja Team' }],
  creator: 'Duka Janja',
  publisher: 'Duka Janja',
  robots: {
    index: true,
    follow: true,
  },
  category: 'Shopping',
  alternates: {
    canonical: '/',
  },
  title: {
    default: 'Duka Janja - Soko Kuu la Mtandaoni Zanzibar na Tanzania',
    template: '%s | Duka Janja',
  },
  description: 'Nunua na uuze bidhaa za mtandaoni kama vifaa vya umeme, mitindo, vyakula, samani na bidhaa za urembo kote Zanzibar na Tanzania kwa malipo salama na usafirishaji wa haraka.',
  openGraph: {
    title: 'Duka Janja - Soko Kuu la Mtandaoni Zanzibar na Tanzania',
    description: 'Buy electronics, fashion, groceries, furniture, beauty products and more across Zanzibar and Tanzania with secure payments and fast delivery.',
    url: getSiteOrigin(),
    siteName: 'Duka Janja',
    locale: 'sw_TZ',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Duka Janja Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Duka Janja - Zanzibar Marketplace',
    description: 'Soko la kuaminika Zanzibar na Tanzania.',
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Duka Janja',
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  const langCookie = cookies().get('lang')?.value
  const ssrLang = langCookie === 'ar' || langCookie === 'en' || langCookie === 'fr' ? langCookie : 'sw'
  const ssrDir = ssrLang === 'ar' ? 'rtl' : 'ltr'

  // Read theme from cookie for SSR to avoid hydration mismatch
  const themeCookie = cookies().get('theme')?.value
  const ssrTheme = themeCookie === 'dark' ? 'dark' : 'light'
  const ssrThemeClass = ssrTheme === 'dark' ? 'dark' : ''

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Duka Janja",
    "url": getSiteOrigin(),
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${getSiteOrigin()}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang={ssrLang} dir={ssrDir} className={ssrThemeClass}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} ${poppins.variable} min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary`}>
        <GlobalErrorBoundary>
          <main id="main-content">
            {children}
          </main>
        </GlobalErrorBoundary>
      </body>
    </html>
  )
}
