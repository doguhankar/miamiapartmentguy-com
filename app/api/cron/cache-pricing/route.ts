import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type CachedUnit = {
  price: number | null
  beds: number | null
  baths: number | null
  sqft: number | null
  available_date: string | null
}

type PricingCache = Record<string, Record<string, CachedUnit>>

declare global {
  // eslint-disable-next-line no-var
  var pricingCache: PricingCache | undefined
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('pricing_units')
      .select('building_id, floor_plan_type, price, beds, baths, sqft, available_date')

    if (error) throw error

    const pricingCache: PricingCache = {}

    for (const unit of data ?? []) {
      const buildingId = String(unit.building_id)
      const floorPlanType = String(unit.floor_plan_type)

      pricingCache[buildingId] ??= {}
      pricingCache[buildingId][floorPlanType] = {
        price: unit.price == null ? null : Number(unit.price),
        beds: unit.beds == null ? null : Number(unit.beds),
        baths: unit.baths == null ? null : Number(unit.baths),
        sqft: unit.sqft == null ? null : Number(unit.sqft),
        available_date: unit.available_date ?? null,
      }
    }

    globalThis.pricingCache = pricingCache

    return NextResponse.json({
      success: true,
      buildingsCached: Object.keys(pricingCache).length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to cache pricing data'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
