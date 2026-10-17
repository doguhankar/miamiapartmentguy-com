import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export type BuildingDeal = { hasDeal: boolean; badgeLabel: string | null }

export type DealListing = {
  buildingId: string
  name: string
  neighborhood: string | null
  startingPrice: number | null
  trueMonthlyStart: number | null
  monthsFree: number
  moveInCredit: number
  concessionText: string | null
  badgeLabel: string | null
  imageUrl: string | null
}

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// The view is not readable with the anon key, so it is read server-side and
// only public, display-only fields are returned.
export async function GET() {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('building_deals')
    .select(
      'building_id, name, neighborhood, starting_price, true_monthly_start, months_free, move_in_credit, concession_text, has_deal, badge_label',
    )

  if (error) return NextResponse.json({ error: 'Failed to load deals' }, { status: 500 })

  const dealRows = (data ?? []).filter((row) => row.has_deal)

  const deals: Record<string, BuildingDeal> = {}
  for (const row of dealRows) {
    deals[String(row.building_id)] = { hasDeal: true, badgeLabel: row.badge_label ?? null }
  }

  const imageByBuilding = new Map<string, string>()
  if (dealRows.length > 0) {
    const { data: images } = await admin
      .from('building_images')
      .select('building_id, image_url, sort_order')
      .in('building_id', dealRows.map((row) => String(row.building_id)))
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    for (const image of images ?? []) {
      const id = String(image.building_id)
      if (!imageByBuilding.has(id) && image.image_url) imageByBuilding.set(id, image.image_url)
    }
  }

  const items: DealListing[] = dealRows
    .map((row) => ({
      buildingId: String(row.building_id),
      name: String(row.name ?? ''),
      neighborhood: row.neighborhood ?? null,
      startingPrice: toNumber(row.starting_price),
      trueMonthlyStart: toNumber(row.true_monthly_start),
      monthsFree: toNumber(row.months_free) ?? 0,
      moveInCredit: toNumber(row.move_in_credit) ?? 0,
      concessionText: row.concession_text ?? null,
      badgeLabel: row.badge_label ?? null,
      imageUrl: imageByBuilding.get(String(row.building_id)) ?? null,
    }))
    .sort(
      (a, b) =>
        b.monthsFree - a.monthsFree ||
        (a.startingPrice ?? Number.MAX_SAFE_INTEGER) - (b.startingPrice ?? Number.MAX_SAFE_INTEGER),
    )

  return NextResponse.json(
    { deals, items },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  )
}
