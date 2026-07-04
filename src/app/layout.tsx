import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import ThemeScript from '@/components/layout/ThemeScript'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1da8ab',
}

export const metadata: Metadata = {
  title: 'Duka Janja — Soko la Zanzibar',
  description: 'Zanzibar\'s premier online marketplace. Buy and sell locally with M-Pesa, Tigo Pesa, and Airtel Money.',
  keywords: ['zanzibar', 'marketplace', 'duka', 'shopping', 'tanzania', 'mpesa'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Duka Janja',
  },
  openGraph: {
    title: 'Duka Janja',
    description: 'Zanzibar\'s premier online marketplace',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sw" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
     <body className={`${inter.variable} font-sans antialiased bg-white text-ink-900 dark:bg-ink-950 dark:text-ink-50`}>
        <PullToRefreshIndicator />
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: 500,
            },
          }}
        />
      </body>
    </html>
  )
}
