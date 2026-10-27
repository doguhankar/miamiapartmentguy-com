import type { Metadata } from 'next'
import { Gabarito, Inter, JetBrains_Mono } from 'next/font/google'
import Link from 'next/link'
import './blog.css'

const gabarito = Gabarito({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-gabarito',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Renter Guides | Miami Apartment Guy',
  description: 'Practical Miami apartment guides — noise, neighborhoods, costs, and buildings. Real advice, no fluff.',
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    url: '/blog',
    siteName: 'Miami Apartment Guy',
    title: 'Renter Guides | Miami Apartment Guy',
    description: 'Practical Miami apartment guides — noise, neighborhoods, costs, and buildings.',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`mb-root ${gabarito.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <nav className="mb-nav">
        <div className="mb-wrap mb-nav-in">
          <Link href="/" className="mb-logo">
            MAG<span className="mb-pink">.</span>
          </Link>
          <div className="mb-nav-links">
            <Link href="/">Search</Link>
            <Link href="/map">Map</Link>
            <a href="sms:+14077657306" className="mb-btn mb-btn-pink">Text Don →</a>
          </div>
        </div>
      </nav>

      {children}

      <footer className="mb-footer">
        <div className="mb-wrap mb-footer-in">
          Don Karahan · FL License #SL3581300 · Casa Locators / 305 International Realty · Miami-Dade &amp; Broward
        </div>
      </footer>
    </div>
  )
}
