import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Miami Apartment Guy',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function MapLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
