import type { Metadata } from 'next'
import Link from 'next/link'
import { buildings } from '@/lib/buildings'
import { groupByNeighborhood } from '@/lib/seo-shared'

// Dynamic rendering required for useSearchParams and useRouter
export const dynamic = 'force-dynamic'

const TITLE = 'Miami Apartment Map — Live Prices & Deals on Every Building | Miami Apartment Guy'
const DESCRIPTION =
  'Browse Miami apartments on an interactive map. Filter by neighborhood, bedrooms and budget, and compare live pricing and move-in deals on every building. Free locator help.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/map' },
  openGraph: {
    type: 'website',
    url: '/map',
    siteName: 'Miami Apartment Guy',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/og-start.jpg', width: 1200, height: 630, alt: 'A Miami high-rise apartment building' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/og-start.jpg'] },
  icons: {
    icon: '/favicon.svg',
  },
}

const groups = groupByNeighborhood(buildings)

export default function MapLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <h1 className="sr-only">Miami apartment map with live prices and deals</h1>
      {children}
      <nav className="sr-only" aria-label="Miami neighborhoods">
        <h2>Miami apartments by neighborhood</h2>
        <ul>
          {groups.map((group) => (
            <li key={group.slug}>
              <Link href={`/neighborhoods/${group.slug}`}>{group.name} apartments</Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}
