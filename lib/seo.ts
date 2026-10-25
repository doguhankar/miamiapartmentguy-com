import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import { buildings, type Building } from '@/lib/buildings'
import { slugify, distanceKm, relatedBuildings, groupByNeighborhood, type NeighborhoodGroup } from '@/lib/seo-shared'

export const SITE_URL = 'https://www.miamiapartmentguy.com'
export const SITE_NAME = 'Miami Apartment Guy'
export const DEFAULT_OG_IMAGE = '/og-start.jpg'
export const AGENT_NAME = 'Don Karahan'
export const AGENT_PHONE = '+1-407-765-7306'
export const AGENT_PHONE_E164 = '+14077657306'
export const AGENT_EMAIL = 'don@miamiapartmentguy.com'
export const LICENSE_NUMBER = 'SL3581300'
export const BROKERAGE = '305 International Realty'

export const SMS_HREF = 'sms:+14077657306?body=Hi%20Don%2C%20I%27m%20looking%20for%20an%20apartment%20in%20Miami'

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function formatPrice(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.—-]+$/, '')}…`
}

export function getBuildingById(id: string): Building | undefined {
  return buildings.find((building) => building.id === id)
}

export function neighborhoodSlugFor(building: Building): string {
  return slugify(building.neighborhood)
}

function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export interface LiveBuildingRow {
  id: string
  updatedAt: string | null
  archived: boolean
}

export const getLiveBuildingRows = cache(async (): Promise<Map<string, LiveBuildingRow>> => {
  const rows = new Map<string, LiveBuildingRow>()
  const supabase = adminClient()
  if (!supabase) return rows
  try {
    const { data, error } = await supabase.from('buildings').select('id, updated_at, is_archived')
    if (error || !data) return rows
    for (const row of data) {
      rows.set(String(row.id), {
        id: String(row.id),
        updatedAt: row.updated_at ?? null,
        archived: row.is_archived === true,
      })
    }
  } catch {
    return rows
  }
  return rows
})

export async function getPublicBuildings(): Promise<Building[]> {
  const rows = await getLiveBuildingRows()
  return buildings.filter((building) => rows.get(building.id)?.archived !== true)
}

export interface LivePricing {
  min: number
  max: number
  unitCount: number
}

export const getLivePricingMap = cache(async (): Promise<Map<string, LivePricing>> => {
  const map = new Map<string, LivePricing>()
  const supabase = adminClient()
  if (!supabase) return map
  try {
    const { data, error } = await supabase.from('pricing_units').select('building_id, price').gt('price', 0)
    if (error || !data) return map
    for (const row of data) {
      const id = String(row.building_id)
      const price = Number(row.price)
      if (!Number.isFinite(price) || price <= 0) continue
      const current = map.get(id)
      map.set(id, {
        min: current ? Math.min(current.min, price) : price,
        max: current ? Math.max(current.max, price) : price,
        unitCount: (current?.unitCount ?? 0) + 1,
      })
    }
  } catch {
    return map
  }
  return map
})

export interface PriceSummary {
  min: number
  max: number | null
  unitCount: number
  live: boolean
}

export function summarizePrice(building: Building, live?: LivePricing): PriceSummary {
  if (live) return { min: live.min, max: live.max > live.min ? live.max : (building.priceMax ?? null), unitCount: live.unitCount, live: true }
  return { min: building.priceMin, max: building.priceMax ?? null, unitCount: 0, live: false }
}

export const getBuildingImages = cache(async (building: Building): Promise<string[]> => {
  const supabase = adminClient()
  if (supabase) {
    try {
      const { data } = await supabase
        .from('building_images')
        .select('image_url, sort_order')
        .eq('building_id', building.id)
        .order('sort_order', { ascending: true })
        .limit(8)
      const urls = (data ?? []).map((row) => row.image_url).filter((url): url is string => typeof url === 'string' && url.length > 0)
      if (urls.length) return urls
    } catch {
      // fall through to the static catalog photos
    }
  }
  return building.images
})

export function realConcession(building: Building): string | null {
  const value = building.concession?.trim()
  if (!value || /^(tbd|contact for current offers|no current concessions|none|n\/a)$/i.test(value)) return null
  return value
}

export function buildingTitle(building: Building, price: PriceSummary): string {
  const tail = price.min > 0 ? `Starting at ${formatPrice(price.min)}` : 'Live Pricing & Deals'
  return `${building.name} Apartments — ${building.neighborhood}, Miami | ${tail}`
}

export function buildingDescription(building: Building, price: PriceSummary): string {
  const parts: string[] = []
  const priceText = price.min > 0 ? `from ${formatPrice(price.min)}/mo${price.max ? ` to ${formatPrice(price.max)}/mo` : ''}` : 'with live pricing'
  parts.push(`${building.name} apartments in ${building.neighborhood}, Miami (${building.address}) ${priceText}.`)
  if (building.units.length) parts.push(`Floor plans: ${building.units.join(', ')}.`)
  const deal = realConcession(building)
  if (deal) parts.push(`Current deal: ${deal}.`)
  if (building.amenities.length) parts.push(`Amenities: ${building.amenities.slice(0, 5).join(', ')}.`)
  parts.push('Free locator help from Miami Apartment Guy.')
  return truncate(parts.join(' '), 300)
}

function parseAddress(address: string) {
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean)
  const stateZip = parts[2]?.match(/^([A-Z]{2})\s+(\d{5})/)
  return {
    '@type': 'PostalAddress',
    streetAddress: parts[0] ?? address,
    addressLocality: parts[1] ?? 'Miami',
    addressRegion: stateZip?.[1] ?? 'FL',
    ...(stateZip?.[2] ? { postalCode: stateZip[2] } : {}),
    addressCountry: 'US',
  }
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, '')
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function buildingJsonLd(building: Building, price: PriceSummary, images: string[]) {
  const url = absoluteUrl(`/buildings/${building.id}`)
  const hood = { name: building.neighborhood, path: `/neighborhoods/${neighborhoodSlugFor(building)}` }
  const complex = {
    '@type': 'ApartmentComplex',
    '@id': `${url}#apartments`,
    name: building.name,
    url,
    description: buildingDescription(building, price),
    image: images.slice(0, 6),
    address: parseAddress(building.address),
    geo: { '@type': 'GeoCoordinates', latitude: building.lat, longitude: building.lng },
    telephone: building.phone ?? undefined,
    containedInPlace: { '@type': 'AdministrativeArea', name: building.neighborhood },
    ...(building.amenities.length
      ? { amenityFeature: building.amenities.map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true })) }
      : {}),
    ...(price.unitCount > 0 ? { numberOfAvailableAccommodationUnits: price.unitCount } : {}),
    ...(building.units.length ? { additionalProperty: { '@type': 'PropertyValue', name: 'Floor plans', value: building.units.join(', ') } } : {}),
  }
  const listing = {
    '@type': 'RealEstateListing',
    '@id': `${url}#listing`,
    url,
    name: buildingTitle(building, price),
    description: buildingDescription(building, price),
    image: images[0],
    mainEntity: { '@id': complex['@id'] },
    breadcrumb: { '@id': `${url}#breadcrumb` },
    provider: { '@id': `${SITE_URL}/#agent` },
    ...(price.min > 0
      ? {
          offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'USD',
            lowPrice: Math.round(price.min),
            ...(price.max ? { highPrice: Math.round(price.max) } : {}),
            ...(price.unitCount > 0 ? { offerCount: price.unitCount } : {}),
            businessFunction: 'http://purl.org/goodrelations/v1#LeaseOut',
            url,
          },
        }
      : {}),
  }
  const crumbs = {
    ...breadcrumbJsonLd([{ name: 'Home', path: '/' }, hood, { name: building.name, path: `/buildings/${building.id}` }]),
    '@id': `${url}#breadcrumb`,
  }
  return { '@context': 'https://schema.org', '@graph': [listing, complex, crumbs] }
}

