import type { Metadata } from 'next'

// Dynamic rendering required for useSearchParams and useRouter
export const dynamic = 'force-dynamic'

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
