import type { MetadataRoute } from 'next'
import { buildings } from '@/lib/buildings'
import { SITE_URL, getLiveBuildingRows, groupByNeighborhood } from '@/lib/seo'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rows = await getLiveBuildingRows()
  const now = new Date()

  const publicBuildings = buildings.filter((building) => rows.get(String(building.id))?.archived !== true)

  const buildingPages: MetadataRoute.Sitemap = publicBuildings.map((building) => {
    const updatedAt = rows.get(String(building.id))?.updatedAt
    return {
      url: `${SITE_URL}/buildings/${building.id}`,
      lastModified: updatedAt ? new Date(updatedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }
  })

  const neighborhoodPages: MetadataRoute.Sitemap = groupByNeighborhood(publicBuildings).map((group) => ({
    url: `${SITE_URL}/neighborhoods/${group.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.85,
  }))

  return [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/miami-apartment-locator`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE_URL}/map`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    ...neighborhoodPages,
    { url: `${SITE_URL}/join-team`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    ...buildingPages,
  ]
}
