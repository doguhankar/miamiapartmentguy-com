import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type FeeEntry = { name?: unknown; amount?: unknown }

// Returns parking amounts only when building_fees.monthly_fees contains a real
// parking entry with a positive amount. Buildings without one are omitted.
export async function GET() {
  const admin = createAdminClient()

  const { data, error } = await admin.from('building_fees').select('building_id, monthly_fees')

  if (error) return NextResponse.json({ error: 'Failed to load parking fees' }, { status: 500 })

  const parking: Record<string, number[]> = {}
  for (const row of data ?? []) {
    const fees: FeeEntry[] = Array.isArray(row.monthly_fees) ? row.monthly_fees : []
    const amounts = fees
      .filter((fee) => typeof fee?.name === 'string' && /parking/i.test(fee.name))
      .map((fee) => Number(fee.amount))
      .filter((amount) => Number.isFinite(amount) && amount > 0)

    if (amounts.length > 0) parking[String(row.building_id)] = amounts
  }

  return NextResponse.json(
    { parking },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  )
}
