export type CommissionResult = { amount: number | null; reason: string | null }

const money = (value: string) => Number(value.replace(/,/g, ''))

// Computes the commission owed for a closed lease from a building's free-text
// commission rule. Percentages are applied to one month's rent (100% = one month).
// Returns amount null with a reason when the rule can't be computed automatically.
export function computeCommission(rule: string | null | undefined, monthlyRent: number, termMonths: number | null): CommissionResult {
  const text = (rule ?? '').trim()
  if (!text) return { amount: null, reason: 'No commission rule on file for this building' }
  if (/^no commission$/i.test(text)) return { amount: 0, reason: null }

  const flat = text.match(/^\$([\d,]+(?:\.\d+)?)$/)
  if (flat) return { amount: money(flat[1]), reason: null }

  const percent = text.match(/^(\d+(?:\.\d+)?)%$/)
  if (percent) return { amount: round2((Number(percent[1]) / 100) * monthlyRent), reason: null }

  const capped = text.match(/^(\d+(?:\.\d+)?)%\s+capped at\s+\$([\d,]+(?:\.\d+)?)$/i)
  if (capped) return { amount: round2(Math.min((Number(capped[1]) / 100) * monthlyRent, money(capped[2]))), reason: null }

  const ofLease = text.match(/^(\d+(?:\.\d+)?)%\s+of total lease$/i)
  if (ofLease) {
    if (!termMonths) return { amount: null, reason: 'Enter the lease term to compute a percent-of-lease commission' }
    return { amount: round2((Number(ofLease[1]) / 100) * monthlyRent * termMonths), reason: null }
  }

  return { amount: null, reason: `Commission rule "${text}" can't be computed automatically` }
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}
