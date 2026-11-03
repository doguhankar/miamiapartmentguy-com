import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SeoShell } from '@/components/seo/seo-shell'
import { buildings } from '@/lib/buildings'
import { buildingAlt } from '@/lib/building-alt'
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  SMS_HREF,
  absoluteUrl,
  breadcrumbJsonLd,
  formatPrice,
  getLivePricingMap,
  getPublicBuildings,
  groupByNeighborhood,
  realConcession,
  serializeJsonLd,
  summarizePrice,
  truncate,
} from '@/lib/seo'
import { getNeighborhoodContent } from '@/lib/neighborhood-content'

export const revalidate = 3600

type PageProps = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return groupByNeighborhood(buildings).map((group) => ({ slug: group.slug }))
}

async function loadNeighborhood(slug: string) {
  const [publicBuildings, pricing] = await Promise.all([getPublicBuildings(), getLivePricingMap()])
  const groups = groupByNeighborhood(publicBuildings)
  const group = groups.find((item) => item.slug === slug)
  if (!group) return null
  const items = group.buildings
    .map((building) => ({ building, price: summarizePrice(building, pricing.get(building.id)) }))
    .sort((a, b) => a.building.name.localeCompare(b.building.name))
  const prices = items.map((item) => item.price.min).filter((value) => value > 0)
  return {
    group,
    items,
    others: groups.filter((item) => item.slug !== slug),
    lowest: prices.length ? Math.min(...prices) : null,
    highest: prices.length ? Math.max(...items.map((item) => item.price.max ?? item.price.min)) : null,
    dealCount: items.filter((item) => realConcession(item.building)).length,
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const data = await loadNeighborhood(slug)
  if (!data) return { title: 'Neighborhood not found', robots: { index: false, follow: false } }

  const { group, items, lowest } = data
  const content = getNeighborhoodContent(group.slug)
  const buildingWord = items.length === 1 ? 'Building' : 'Buildings'
  // Matches the real query shape ("apartments in north miami") and stays under ~60 chars for most names.
  const title = `Apartments for Rent in ${group.name}, Miami FL | ${items.length} ${buildingWord} & Deals`
  const priceText = lowest ? ` from ${formatPrice(lowest)}/mo` : ''
  const description = truncate(
    content
      ? `${group.name} apartments for rent${priceText}: ${content.hook}. Live pricing, deals & free help from a Miami realtor.`
      : `Compare ${items.length} ${group.name} apartment ${buildingWord.toLowerCase()}${priceText}. Live pricing, deals & free help from a Miami realtor.`,
    160,
  )
  const path = `/neighborhoods/${group.slug}`
  const image = items.find((item) => item.building.images[0])?.building.images[0] ?? DEFAULT_OG_IMAGE

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      url: path,
      siteName: SITE_NAME,
      title,
      description,
      images: [{ url: absoluteUrl(image), alt: `${group.name} apartments in Miami` }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [absoluteUrl(image)] },
  }
}