export function agentJsonLd() {
  return {
    '@type': 'RealEstateAgent',
    '@id': `${SITE_URL}/#agent`,
    name: SITE_NAME,
    url: SITE_URL,
    description: 'Free Miami apartment locator service. Live pricing, current deals and same-day quotes on apartment buildings across Miami-Dade and Broward.',
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    logo: absoluteUrl('/icon.svg'),
    telephone: AGENT_PHONE,
    email: AGENT_EMAIL,
    founder: { '@type': 'Person', name: AGENT_NAME },
    employee: { '@type': 'Person', name: AGENT_NAME, jobTitle: 'Licensed Florida Real Estate Agent' },
    parentOrganization: { '@type': 'Organization', name: BROKERAGE },
    identifier: { '@type': 'PropertyValue', name: 'Florida Real Estate License', value: LICENSE_NUMBER },
    priceRange: 'Free for renters',
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Miami-Dade County, FL' },
      { '@type': 'AdministrativeArea', name: 'Broward County, FL' },
    ],
    sameAs: [
      'https://instagram.com/miamiapartmentguy',
      'https://tiktok.com/@themiamiapartmentguy',
      'https://wa.me/14077657306',
    ],
    contactPoint: { '@type': 'ContactPoint', telephone: AGENT_PHONE, contactType: 'customer service', availableLanguage: ['English'] },
  }
}

export { slugify, distanceKm, relatedBuildings, groupByNeighborhood, type NeighborhoodGroup }
