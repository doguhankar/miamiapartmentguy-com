import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Miami Apartment Guy',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
