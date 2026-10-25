import type { Metadata } from 'next'
import { StartForm, type StartPrefill } from '@/components/start/start-form'
import { START_BEDS, START_NEIGHBORHOODS, resolveStartSource } from '@/lib/start-lead'

const TITLE = 'Find your Miami apartment'
const DESCRIPTION = "Tell me what you're looking for. I'll text you a short list that fits."

export const metadata: Metadata = {
  metadataBase: new URL('https://www.miamiapartmentguy.com'),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/start' },
  openGraph: {
    type: 'website',
    url: '/start',
    siteName: 'Miami Apartment Guy',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/og-start.jpg', width: 1200, height: 630, alt: 'A Miami high-rise apartment building' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: ['/og-start.jpg'],
  },
}

type Param = string | string[] | undefined

const first = (value: Param) => (Array.isArray(value) ? value[0] : value)

function buildPrefill(params: Record<string, Param>): StartPrefill | undefined {
  const prefill: StartPrefill = {}
  const notes: string[] = []

  const beds = first(params.beds)
  if (beds && (START_BEDS as readonly string[]).includes(beds)) prefill.beds = beds

  const budget = first(params.budget)
  if (budget && /^\d{1,7}$/.test(budget) && Number(budget) > 0) prefill.budget = budget

  const requested = (first(params.neighborhoods) ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 18)
  const supported = requested.filter((name) => (START_NEIGHBORHOODS as readonly string[]).includes(name))
  const unsupported = requested.filter((name) => !supported.includes(name))
  if (supported.length) prefill.neighborhood = supported[0]
  const extra = [...supported.slice(1), ...unsupported]
  if (extra.length) notes.push(`Also interested in: ${extra.join(', ')}.`)

  const movingFrom = first(params.moving_from)?.trim().slice(0, 60)
  if (movingFrom && /^[\p{L}\p{N} ,().'-]+$/u.test(movingFrom)) notes.push(`Moving from ${movingFrom}.`)

  if (notes.length) prefill.notes = notes.join(' ')
  return Object.keys(prefill).length ? prefill : undefined
}

export default async function StartPage({ searchParams }: { searchParams: Promise<Record<string, Param>> }) {
  const params = await searchParams
  const source = resolveStartSource(first(params.src))
  const prefill = buildPrefill(params)

  return (
    <main className="st-main">
      <header className="st-header">
        <span className="st-logo" aria-label="Miami Apartment Guy">
          MAG<span className="st-pink">.</span>
        </span>
      </header>
      <StartForm source={source} prefill={prefill} />
    </main>
  )
}
