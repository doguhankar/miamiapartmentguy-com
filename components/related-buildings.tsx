import Link from 'next/link'
import type { Building } from '@/lib/buildings'
import { relatedBuildings, slugify } from '@/lib/seo-shared'

export function RelatedBuildings({ building }: { building: Building }) {
  const related = relatedBuildings(building)
  const hoodHref = `/neighborhoods/${slugify(building.neighborhood)}`

  return (
    <nav aria-labelledby="related-buildings-title" style={{ fontFamily: "'Inter', sans-serif" }}>
      <h2 id="related-buildings-title" style={{ margin: '0 0 12px', fontFamily: 'var(--font-archivo)', fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em', color: '#111827' }}>
        More apartments in {building.neighborhood}
      </h2>
      {related.length > 0 && (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {related.map((item) => (
            <li key={item.id}>
              <Link
                href={`/buildings/${item.id}`}
                style={{ display: 'inline-block', padding: '8px 14px', border: '1px solid #E5E7EB', borderRadius: 999, background: '#fff', color: '#111827', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href={hoodHref} style={{ display: 'inline-block', marginTop: 14, color: '#0B7F7A', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
        See all {building.neighborhood} apartments
      </Link>
    </nav>
  )
}
