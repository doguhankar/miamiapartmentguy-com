import type { Metadata } from 'next'
import { StartForm } from '@/components/start/start-form'
import { resolveAgentStart } from '@/lib/agent-start'
import { resolveStartSource } from '@/lib/start-lead'

const TITLE = 'Find your Miami apartment'
const DESCRIPTION = "Tell me what you're looking for. I'll text you a short list that fits."

export const metadata: Metadata = {
  metadataBase: new URL('https://www.miamiapartmentguy.com'),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/start' },
  robots: { index: false, follow: true },
  openGraph: {
    type: 'website',
    url: '/start',
    siteName: 'Miami Apartment Guy',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/og-start.jpg', width: 1200, height: 630, alt: 'A Miami high-rise apartment building' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/og-start.jpg'] },
}

export default async function AgentStartPage({ params, searchParams }: { params: Promise<{ agent: string }>; searchParams: Promise<{ src?: string | string[] }> }) {
  const [{ agent: slug }, { src }] = await Promise.all([params, searchParams])
  const agent = await resolveAgentStart(slug)
  const source = resolveStartSource(Array.isArray(src) ? src[0] : src)

  return (
    <main className="st-main">
      <header className="st-header">
        <span className="st-logo" aria-label="Miami Apartment Guy">
          MAG<span className="st-pink">.</span>
        </span>
      </header>
      <StartForm source={source} agent={agent ?? undefined} />
    </main>
  )
}
