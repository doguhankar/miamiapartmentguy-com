import { ApartmentInventory } from '@/components/home/apartment-inventory'
import { HomePageClient } from '@/components/home/home-page-client'
import { getBuildingPricings } from '@/lib/pricing/building-pricing'
import { agentJsonLd, getPublicBuildings, groupByNeighborhood, serializeJsonLd } from '@/lib/seo'

export const revalidate = 3600

export default async function HomePage() {
  const publicBuildings = await getPublicBuildings()
  const pricingMap = await getBuildingPricings(publicBuildings.map((building) => building.id))
  const neighborhoods = groupByNeighborhood(publicBuildings).map((group) => ({ slug: group.slug, name: group.name }))
  const inventory = publicBuildings.map((building) => ({ building, pricing: pricingMap.get(building.id) ?? null }))
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      agentJsonLd(),
      {
        '@type': 'CollectionPage',
        name: 'Miami Apartments for Rent',
        url: 'https://www.miamiapartmentguy.com/',
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: inventory.length,
          itemListElement: inventory.slice(0, 30).map(({ building }, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `https://www.miamiapartmentguy.com/buildings/${building.id}`,
            name: building.name,
          })),
        },
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />
      <HomePageClient neighborhoods={neighborhoods} inventory={<ApartmentInventory items={inventory} />} />
    </>
  )
}
