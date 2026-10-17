import type { Metadata, Viewport } from 'next'
import { Gabarito, Inter } from 'next/font/google'
import './home.css'

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

export const metadata: Metadata = {
  title: 'Miami Apartment Guy — Miami apartments, the right way',
  description:
    'Real prices, real deals, real locator. See this week\'s Miami apartment deals and the true monthly cost of 131 tracked buildings. Free for renters.',
  icons: {
    icon: '/favicon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#fbfbfd',
  colorScheme: 'light',
}

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className={`mh-root ${gabarito.variable} ${inter.variable}`}>{children}</div>
}
