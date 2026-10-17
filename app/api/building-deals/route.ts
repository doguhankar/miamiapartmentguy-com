import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export type BuildingDeal = { hasDeal: boolean; badgeLabel: string | null }

// The view is not readable with the anon key, so it is read server-side and
// only the two public, display-only fields are returned.
export async function GET() {
  const { data, error } = await createAdminClient()
    .from('building_deals')
    .select('building_id, has_deal, badge_label')

  if (error) return NextResponse.json({ error: 'Failed to load deals' }, { status: 500 })

  const deals: Record<string, BuildingDeal> = {}
  for (const row of data ?? []) {
    if (!row.has_deal) continue
    deals[String(row.building_id)] = { hasDeal: true, badgeLabel: row.badge_label ?? null }
  }

  return NextResponse.json(
    { deals },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  )
}
