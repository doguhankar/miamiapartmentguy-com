'use client'

import { useMemo, useState } from 'react'

export function MonthsFreeCalculator() {
  const [rent, setRent] = useState('3200')
  const [months, setMonths] = useState('14')
  const [free, setFree] = useState('2')
  const [fees, setFees] = useState('150')
  const result = useMemo(() => {
    const base = Number(rent) || 0
    const term = Math.max(1, Number(months) || 1)
    const creditMonths = Math.max(0, Number(free) || 0)
    const requiredFees = Number(fees) || 0
    return ((base * Math.max(0, term - creditMonths)) / term) + requiredFees
  }, [rent, months, free, fees])
  return <div className="blog-calculator" aria-label="Months free rent calculator">
    <p className="blog-kicker">INTERACTIVE EXAMPLE</p>
    <h3>Estimate recurring effective cost</h3>
    <div className="calculator-fields">
      <label>Base rent<input inputMode="decimal" value={rent} onChange={(event) => setRent(event.target.value)} /></label>
      <label>Lease months<input inputMode="numeric" value={months} onChange={(event) => setMonths(event.target.value)} /></label>
      <label>Free months<input inputMode="decimal" value={free} onChange={(event) => setFree(event.target.value)} /></label>
      <label>Required monthly fees<input inputMode="decimal" value={fees} onChange={(event) => setFees(event.target.value)} /></label>
    </div>
    <p className="calculator-result"><strong>${result.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong> estimated recurring average</p>
    <p className="calculator-note">Illustrative only. Confirm the written offer, payment schedule, and required fees before applying.</p>
  </div>
}
