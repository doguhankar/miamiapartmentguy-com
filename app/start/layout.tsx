import type { Viewport } from 'next'
import { Gabarito, Inter } from 'next/font/google'
import './start.css'

const gabarito = Gabarito({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-gabarito', display: 'swap' })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter', display: 'swap' })

export const viewport: Viewport = {
  themeColor: '#fbfbfd',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
}

export default function StartLayout({ children }: { children: React.ReactNode }) {
  return <div className={`st-root ${gabarito.variable} ${inter.variable}`}>{children}</div>
}
