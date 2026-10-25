/**
 * State income tax config for the "Can I Afford Miami?" calculator.
 *
 * Single filer, tax year 2026, wages only. This is the ONLY file with tax numbers, so it is the one to verify.
 *
 * How the estimate works:
 *   taxable = max(0, gross - standardDeduction - personalExemption)
 *   tax     = progressive brackets on taxable, minus any flat nonrefundable credit (never below 0)
 *
 * Brackets are written as "rate applies to taxable income OVER `over`" so they can be compared
 * line by line with the source tables.
 *
 * Not modelled (all of these make the real number differ slightly): pre-tax deductions such as 401(k),
 * itemized deductions, credits, local taxes other than NYC, payroll taxes such as CA SDI, and
 * high-income phase-outs/recapture (NY tax benefit recapture, IL exemption phase-out, CA 1% surcharge over $1M).
 *
 * PRIMARY SOURCE for every state below (rates, brackets, standard deductions, exemptions as of 2026-02-11):
 *   https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/
 * Each state also lists the official agency page to cross-check.
 */

export const TAX_YEAR = 2026

export interface TaxBracket {
  over: number
  rate: number
}

export interface TaxRegime {
  /** Display name of the jurisdiction */
  name: string
  /** Subtracted from gross before brackets */
  standardDeduction: number
  /** Personal exemption taken as a deduction */
  personalExemption: number
  /** Flat nonrefundable credit subtracted from computed tax */
  personalCredit: number
  brackets: TaxBracket[]
  /** Official agency page to cross-check */
  officialUrl: string
  /** Caveats shown in the methodology note */
  note?: string
}

const NO_TAX: TaxBracket[] = []

