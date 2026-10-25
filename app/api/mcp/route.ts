import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const GPT_TOOL_LIMIT = 10
const MAX_NEIGHBORHOOD_LENGTH = 80
const MAX_AMENITIES = 12
const MAX_AMENITY_LENGTH = 60
const rateBuckets = new Map<string, { count: number; resetAt: number }>()

const GPT_URL = 'https://miamiapartmentguy.com'

type Building = { id: string; name: string; neighborhood: string | null }
type Fee = {
  building_id: string
  has_fees: boolean | null
  required_monthly: number | null
  pet_monthly: number | null
  months_free: number | null
  lease_months: number | null
}
type Unit = {
  building_id: string
  price: number | null
  beds: number | null
  baths: number | null
  sqft: number | null
  availabilitydate: string | null
}
type PricingUnit = { building_id: string; price: number | null; beds: number | null }

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function checkRateLimit(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwarded || request.headers.get('x-real-ip') || 'unknown'
  const now = Date.now()
  const current = rateBuckets.get(ip)
  if (!current || current.resetAt <= now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (current.count >= 30) return false
  current.count += 1
  return true
}

function numberOrNull(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function buildServer() {
  const server = new McpServer({ name: 'Miami Apartment Guy', version: '1.0.0' }, { maxToolInputElements: 40 })

  server.registerTool(
    'search_apartments',
    {
      title: 'Search Miami apartments',
      description:
        'Searches public Miami apartment inventory. Confirmed unit listings are real per-unit records; estimated floor plan pricing is clearly labeled when no matching units exist.',
      inputSchema: {
        neighborhood: z.string().max(MAX_NEIGHBORHOOD_LENGTH).optional(),
        max_budget: z.number().finite().positive().max(30_000).optional(),
        bedrooms: z.number().int().min(0).max(5).optional(),
        amenities: z.array(z.string().max(MAX_AMENITY_LENGTH)).max(MAX_AMENITIES).optional(),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ neighborhood, max_budget, bedrooms, amenities }) => {
      const supabase = getSupabase()
      const normalizedNeighborhood = neighborhood?.trim().toLowerCase()
      const normalizedAmenities = (amenities ?? []).map((item) => item.trim().toLowerCase()).filter(Boolean)

      const buildingQuery = supabase
        .from('buildings')
        .select('id,name,neighborhood,is_archived')
        .eq('is_archived', false)
        .limit(500)
      const { data: buildingRows, error: buildingsError } = await buildingQuery
      if (buildingsError) throw new Error('Apartment data is temporarily unavailable')

      const buildings = (buildingRows ?? []).filter((building) => {
        if (normalizedNeighborhood && !String(building.neighborhood ?? '').toLowerCase().includes(normalizedNeighborhood)) return false
        if (normalizedAmenities.length) {
          const haystack = JSON.stringify(building.amenities ?? '').toLowerCase()
          if (!normalizedAmenities.every((item) => haystack.includes(item))) return false
        }
        return true
      }) as Building[]
      if (!buildings.length) return { content: [{ type: 'text' as const, text: 'No apartments match those filters.' }] }

      const ids = buildings.map((building) => building.id)
      const [unitsResult, pricingResult, feesResult] = await Promise.all([
        supabase.from('units').select('building_id,price,beds,baths,sqft,availabilitydate').in('building_id', ids).gte('price', 800).lte('price', 30_000).limit(5000),
        supabase.from('pricing_units').select('building_id,price,beds').in('building_id', ids).gte('price', 800).lte('price', 30_000).limit(5000),
        supabase.from('building_fees').select('building_id,has_fees,required_monthly,pet_monthly,months_free,lease_months').in('building_id', ids),
      ])
      if (unitsResult.error || pricingResult.error || feesResult.error) throw new Error('Apartment pricing data is temporarily unavailable')

      const fees = new Map((feesResult.data ?? []).map((fee) => [fee.building_id, fee as Fee]))
      const units = (unitsResult.data ?? []) as Unit[]
      const pricing = (pricingResult.data ?? []) as PricingUnit[]
      const matches: Array<Record<string, unknown>> = []

      for (const building of buildings) {
        const buildingUnits = units.filter((unit) => unit.building_id === building.id && (bedrooms === undefined || unit.beds === bedrooms))
        const source = buildingUnits.length ? 'confirmed unit listing' : 'estimated floor plan pricing'
        const candidates = buildingUnits.length
          ? buildingUnits
          : pricing.filter((unit) => unit.building_id === building.id && (bedrooms === undefined || unit.beds === bedrooms))
        const candidate = candidates.find((item) => {
          const price = numberOrNull(item.price)
          return price !== null && (max_budget === undefined || price <= max_budget)
        })
        if (!candidate || candidate.price === null) continue

        const fee = fees.get(building.id)
        const concession = fee?.months_free && fee.months_free > 0
          ? fee.months_free * candidate.price / (fee.lease_months || 12)
          : 0
        const trueMonthly = fee?.has_fees === true
          ? Math.max(0, candidate.price + (fee.required_monthly ?? 0) - concession)
          : candidate.price
        if (max_budget !== undefined && trueMonthly > max_budget) continue

        matches.push({
          building_name: building.name,
          neighborhood: building.neighborhood,
          bedrooms: candidate.beds,
          price: candidate.price,
          price_source: source,
          true_monthly_cost: Math.round(trueMonthly),
          known_fees: fee?.has_fees === true
            ? { required_monthly: fee.required_monthly ?? 0, pet_monthly: fee.pet_monthly ?? 0, months_free: fee.months_free ?? 0 }
            : 'fees not published',
          availability: 'availabilitydate' in candidate ? candidate.availabilitydate : null,
          baths: 'baths' in candidate ? candidate.baths : null,
          sqft: 'sqft' in candidate ? candidate.sqft : null,
          building_url: `${GPT_URL}/buildings/${encodeURIComponent(building.id)}`,
        })
        if (matches.length >= GPT_TOOL_LIMIT) break
      }

      const text = matches.length
        ? JSON.stringify({ matches, note: 'Prices and availability are from public data and may change. Estimated floor plan pricing is not a confirmed available unit.' })
        : 'No apartments match those filters. Try a higher budget, different neighborhood, or different bedroom count.'
      return { content: [{ type: 'text' as const, text }] }
    },
  )

  return server
}

async function handle(request: Request) {
  if (!checkRateLimit(request)) return new Response('Too many requests', { status: 429, headers: { 'Retry-After': '60' } })
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  const server = buildServer()
  await server.connect(transport)
  return transport.handleRequest(request)
}

export async function GET(request: Request) { return handle(request) }
export async function POST(request: Request) { return handle(request) }
export async function DELETE(request: Request) { return handle(request) }
