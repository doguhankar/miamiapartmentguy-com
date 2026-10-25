import type { Metadata } from 'next'
import Link from 'next/link'
import { SeoShell } from '@/components/seo/seo-shell'
import {
  AGENT_NAME,
  BROKERAGE,
  DEFAULT_OG_IMAGE,
  LICENSE_NUMBER,
  SITE_NAME,
  SITE_URL,
  SMS_HREF,
  absoluteUrl,
  agentJsonLd,
  breadcrumbJsonLd,
  getPublicBuildings,
  groupByNeighborhood,
  serializeJsonLd,
} from '@/lib/seo'

export const revalidate = 3600

const TITLE = `Miami Apartment Locator — Free Apartment Finder | ${SITE_NAME}`
const DESCRIPTION =
  'Miami Apartment Guy is a free Miami apartment locator. A licensed Florida agent compares live pricing and move-in deals across hundreds of buildings and texts you a short list that fits your budget.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/miami-apartment-locator' },
  openGraph: {
    type: 'website',
    url: '/miami-apartment-locator',
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), width: 1200, height: 630, alt: 'A Miami high-rise apartment building' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [absoluteUrl(DEFAULT_OG_IMAGE)] },
}

const FAQS = [
  {
    q: 'What is a Miami apartment locator?',
    a: 'A Miami apartment locator is a licensed real estate professional who finds rentals that match your budget, timeline and must-haves, then handles tours and applications. You skip hours of searching and get quotes straight from the leasing offices.',
  },
  {
    q: 'Does a Miami apartment locator cost anything?',
    a: 'No. Miami Apartment Guy is free for renters. Leasing offices pay the locator fee, so you pay the same rent and the same fees you would pay on your own.',
  },
  {
    q: 'How fast can I get a list of apartments?',
    a: 'Send your budget, move-in date and preferred neighborhoods, and you get a short list by text, usually within the hour during the day.',
  },
  {
    q: 'Which Miami neighborhoods do you cover?',
    a: 'Brickell, Downtown, Edgewater, Wynwood, Midtown, Miami Beach and more across Miami-Dade and Broward. The neighborhood guides below list every building we track.',
  },
  {
    q: 'Can you help if my credit or income is not perfect?',
    a: 'Yes. Each building has different income, credit and guarantor rules. Tell me your situation and I will point you to buildings that are likely to approve you.',
  },
]

export default async function MiamiApartmentLocatorPage() {
  const publicBuildings = await getPublicBuildings()
  const groups = groupByNeighborhood(publicBuildings)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      agentJsonLd(),
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/miami-apartment-locator#page`,
        url: `${SITE_URL}/miami-apartment-locator`,
        name: TITLE,
        description: DESCRIPTION,
        about: { '@id': `${SITE_URL}/#agent` },
        breadcrumb: { '@id': `${SITE_URL}/miami-apartment-locator#breadcrumb` },
      },
      {
        ...breadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Miami apartment locator', path: '/miami-apartment-locator' },
        ]),
        '@id': `${SITE_URL}/miami-apartment-locator#breadcrumb`,
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQS.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  }

  return (
    <SeoShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <div className="mh-wrap">
        <p className="sp-eyebrow">Free for renters</p>
        <h1 className="sp-title">Miami apartment locator: find your apartment for free</h1>
        <p className="sp-answer">
          <strong>Miami Apartment Guy is a free apartment locator in Miami.</strong> {AGENT_NAME}, a licensed Florida real estate agent
          (license #{LICENSE_NUMBER}, {BROKERAGE}), compares live pricing and move-in deals across {publicBuildings.length} apartment
          buildings in {groups.length} neighborhoods and texts you a short list that fits your budget. Renters pay nothing for the service.
        </p>
        <div className="sp-cta">
          <a className="mh-btn mh-btn-pink" href={SMS_HREF}>Text Don now</a>
          <Link className="mh-btn" href="/start">Tell me what you need</Link>
          <Link className="mh-btn" href="/map">Browse the map</Link>
          <Link className="mh-btn" href="/miami-affordability-calculator">Can I afford Miami?</Link>
        </div>

        <section className="sp-section" aria-labelledby="how-it-works">
          <h2 id="how-it-works">How a Miami apartment locator works</h2>
          <ol className="sp-steps">
            <li>
              <h3>Tell me your budget</h3>
              <p>Send your monthly budget, move-in date, apartment size and favorite neighborhoods by text or the quick form.</p>
            </li>
            <li>
              <h3>Get a short list</h3>
              <p>I check live pricing, concessions and approval rules, then send only the buildings that fit.</p>
            </li>
            <li>
              <h3>Tour and apply</h3>
              <p>I book tours, send your guest card and stay with you through the application and lease signing.</p>
            </li>
          </ol>
        </section>

        <section className="sp-section" aria-labelledby="neighborhoods">
          <h2 id="neighborhoods">Miami neighborhoods we cover</h2>
          <ul className="sp-hoods">
            {groups.map((group) => (
              <li key={group.slug}>
                <Link href={`/neighborhoods/${group.slug}`}>
                  {group.name} apartments <small>{group.buildings.length}</small>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="sp-section" aria-labelledby="faq">
          <h2 id="faq">Miami apartment locator questions</h2>
          <div className="sp-faq">
            {FAQS.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </SeoShell>
  )
}
