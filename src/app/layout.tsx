import type { Metadata, Viewport } from 'next'
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import ThemeScript from '@/components/layout/ThemeScript'
import PWAInitializer from '../components/layout/PWAInitializer';
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1da8ab' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL('https://dukajanja.com'),
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
    url: 'https://dukajanja.com',
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
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Duka Janja",
    "url": "https://dukajanja.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://dukajanja.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <html lang="sw" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} min-h-screen bg-white text-ink-900 antialiased selection:bg-primary/20 selection:text-primary`}>
        {/* Accessibility Skip Link */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:font-semibold focus:rounded-lg focus:shadow-lg"
        >
          Rukia kwenye maudhui makuu (Skip to content)
        </a>

        <PWAInitializer />
        <PullToRefreshIndicator />

        {/* Semantic main container wrapper */}
        <main id="main-content">
          {children}
        </main>

        <Toaster 
          position="top-center"
          gutter={10}
          reverseOrder={false}
          toastOptions={{
            duration: 3500,
            success: {
              duration: 2500,
              style: { background: '#ecfdf5', color: '#065f46', border: '1px solid #10b981' }
            },
            error: {
              duration: 5000,
              style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #ef4444' }
            },
            style: { 
              borderRadius: '14px',
              padding: '14px 18px',
              fontWeight: 500,
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            },
          }}
        />
      </body>
    </html>
  )
}
