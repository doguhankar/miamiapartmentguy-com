'use client'

import Link from 'next/link'
import Image from 'next/image'
import useSWR from 'swr'

interface SimilarBuilding {
  id: string
  name: string
  neighborhood: string
  address: string | null
  priceMin: number
  priceMax: number | null
  image: string | null
}

const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then((response) => response.json())
const money = (value: number) => value ? `$${value.toLocaleString()}` : 'Contact for pricing'

export function SimilarBuildings({ buildingId }: { buildingId: string }) {
  const { data } = useSWR<{ buildings: SimilarBuilding[] }>(`/api/buildings/${buildingId}/similar`, fetcher, {
    revalidateOnFocus: false,
  })
  const buildings = data?.buildings ?? []
  if (!buildings.length) return null

  return (
    <section aria-labelledby="similar-buildings-title" style={{ padding: '24px 20px 30px', background: '#fff', borderTop: '1px solid #ECEDF2' }}>
      <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
        <div>
          <h2 id="similar-buildings-title" style={{ margin: 0, fontFamily: 'var(--font-archivo)', fontSize: 20, fontWeight: 800, color: '#0A0F1C' }}>Keep Exploring</h2>
        </div>
        <span style={{ fontSize: 11, color: '#6B7280' }}>10 nearby options</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }} className="similar-buildings-grid">
        {buildings.map((item) => (
          <Link className="similar-building-card" key={item.id} href={`/buildings/${item.id}`} style={{ color: '#0A0F1C', textDecoration: 'none', border: '1px solid #ECEDF2', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
            <div style={{ position: 'relative', height: 130, background: '#F1F2F4' }}>
              {item.image ? <Image src={item.image} alt={`${item.name} exterior`} fill sizes="(max-width: 768px) 78vw, 30vw" style={{ objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#9CA3AF', fontSize: 11 }}>Photo coming soon</div>}
            </div>
            <div style={{ padding: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.25 }}>{item.name}</div>
              <div style={{ marginTop: 5, fontSize: 11, color: '#6B7280' }}>{item.neighborhood}</div>
              <div style={{ marginTop: 9, fontSize: 12, fontWeight: 700 }}>{money(item.priceMin)}{item.priceMax ? `–${money(item.priceMax).replace('$', '')}` : ''}<span style={{ color: '#6B7280', fontWeight: 500 }}>/mo</span></div>
            </div>
          </Link>
        ))}
      </div>
      <style jsx global>{`@media (max-width: 768px) { .similar-buildings-grid { display: flex !important; overflow-x: auto; padding-bottom: 8px; scroll-snap-type: x mandatory; } .similar-buildings-grid .similar-building-card { display: block; width: 78vw; min-width: 78vw; flex: 0 0 78vw; scroll-snap-align: start; } }`}</style>
    </section>
  )
}
