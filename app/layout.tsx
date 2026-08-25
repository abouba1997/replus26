import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Sora, Source_Sans_3 } from 'next/font/google'
import { AppProviders } from '@/components/app-providers'
import { siteUrl } from '@/lib/env'
import './globals.css'

const display = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700', '800'],
})

const body = Source_Sans_3({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: 'RE+ Mali — Délégation 2026',
  description:
    'Candidature à la délégation malienne pour RE+ 2026, Las Vegas Convention Center, 16–19 novembre. Organisée par l’Ambassade des États-Unis à Bamako et AmCham Mali.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/brand/replus-mali-icon.png', type: 'image/png' },
    ],
    apple: '/brand/replus-mali-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f5ef' },
    { media: '(prefers-color-scheme: dark)', color: '#071523' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased">
        <AppProviders>
          {children}
          {process.env.NODE_ENV === 'production' && <Analytics />}
        </AppProviders>
      </body>
    </html>
  )
}
