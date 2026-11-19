import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
}

export const metadata: Metadata = {
  title: 'MAG Intelligence',
  description: 'Lead intelligence for Miami Apartment Guy',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MAG',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function MagLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
