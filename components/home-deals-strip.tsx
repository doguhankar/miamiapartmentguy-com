'use client'

import Link from 'next/link'
import useSWR from 'swr'
import type { DealListing } from '@/app/api/building-deals/route'

const MAX_DEALS = 8
const SKY_CLASSES = ['mh-sky-c', 'mh-sky-a', 'mh-sky-e', 'mh-sky-b', 'mh-sky-d']

const fetchDeals = async (url: string): Promise<DealListing[]> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to load deals')
  const json = await res.json()
  return Array.isArray(json.items) ? json.items : []
}

const formatPrice = (value: number) => `$${Math.round(value).toLocaleString('en-US')}`

export function HomeDealsStrip() {
  const { data, error, isLoading } = useSWR('/api/building-deals', fetchDeals, {
    revalidateOnFocus: false,
  })

  const deals = (data ?? []).slice(0, MAX_DEALS)

  if (!isLoading && (error || deals.length === 0)) return null

  return (
    <section className="mh-section" aria-labelledby="mh-deals-title">
      <div className="mh-wrap">
        <div className="mh-shead">
          <h2 id="mh-deals-title">{"\u{1F525} This week's deals in Miami"}</h2>
          <Link href="/map?deals=1" className="mh-more">
            See all deals &rarr;
          </Link>
        </div>

        <ul className="mh-rail" aria-busy={isLoading} tabIndex={0} aria-label="This week's deals">
          {isLoading &&
            Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="mh-deal mh-skel" aria-hidden="true">
                <div className="mh-deal-img" />
                <div className="mh-deal-body">
                  <div className="mh-skel-line" style={{ width: '70%' }} />
                  <div className="mh-skel-line" style={{ width: '40%' }} />
                  <div className="mh-skel-line" style={{ width: '55%' }} />
                </div>
              </li>
            ))}

          {deals.map((deal, i) => (
            <li key={deal.buildingId} style={{ display: 'contents' }}>
              <Link href={`/buildings/${deal.buildingId}`} className="mh-deal">
                <div className={`mh-deal-img ${SKY_CLASSES[i % SKY_CLASSES.length]}`}>
                  {deal.imageUrl && (
                    <img
                      src={deal.imageUrl}
                      alt={`${deal.name} exterior`}
                      loading={i < 3 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  )}
                  {deal.badgeLabel && <span className="mh-deal-pill">{deal.badgeLabel}</span>}
                </div>
                <div className="mh-deal-body">
                  <div className="mh-deal-name">{deal.name}</div>
                  {deal.neighborhood && <div className="mh-deal-hood">{deal.neighborhood}</div>}
                  {deal.startingPrice !== null && (
                    <div className="mh-deal-price">
                      <b>{formatPrice(deal.startingPrice)}</b> <span>/mo starting</span>
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
