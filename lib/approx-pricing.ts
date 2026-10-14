'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'

export interface ApproxPlan {
  type: string
  min: number
  max: number
}

export type ApproxPricingByBuilding = Record<string, ApproxPlan[]>

const PLAN_ORDER = [
  'Studio',
  '1 Bed',
  '1 Bed + Den',
  '1 Bed + Den (2 Bath)',
  '2 Bed',
  '2 Bed + Den',
  '3 Bed',
]

const PAGE_SIZE = 1000

function planRank(type: string) {
  const index = PLAN_ORDER.indexOf(type)
  return index === -1 ? PLAN_ORDER.length : index
}

async function fetchApproxPricing(): Promise<ApproxPricingByBuilding> {
  const supabase = createClient()
  const rows: { building_id: string; floor_plan_type: string | null; price: number | null }[] = []

  // PostgREST caps a response at 1000 rows, so page until a short page comes back.
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('pricing_units')
      .select('building_id, floor_plan_type, price')
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
    if (error || !data) break
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
  }

  const grouped: Record<string, Record<string, ApproxPlan>> = {}
  for (const row of rows) {
    if (!row.building_id || !row.floor_plan_type) continue
    if (typeof row.price !== 'number' || !Number.isFinite(row.price) || row.price <= 0) continue
    const plans = (grouped[row.building_id] ??= {})
    const plan = plans[row.floor_plan_type]
    if (plan) {
      plan.min = Math.min(plan.min, row.price)
      plan.max = Math.max(plan.max, row.price)
    } else {
      plans[row.floor_plan_type] = { type: row.floor_plan_type, min: row.price, max: row.price }
    }
  }

  const result: ApproxPricingByBuilding = {}
  for (const [buildingId, plans] of Object.entries(grouped)) {
    result[buildingId] = Object.values(plans).sort(
      (a, b) => planRank(a.type) - planRank(b.type) || a.type.localeCompare(b.type),
    )
  }
  return result
}

export function useApproxPricing(): ApproxPricingByBuilding {
  const { data } = useSWR('approx-pricing-units', fetchApproxPricing, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  })
  return data ?? {}
}

export function lowestApproxPrice(plans: ApproxPlan[] | undefined): number | null {
  if (!plans || plans.length === 0) return null
  return Math.min(...plans.map((plan) => plan.min))
}

const money = (value: number) => `$${Math.round(value).toLocaleString('en-US')}`

export function formatApproxPlan(plan: ApproxPlan): string {
  return plan.min === plan.max ? `from ${money(plan.min)}` : `${money(plan.min)} – ${money(plan.max)}`
}