export default async function NeighborhoodPage({ params }: PageProps) {
  const { slug } = await params
  const data = await loadNeighborhood(slug)
  if (!data) notFound()
  const { group, items, others, lowest, highest, dealCount } = data
  const path = `/neighborhoods/${group.slug}`
  const content = getNeighborhoodContent(group.slug)

  const faqJsonLd = content
    ? [
        {
          '@type': 'FAQPage',
          '@id': `${SITE_URL}${path}#faq`,
          mainEntity: content.faqs.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: { '@type': 'Answer', text: item.a },
          })),
        },
      ]
    : []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}${path}#page`,
        url: `${SITE_URL}${path}`,
        name: `${group.name} apartments in Miami`,
        about: { '@type': 'AdministrativeArea', name: `${group.name}, Miami, FL` },
        isPartOf: { '@id': `${SITE_URL}/#agent` },
        mainEntity: { '@id': `${SITE_URL}${path}#list` },
      },
      {
        '@type': 'ItemList',
        '@id': `${SITE_URL}${path}#list`,
        numberOfItems: items.length,
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: absoluteUrl(`/buildings/${item.building.id}`),
          name: item.building.name,
        })),
      },
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: `${group.name} apartments`, path },
      ]),
      ...faqJsonLd,
    ],
  }

  return (
    <SeoShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <div className="mh-wrap">
        <nav className="sp-crumbs" aria-label="Breadcrumb">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li aria-current="page">{group.name} apartments</li>
          </ol>
        </nav>

        <p className="sp-eyebrow">Miami neighborhood guide</p>
        <h1 className="sp-title">Apartments for rent in {group.name}, Miami</h1>
        <p className="sp-answer">
          There {items.length === 1 ? 'is' : 'are'} <strong>{items.length} apartment {items.length === 1 ? 'building' : 'buildings'}</strong> tracked in {group.name}
          {lowest && highest ? <>, with rents from <strong>{formatPrice(lowest)}</strong> up to {formatPrice(highest)} a month</> : null}.
          {dealCount > 0 ? <> {dealCount} currently advertise a move-in deal.</> : null} Pricing updates as leasing offices change it, and
          help from Miami Apartment Guy, a free Miami apartment finder, costs renters nothing.
        </p>
        {content?.placedRenters && (
          <p className="sp-answer">
            <strong>We have placed renters in the {group.name} buildings on this page</strong>, so we know the leasing teams, the real fees
            and which deals are worth taking.
          </p>
        )}
        <div className="sp-cta">
          <a className="mh-btn mh-btn-pink" href={SMS_HREF}>Text Don your budget</a>
          <Link className="mh-btn" href="/map">Browse the map</Link>
        </div>

        {content && (
          <section className="sp-section" aria-labelledby="hood-guide">
            <h2 id="hood-guide">Living in {group.name}</h2>
            {content.intro.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="sp-prose">{paragraph}</p>
            ))}
            <ul className="sp-highlights">
              {content.highlights.map((item) => (
                <li key={item.label}>
                  <strong>{item.label}:</strong> {item.text}
                </li>
              ))}
            </ul>
            <p className="sp-prose">
              <strong>Best for:</strong> {content.goodFor}
            </p>
          </section>
        )}

        <section className="sp-section" aria-labelledby="hood-buildings">
          <h2 id="hood-buildings">{group.name} apartment buildings</h2>
          <ul className="sp-grid">
            {items.map(({ building, price }, index) => {
              const deal = realConcession(building)
              return (
                <li key={building.id}>
                  <Link href={`/buildings/${building.id}`} className="sp-card">
                    <div className="sp-card-img">
                      {building.images[0] && (
                        <img
                          src={building.images[0]}
                          alt={buildingAlt(building.name, building.neighborhood)}
                          width={640}
                          height={480}
                          loading={index < 2 ? 'eager' : 'lazy'}
                          decoding="async"
                        />
                      )}
                    </div>
                    <div className="sp-card-body">
                      <h3 className="sp-card-name">{building.name}</h3>
                      <p className="sp-card-meta">{building.address}</p>
                      <p className="sp-card-price">{price.min > 0 ? `From ${formatPrice(price.min)}/mo` : 'Call for pricing'}</p>
                      {building.units.length > 0 && <p className="sp-card-meta">{building.units.join(' · ')}</p>}
                      {deal && <p className="sp-card-deal">{deal}</p>}
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>

        {content && (
          <section className="sp-section" aria-labelledby="hood-faq">
            <h2 id="hood-faq">{group.name} apartment questions</h2>
            <div className="sp-faq">
              {content.faqs.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
            <p className="sp-prose">
              Want a short list?{' '}
              <Link href="/miami-apartment-locator">See how our free Miami apartment locator service works</Link> or{' '}
              <a href={SMS_HREF}>text Don your budget and move-in date</a>.
            </p>
          </section>
        )}

        <section className="sp-section" aria-labelledby="other-hoods">
          <h2 id="other-hoods">Other Miami neighborhoods</h2>
          <ul className="sp-hoods">
            {others.map((other) => (
              <li key={other.slug}>
                <Link href={`/neighborhoods/${other.slug}`}>
                  {other.name} <small>{other.buildings.length}</small>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </SeoShell>
  )
}
