import 'server-only'
import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildings } from '@/lib/buildings'

export const LEASE_MONTHS = 12

export type ChargeKind = 'pet' | 'optional' | 'required'
export type Charge = { type: string; amount: number }

export type BuildingPricing = {
  buildingId: string
  base: number | null
  baseSource: 'units' | 'pricing_units' | 'static' | null
  lastUpdated: string | null
  monthsFree: number
  moveInCredit: number
  leaseMonths: number
  hasDeal: boolean
  feesKnown: boolean
  requiredCharges: Charge[]
  requiredMonthly: number
  petCharges: Charge[]
  petMonthly: number
  optionalCharges: Charge[]
  moveInFees: Charge[]
  petMoveInFees: Charge[]
  moveInDue: number
  trueMonthly: number | null
  netRent: number | null
  netMonthly: number | null
  annualSavings: number
}

export function classifyCharge(type: string): ChargeKind {
  if (/pet/i.test(type)) return 'pet'
  if (/(parking|spot|garage|storage|bike|\bev\b|ev station|ev charging|insurance)/i.test(type)) return 'optional'
  return 'required'
}

type RawFee = { name?: unknown; amount?: unknown }

function toCharges(value: unknown): Charge[] {
  if (!Array.isArray(value)) return []
  return (value as RawFee[]).flatMap((fee) => {
    const amount = Number(fee?.amount)
    if (typeof fee?.name !== 'string' || !fee.name.trim() || !Number.isFinite(amount)) return []
    return [{ type: fee.name.trim(), amount }]
  })
}

const sum = (charges: Charge[]) => charges.reduce((total, charge) => total + charge.amount, 0)
const toNumber = (value: unknown) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

type PricedRow = { price: unknown; stamp: unknown }

function minAndStamp(rows: PricedRow[]) {
  let min: number | null = null
  let stamp: string | null = null
  for (const row of rows) {
    const price = Number(row.price)
    if (Number.isFinite(price) && price > 0 && (min === null || price < min)) min = price
    if (typeof row.stamp === 'string' && (stamp === null || row.stamp > stamp)) stamp = row.stamp
  }
  return { min, stamp }
}

export async function getBuildingPricings(ids: string[]): Promise<Map<string, BuildingPricing>> {
  const result = new Map<string, BuildingPricing>()
  if (ids.length === 0) return result
  const admin = createAdminClient()

  const [unitResults, feesResult, dealsResult] = await Promise.all([
    Promise.all(
      ids.map((id) =>
        admin.from('units').select('price, lastupdated').eq('building_id', id).gt('price', 0).order('price', { ascending: true }).limit(1000),
      ),
    ),
    admin.from('building_fees').select('building_id, monthly_fees, move_in_fees').in('building_id', ids),
    admin.from('building_deals').select('building_id, months_free, move_in_credit').in('building_id', ids),
  ])

  const unitInfo = ids.map((id, index) =>
    minAndStamp((unitResults[index].data ?? []).map((row) => ({ price: row.price, stamp: row.lastupdated }))),
  )

  const fallbackIds = ids.filter((_, index) => unitInfo[index].min === null)
  const fallbackResults = await Promise.all(
    fallbackIds.map((id) =>
      admin.from('pricing_units').select('price, updated_at').eq('building_id', id).gt('price', 0).order('price', { ascending: true }).limit(1000),
    ),
  )
  const fallbackInfo = new Map(
    fallbackIds.map((id, index) => [
      id,
      minAndStamp((fallbackResults[index].data ?? []).map((row) => ({ price: row.price, stamp: row.updated_at }))),
    ]),
  )

  const feeRows = new Map((feesResult.data ?? []).map((row) => [String(row.building_id), row]))
  const dealRows = new Map((dealsResult.data ?? []).map((row) => [String(row.building_id), row]))

  ids.forEach((id, index) => {
    let base: number | null = null
    let baseSource: BuildingPricing['baseSource'] = null
    let lastUpdated: string | null = null

    if (unitInfo[index].min !== null) {
      base = unitInfo[index].min
      baseSource = 'units'
      lastUpdated = unitInfo[index].stamp
    } else if (fallbackInfo.get(id)?.min != null) {
      base = fallbackInfo.get(id)!.min
      baseSource = 'pricing_units'
      lastUpdated = fallbackInfo.get(id)!.stamp
    } else {
      const staticPrice = buildings.find((building) => building.id === id)?.priceMin
      if (typeof staticPrice === 'number' && staticPrice > 0) {
        base = staticPrice
        baseSource = 'static'
      }
    }

    const deal = dealRows.get(id)
    const monthsFree = toNumber(deal?.months_free)
    const moveInCredit = toNumber(deal?.move_in_credit)
    const hasDeal = monthsFree > 0 || moveInCredit > 0

    const fee = feeRows.get(id)
    const monthly = toCharges(fee?.monthly_fees)
    const moveIn = toCharges(fee?.move_in_fees)
    const feesKnown = monthly.length > 0

    const requiredCharges = monthly.filter((charge) => classifyCharge(charge.type) === 'required')
    const petCharges = monthly.filter((charge) => classifyCharge(charge.type) === 'pet')
    const optionalCharges = monthly.filter((charge) => classifyCharge(charge.type) === 'optional')
    const requiredMonthly = sum(requiredCharges)
    const petMonthly = sum(petCharges)

    const nonPetMoveIn = moveIn.filter((charge) => classifyCharge(charge.type) !== 'pet')
    const petMoveInFees = moveIn.filter((charge) => classifyCharge(charge.type) === 'pet')

    const annualSavings = base !== null ? Math.round(base * monthsFree + moveInCredit) : 0
    const netRent = base !== null ? Math.round(base - (base * monthsFree + moveInCredit) / LEASE_MONTHS) : null
    const trueMonthly = base !== null && feesKnown ? base + requiredMonthly : null
    const netMonthly = netRent !== null && feesKnown ? netRent + requiredMonthly : null

    result.set(id, {
      buildingId: id,
      base,
      baseSource,
      lastUpdated,
      monthsFree,
      moveInCredit,
      leaseMonths: LEASE_MONTHS,
      hasDeal,
      feesKnown,
      requiredCharges,
      requiredMonthly,
      petCharges,
      petMonthly,
      optionalCharges,
      moveInFees: nonPetMoveIn,
      petMoveInFees,
      moveInDue: sum(nonPetMoveIn),
      trueMonthly,
      netRent,
      netMonthly,
      annualSavings,
    })
  })

  return result
}

export const getBuildingPricing = cache(async (buildingId: string): Promise<BuildingPricing> => {
  const map = await getBuildingPricings([buildingId])
  return map.get(buildingId)!
})
