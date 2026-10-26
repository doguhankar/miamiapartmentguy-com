import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | Miami Apartment Guy',
  description: 'Guides, insights, and tips for renting apartments in Miami. From noise checks to rent comparisons.',
  openGraph: {
    title: 'Miami Apartment Guy Blog',
    description: 'Guides, insights, and tips for renting apartments in Miami.',
    type: 'website',
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  )
}
