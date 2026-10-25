import { slugify } from '@/lib/seo-shared'

export const RENT_INCOME_MULTIPLE = 3
export const STRETCH_FACTOR = 1.15
export const MIN_VALID_PRICE = 800
export const MAX_VALID_PRICE = 30000
export const MIN_SALARY = 10000
export const MAX_SALARY = 10000000

export type BedKey = 0 | 1 | 2 | 3

export const BED_OPTIONS: { key: BedKey; label: string; short: string }[] = [
  { key: 0, label: 'Studio', short: 'Studio' },
  { key: 1, label: '1 bedroom', short: '1BR' },
  { key: 2, label: '2 bedrooms', short: '2BR' },
  { key: 3, label: '3 bedrooms', short: '3BR' },
]

export function bedLabel(beds: BedKey): string {
  return BED_OPTIONS.find((option) => option.key === beds)?.short ?? `${beds}BR`
}

export interface BuildingFees {
  /** building_fees.has_fees === true. When false/null fees are unknown, never $0. */
  published: boolean
  requiredMonthly: number
  petMonthly: number
  monthsFree: number
  leaseMonths: number
}

export interface CalcBuilding {
  id: string
  name: string
  neighborhood: string
  image: string | null
  fees: BuildingFees
  prices: Record<BedKey, number[]>
}

export interface AffordabilityDataset {
  buildings: CalcBuilding[]
  /** ISO timestamp of the latest units.lastupdated */
  updatedAt: string | null
}

export type AffordabilityTag = 'affordable' | 'stretch' | 'out'

export function tagFor(cost: number, maxRent: number): AffordabilityTag {
  if (cost <= maxRent) return 'affordable'
  if (cost <= maxRent * STRETCH_FACTOR) return 'stretch'
  return 'out'
}

export function maxRentFor(salary: number): number {
  return Math.floor(salary / 12 / RENT_INCOME_MULTIPLE)
}

export function salaryBucket(salary: number): string {
  if (salary < 50000) return 'under_50k'
  if (salary < 75000) return '50k_75k'
  if (salary < 100000) return '75k_100k'
  if (salary < 150000) return '100k_150k'
  if (salary < 200000) return '150k_200k'
  return '200k_plus'
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * TRUE monthly cost = rent + required monthly fees (+ pet rent if pet) - concession amortized over the lease.
 * Fees are only added when the building publishes them; otherwise the figure is base rent minus any concession.
 */
export function trueMonthlyCost(price: number, fees: BuildingFees, pet: boolean): number {
  const monthlyFees = fees.published ? fees.requiredMonthly + (pet ? fees.petMonthly : 0) : 0
  const concession = fees.monthsFree > 0 ? (fees.monthsFree * price) / (fees.leaseMonths || 12) : 0
  return price + monthlyFees - concession
}

export function concessionLabel(fees: BuildingFees): string | null {
  if (fees.monthsFree <= 0) return null
  const months = Number.isInteger(fees.monthsFree) ? String(fees.monthsFree) : fees.monthsFree.toFixed(1)
  return `${months} ${fees.monthsFree === 1 ? 'month' : 'months'} free`
}

export interface NeighborhoodSummary {
  name: string
  slug: string
  medianCost: number
  unitCount: number
  buildingCount: number
  feesPublishedBuildings: number
}

export function neighborhoodSummaries(dataset: AffordabilityDataset, beds: BedKey, pet: boolean): NeighborhoodSummary[] {
  const groups = new Map<string, { costs: number[]; buildings: Set<string>; published: Set<string> }>()
  for (const building of dataset.buildings) {
    const prices = building.prices[beds]
    if (!prices?.length) continue
    const group = groups.get(building.neighborhood) ?? { costs: [], buildings: new Set(), published: new Set() }
    for (const price of prices) group.costs.push(trueMonthlyCost(price, building.fees, pet))
    group.buildings.add(building.id)
    if (building.fees.published) group.published.add(building.id)
    groups.set(building.neighborhood, group)
  }
  const result: NeighborhoodSummary[] = []
  for (const [name, group] of groups) {
    const mid = median(group.costs)
    if (mid === null) continue
    result.push({
      name,
      slug: slugify(name),
      medianCost: Math.round(mid),
      unitCount: group.costs.length,
      buildingCount: group.buildings.size,
      feesPublishedBuildings: group.published.size,
    })
  }
  return result.sort((a, b) => a.medianCost - b.medianCost)
}

export interface BuildingOption {
  id: string
  name: string
  neighborhood: string
  image: string | null
  /** True monthly cost of the cheapest matching unit */
  trueCost: number
  /** Advertised rent of that same unit */
  baseRent: number
  concession: string | null
  feesPublished: boolean
}

export function buildingOptions(dataset: AffordabilityDataset, beds: BedKey, pet: boolean): BuildingOption[] {
  const options: BuildingOption[] = []
  for (const building of dataset.buildings) {
    const prices = building.prices[beds]
    if (!prices?.length) continue
    let best = { cost: Infinity, price: 0 }
    for (const price of prices) {
      const cost = trueMonthlyCost(price, building.fees, pet)
      if (cost < best.cost) best = { cost, price }
    }
    options.push({
      id: building.id,
      name: building.name,
      neighborhood: building.neighborhood,
      image: building.image,
      trueCost: Math.round(best.cost),
      baseRent: best.price,
      concession: concessionLabel(building.fees),
      feesPublished: building.fees.published,
    })
  }
  return options
}

/** Buildings inside the budget first (cheapest first), then "stretch" buildings to fill the list. */
export function pickBuildingsInBudget(options: BuildingOption[], maxRent: number, limit = 12) {
  const affordable = options.filter((item) => tagFor(item.trueCost, maxRent) === 'affordable').sort((a, b) => a.trueCost - b.trueCost)
  const stretch = options.filter((item) => tagFor(item.trueCost, maxRent) === 'stretch').sort((a, b) => a.trueCost - b.trueCost)
  return [...affordable, ...stretch].slice(0, limit).map((item) => ({ ...item, tag: tagFor(item.trueCost, maxRent) as AffordabilityTag }))
}

export interface ExplainerStats {
  medianByBeds: Record<BedKey, number | null>
  oneBedByNeighborhood: NeighborhoodSummary[]
  buildingCount: number
  feesPublishedCount: number
  avgRequiredMonthly: number | null
  avgPetMonthly: number | null
  concessionBuildingCount: number
}

export function explainerStats(dataset: AffordabilityDataset): ExplainerStats {
  const medianFor = (beds: BedKey) => {
    const costs: number[] = []
    for (const building of dataset.buildings) for (const price of building.prices[beds] ?? []) costs.push(trueMonthlyCost(price, building.fees, false))
    const mid = median(costs)
    return mid === null ? null : Math.round(mid)
  }
  const published = dataset.buildings.filter((building) => building.fees.published)
  const average = (values: number[]) => (values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null)
  return {
    medianByBeds: { 0: medianFor(0), 1: medianFor(1), 2: medianFor(2), 3: medianFor(3) },
    oneBedByNeighborhood: neighborhoodSummaries(dataset, 1, false),
    buildingCount: dataset.buildings.length,
    feesPublishedCount: published.length,
    avgRequiredMonthly: average(published.map((building) => building.fees.requiredMonthly).filter((value) => value > 0)),
    avgPetMonthly: average(published.map((building) => building.fees.petMonthly).filter((value) => value > 0)),
    concessionBuildingCount: dataset.buildings.filter((building) => building.fees.monthsFree > 0).length,
  }
}

export function formatUsd(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`
}
