import type { Metadata } from 'next'
import { Cormorant_Garamond, Jost } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { siteConfig } from '@/config/site'
import './globals.css'

const display = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-display',
})

const sans = Jost({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: siteConfig.seo.title,
  description: siteConfig.seo.description,
  keywords: siteConfig.seo.keywords,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className={`${display.variable} ${sans.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
