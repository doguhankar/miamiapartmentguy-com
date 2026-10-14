export const PRICING_COMING_SOON = 'Pricing coming soon'

export function hasPrice(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}
