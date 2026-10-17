import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

type RawFee = { name?: unknown; amount?: unknown }
type Fee = { type: string; amount: number }

function toFees(value: unknown): Fee[] {
  if (!Array.isArray(value)) return []
  return (value as RawFee[]).flatMap((fee) => {
    const amount = Number(fee?.amount)
    if (typeof fee?.name !== 'string' || !fee.name.trim() || !Number.isFinite(amount)) return []
    return [{ type: fee.name.trim(), amount }]
  })
}

// building_fees is the single source of truth for fees. Buildings without a row are omitted.
export async function GET() {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('building_fees')
    .select('building_id, monthly_fees, move_in_fees')

  if (error) return NextResponse.json({ error: 'Failed to load building fees' }, { status: 500 })

  const fees: Record<string, { moveInFees: Fee[]; monthlyCharges: Fee[] }> = {}
  for (const row of data ?? []) {
    fees[String(row.building_id)] = {
      moveInFees: toFees(row.move_in_fees),
      monthlyCharges: toFees(row.monthly_fees),
    }
  }

  return NextResponse.json(
    { fees },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
  )
}
