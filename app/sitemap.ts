import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { buildings } from '@/lib/buildings'

const BASE_URL = 'https://www.miamiapartmentguy.com'

export const revalidate = 3600

async function getArchivedBuildingIds(): Promise<Set<string>> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return new Set()

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const { data, error } = await supabase.from('buildings').select('id').eq('is_archived', true)
    if (error || !data) return new Set()
    return new Set(data.map((row) => String(row.id)))
  } catch {
    return new Set()
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const archivedIds = await getArchivedBuildingIds()
  const now = new Date()

  const buildingPages: MetadataRoute.Sitemap = buildings
    .filter((building) => !archivedIds.has(String(building.id)))
    .map((building) => ({
      url: `${BASE_URL}/buildings/${building.id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

  return [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/map`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/join-team`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    ...buildingPages,
  ]
}
