import type { Metadata } from 'next'

const TITLE = 'Seb — Miami Apartment Locator | Miami Apartment Guy'
const DESCRIPTION = 'Work with Seb, a Miami Apartment Guy locator. Browse live pricing and deals on Miami apartments and get a short list that fits your budget. Free for renters.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/seb' },
  openGraph: {
    type: 'website',
    url: '/seb',
    siteName: 'Miami Apartment Guy',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/og-start.jpg', width: 1200, height: 630, alt: 'A Miami high-rise apartment building' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/og-start.jpg'] },
}

export default function SebLayout({ children }: { children: React.ReactNode }) {
  return children
}
