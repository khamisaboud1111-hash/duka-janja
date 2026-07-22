import type { Metadata, Viewport } from 'next'
import PullToRefreshIndicator from '@/components/layout/PullToRefreshIndicator'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import ThemeScript from '@/components/layout/ThemeScript'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

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
    default: 'Duka Janja - Soko la Zanzibar',
    template: '%s | Duka Janja',
  },
  description: 'Zanzibar\'s premier online marketplace. Buy and sell products locally across Zanzibar and Tanzania.',
  keywords: ['zanzibar', 'marketplace', 'duka', 'shopping', 'tanzania', 'mpesa', 'ecommerce'],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Duka Janja - Zanzibar Marketplace',
    description: 'Buy and sell products across Zanzibar and Tanzania.',
    url: 'https://dukajanja.com',
    siteName: 'Duka Janja',
    locale: 'en_TZ',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Duka Janja',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Duka Janja',
    description: 'Zanzibar Marketplace',
    images: ['/og-image.png'],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Duka Janja',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className={`${inter.variable} min-h-screen bg-white text-ink-900 antialiased`}>
        <PullToRefreshIndicator />
        {children}
        <Toaster 
          position="top-center"
          gutter={10}
          reverseOrder={false}
          toastOptions={{
            duration: 3500,
            success: {
              duration: 2500,
            },
            error: {
              duration: 5000,
            },
            style: { 
              borderRadius: '14px',
              padding: '14px 18px',
              fontWeight: 500,
            },
          }}
        />
      </body>
    </html>
  )
}