export const STATE_TAX: Record<string, TaxRegime> = {
  /**
   * New York (state). Source: Tax Foundation table above. Official: https://www.tax.ny.gov/pit/file/tax-tables.htm
   * 2026 rates are the 2025 budget's 0.1-point cuts on the first five brackets. Std deduction single = $8,000.
   */
  ny: {
    name: 'New York State',
    standardDeduction: 8000,
    personalExemption: 0,
    personalCredit: 0,
    officialUrl: 'https://www.tax.ny.gov/pit/file/tax-tables.htm',
    note: 'Ignores NY tax benefit recapture, which raises the effective rate above roughly $107,650 of income.',
    brackets: [
      { over: 0, rate: 0.039 },
      { over: 8500, rate: 0.044 },
      { over: 11700, rate: 0.0515 },
      { over: 13900, rate: 0.054 },
      { over: 80650, rate: 0.059 },
      { over: 215400, rate: 0.0685 },
      { over: 1077550, rate: 0.0965 },
      { over: 5000000, rate: 0.103 },
      { over: 25000000, rate: 0.109 },
    ],
  },

  /**
   * New York City resident tax, applied on top of NY State. Brackets apply to NY taxable income
   * (after the NY standard deduction). Unchanged since 2017; rates already include the 14% add-on in the NYC Admin Code.
   * Source: https://www.nyc.gov/site/finance/ (NYC resident personal income tax rates, single filer)
   */
  nyc_local: {
    name: 'New York City',
    standardDeduction: 8000,
    personalExemption: 0,
    personalCredit: 0,
    officialUrl: 'https://www.nyc.gov/site/finance/index.page',
    brackets: [
      { over: 0, rate: 0.03078 },
      { over: 12000, rate: 0.03762 },
      { over: 25000, rate: 0.03819 },
      { over: 50000, rate: 0.03876 },
    ],
  },

  /**
   * New Jersey. Source: Tax Foundation table above. Official: https://www.nj.gov/treasury/taxation/
   * No standard deduction; $1,000 personal exemption. TF lists the 5.525% bracket rounded as 5.53%.
   */
  nj: {
    name: 'New Jersey',
    standardDeduction: 0,
    personalExemption: 1000,
    personalCredit: 0,
    officialUrl: 'https://www.nj.gov/treasury/taxation/',
    brackets: [
      { over: 0, rate: 0.014 },
      { over: 20000, rate: 0.0175 },
      { over: 35000, rate: 0.035 },
      { over: 40000, rate: 0.0553 },
      { over: 75000, rate: 0.0637 },
      { over: 500000, rate: 0.0897 },
      { over: 1000000, rate: 0.1075 },
    ],
  },

  /**
   * California. Source: Tax Foundation table above. Official: https://www.ftb.ca.gov/file/personal/tax-calculator-tables-and-charts.html
   * CA has not published indexed 2026 schedules yet, so these are the latest FTB schedules (std deduction $5,540,
   * $153 personal exemption credit). Real 2026 thresholds will be slightly higher, so this slightly overstates tax.
   * Excludes the 1% mental-health surcharge over $1M and the 1.2% SDI payroll tax.
   */
  ca: {
    name: 'California',
    standardDeduction: 5540,
    personalExemption: 0,
    personalCredit: 153,
    officialUrl: 'https://www.ftb.ca.gov/file/personal/tax-calculator-tables-and-charts.html',
    note: 'Uses the latest published California schedules; 2026 indexed thresholds are not out yet.',
    brackets: [
      { over: 0, rate: 0.01 },
      { over: 11079, rate: 0.02 },
      { over: 26264, rate: 0.04 },
      { over: 41452, rate: 0.06 },
      { over: 57542, rate: 0.08 },
      { over: 72724, rate: 0.093 },
      { over: 371479, rate: 0.103 },
      { over: 445771, rate: 0.113 },
      { over: 742953, rate: 0.123 },
      { over: 1000000, rate: 0.133 },
    ],
  },

  /**
   * Illinois: flat 4.95%, $2,925 personal exemption, no standard deduction.
   * Source: Tax Foundation table above. Official: https://tax.illinois.gov/individuals/individualincometax.html
   */
  il: {
    name: 'Illinois',
    standardDeduction: 0,
    personalExemption: 2925,
    personalCredit: 0,
    officialUrl: 'https://tax.illinois.gov/individuals/individualincometax.html',
    brackets: [{ over: 0, rate: 0.0495 }],
  },

  /**
   * Massachusetts: 5% flat, 9% on income over $1,083,150 (includes the 4% millionaires surtax). $4,400 personal exemption.
   * Source: Tax Foundation table above. Official: https://www.mass.gov/guides/personal-income-tax-for-residents
   */
  ma: {
    name: 'Massachusetts',
    standardDeduction: 0,
    personalExemption: 4400,
    personalCredit: 0,
    officialUrl: 'https://www.mass.gov/guides/personal-income-tax-for-residents',
    brackets: [
      { over: 0, rate: 0.05 },
      { over: 1083150, rate: 0.09 },
    ],
  },

  /**
   * Pennsylvania: flat 3.07%, no deduction or exemption. Local earned income taxes (typically 1% in many
   * municipalities, higher in Philadelphia) are NOT included.
   * Source: Tax Foundation table above. Official: https://www.revenue.pa.gov/TaxTypes/PIT/Pages/default.aspx
   */
  pa: {
    name: 'Pennsylvania',
    standardDeduction: 0,
    personalExemption: 0,
    personalCredit: 0,
    officialUrl: 'https://www.revenue.pa.gov/TaxTypes/PIT/Pages/default.aspx',
    note: 'Excludes local earned income taxes, which add roughly 1% or more in many Pennsylvania municipalities.',
    brackets: [{ over: 0, rate: 0.0307 }],
  },

  /**
   * Georgia: flat 5.19% (HB 111 of 2025), $12,000 single standard deduction.
   * Source: Tax Foundation table above. Official: https://dor.georgia.gov/taxes/individual-income-tax
   * Georgia has a trigger schedule for further cuts; re-check this rate if the legislature acts.
   */
  ga: {
    name: 'Georgia',
    standardDeduction: 12000,
    personalExemption: 0,
    personalCredit: 0,
    officialUrl: 'https://dor.georgia.gov/taxes/individual-income-tax',
    brackets: [{ over: 0, rate: 0.0519 }],
  },

  /**
   * North Carolina: flat 3.99% (final scheduled step, effective 2026-01-01), $12,750 single standard deduction.
   * Source: Tax Foundation table above. Official: https://www.ncdor.gov/taxes-forms/individual-income-tax
   */
  nc: {
    name: 'North Carolina',
    standardDeduction: 12750,
    personalExemption: 0,
    personalCredit: 0,
    officialUrl: 'https://www.ncdor.gov/taxes-forms/individual-income-tax',
    brackets: [{ over: 0, rate: 0.0399 }],
  },

  /**
   * Colorado: flat 4.4% on federal taxable income, so the $16,100 federal standard deduction (2026, single) applies.
   * Source: Tax Foundation table above. Official: https://tax.colorado.gov/individual-income-tax
   * Colorado can temporarily lower the rate via TABOR; check each year.
   */
  co: {
    name: 'Colorado',
    standardDeduction: 16100,
    personalExemption: 0,
    personalCredit: 0,
    officialUrl: 'https://tax.colorado.gov/individual-income-tax',
    brackets: [{ over: 0, rate: 0.044 }],
  },

  /** Texas: no state income tax. Source: Tax Foundation table above. Official: https://comptroller.texas.gov/taxes/ */
  tx: {
    name: 'Texas',
    standardDeduction: 0,
    personalExemption: 0,
    personalCredit: 0,
    officialUrl: 'https://comptroller.texas.gov/taxes/',
    brackets: NO_TAX,
  },

  /** Other states / already in Florida: not modelled, treated as no change. */
  other: {
    name: 'Other',
    standardDeduction: 0,
    personalExemption: 0,
    personalCredit: 0,
    officialUrl: 'https://taxfoundation.org/data/all/state/state-income-tax-rates-2026/',
    brackets: NO_TAX,
  },
}

