import { createClient } from '@supabase/supabase-js'
import { buildings as catalog } from '@/lib/buildings'
import {
  MAX_VALID_PRICE,
  MIN_VALID_PRICE,
  type AffordabilityDataset,
  type BedKey,
  type CalcBuilding,
} from '@/lib/affordability'

const PAGE_SIZE = 1000

async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data?.length) break
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
  }
  return rows
}

const EMPTY: AffordabilityDataset = { buildings: [], updatedAt: null }

/**
 * Server-only. Reads only the columns the calculator needs and never selects buildings.commission
 * or any other agent-only column. The page that calls this revalidates hourly.
 */
export async function getAffordabilityDataset(): Promise<AffordabilityDataset> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return EMPTY
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })

  try {
    const [buildingRows, unitRows, feeRows, imageRows] = await Promise.all([
      fetchAll<{ id: string; name: string; neighborhood: string }>((from, to) =>
        supabase.from('buildings').select('id, name, neighborhood').eq('is_archived', false).order('id').range(from, to),
      ),
      fetchAll<{ building_id: string; price: number; beds: number; lastupdated: string | null }>((from, to) =>
        supabase
          .from('units')
          .select('building_id, price, beds, lastupdated')
          .not('building_id', 'is', null)
          .gte('price', MIN_VALID_PRICE)
          .lte('price', MAX_VALID_PRICE)
          .in('beds', [0, 1, 2, 3])
          .order('id')
          .range(from, to),
      ),
      fetchAll<{
        building_id: string
        has_fees: boolean | null
        required_monthly: number | null
        pet_monthly: number | null
        months_free: number | null
        lease_months: number | null
      }>((from, to) =>
        supabase
          .from('building_fees')
          .select('building_id, has_fees, required_monthly, pet_monthly, months_free, lease_months')
          .order('building_id')
          .range(from, to),
      ),
      fetchAll<{ building_id: string; image_url: string | null }>((from, to) =>
        supabase.from('building_images').select('building_id, image_url').order('sort_order').order('id').range(from, to),
      ),
    ])

    const fees = new Map(feeRows.map((row) => [row.building_id, row]))
    const heroImages = new Map<string, string>()
    for (const row of imageRows) if (row.image_url && !heroImages.has(row.building_id)) heroImages.set(row.building_id, row.image_url)
    const catalogImages = new Map(catalog.map((item) => [item.id, item.images?.[0] ?? null]))

    const pricesByBuilding = new Map<string, Record<BedKey, number[]>>()
    let latest: string | null = null
    for (const unit of unitRows) {
      const entry = pricesByBuilding.get(unit.building_id) ?? { 0: [], 1: [], 2: [], 3: [] }
      entry[unit.beds as BedKey].push(unit.price)
      pricesByBuilding.set(unit.building_id, entry)
      if (unit.lastupdated && (!latest || unit.lastupdated > latest)) latest = unit.lastupdated
    }

    const result: CalcBuilding[] = []
    for (const building of buildingRows) {
      const prices = pricesByBuilding.get(building.id)
      if (!prices) continue
      const fee = fees.get(building.id)
      result.push({
        id: building.id,
        name: building.name,
        neighborhood: building.neighborhood,
        image: heroImages.get(building.id) ?? catalogImages.get(building.id) ?? null,
        fees: {
          published: fee?.has_fees === true,
          requiredMonthly: Number(fee?.required_monthly ?? 0),
          petMonthly: Number(fee?.pet_monthly ?? 0),
          monthsFree: Number(fee?.months_free ?? 0),
          leaseMonths: Number(fee?.lease_months ?? 12) || 12,
        },
        prices,
      })
    }

    return { buildings: result, updatedAt: latest ? `${latest}Z` : null }
  } catch (error) {
    console.error('[affordability] failed to load dataset', error)
    return EMPTY
  }
}
