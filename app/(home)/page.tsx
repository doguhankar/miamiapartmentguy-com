import { HomePageClient } from '@/components/home/home-page-client'
import { agentJsonLd, getPublicBuildings, groupByNeighborhood, serializeJsonLd } from '@/lib/seo'

export const revalidate = 3600

export default async function HomePage() {
  const publicBuildings = await getPublicBuildings()
  const neighborhoods = groupByNeighborhood(publicBuildings).map((group) => ({ slug: group.slug, name: group.name }))
  const jsonLd = { '@context': 'https://schema.org', '@graph': [agentJsonLd()] }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <HomePageClient neighborhoods={neighborhoods} />
    </>
  )
}