export interface FromOption {
  key: string
  label: string
  /** Regime keys whose tax is summed (NYC = state + city) */
  regimes: string[]
}

export const FROM_OPTIONS: FromOption[] = [
  { key: 'nyc', label: 'New York City, New York', regimes: ['ny', 'nyc_local'] },
  { key: 'ny', label: 'New York (outside NYC)', regimes: ['ny'] },
  { key: 'nj', label: 'New Jersey', regimes: ['nj'] },
  { key: 'ca', label: 'California', regimes: ['ca'] },
  { key: 'il', label: 'Illinois', regimes: ['il'] },
  { key: 'ma', label: 'Massachusetts', regimes: ['ma'] },
  { key: 'pa', label: 'Pennsylvania', regimes: ['pa'] },
  { key: 'ga', label: 'Georgia', regimes: ['ga'] },
  { key: 'nc', label: 'North Carolina', regimes: ['nc'] },
  { key: 'co', label: 'Colorado', regimes: ['co'] },
  { key: 'tx', label: 'Texas', regimes: ['tx'] },
  { key: 'other', label: 'Other / already in Florida', regimes: ['other'] },
]

export function fromLabel(key: string): string {
  return FROM_OPTIONS.find((option) => option.key === key)?.label ?? ''
}

function computeRegimeTax(gross: number, regime: TaxRegime): number {
  if (regime.brackets.length === 0) return 0
  const taxable = Math.max(0, gross - regime.standardDeduction - regime.personalExemption)
  let tax = 0
  regime.brackets.forEach((bracket, index) => {
    const next = regime.brackets[index + 1]?.over ?? Infinity
    if (taxable > bracket.over) tax += (Math.min(taxable, next) - bracket.over) * bracket.rate
  })
  return Math.max(0, tax - regime.personalCredit)
}

export interface TaxEstimate {
  /** State income tax only (NY State for NYC movers) */
  state: number
  /** NYC resident tax, 0 for everyone else */
  local: number
  total: number
  notes: string[]
}

export function estimateStateTax(grossSalary: number, fromKey: string): TaxEstimate {
  const option = FROM_OPTIONS.find((item) => item.key === fromKey)
  if (!option || !Number.isFinite(grossSalary) || grossSalary <= 0) return { state: 0, local: 0, total: 0, notes: [] }

  let state = 0
  let local = 0
  const notes: string[] = []
  for (const regimeKey of option.regimes) {
    const regime = STATE_TAX[regimeKey]
    const tax = computeRegimeTax(grossSalary, regime)
    if (regimeKey === 'nyc_local') local += tax
    else state += tax
    if (regime.note) notes.push(regime.note)
  }
  return { state: Math.round(state), local: Math.round(local), total: Math.round(state + local), notes }
}
