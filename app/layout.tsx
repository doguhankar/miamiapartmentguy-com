import type { Metadata } from 'next'
import { Archivo, Space_Grotesk } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export const metadata: Metadata = {
  title: 'Miami Apartment Guy — Every Building. Every Deal. One Text.',
  description: 'Free apartment locating across Greater Miami. Live pricing on 108+ buildings from Brickell to Edgewater. Text your budget, get real quotes same day.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${spaceGrotesk.variable}`} style={{ background: '#0B1220' }}>
      <body className="antialiased" style={{ fontFamily: 'var(--font-space-grotesk,"Space Grotesk",sans-serif)', background: '#0B1220', color: '#F6F8F9', overflowX: 'hidden' }}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
