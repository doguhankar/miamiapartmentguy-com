'use client'

import { useState } from 'react'

type ConcessionMode = 'months' | 'dollars'

interface FormErrors {
  [key: string]: string
}

export function RentCalculator() {
  const [monthlyRent, setMonthlyRent] = useState('3200')
  const [leaseMonths, setLeaseMonths] = useState('14')
  const [concessionMode, setConcessionMode] = useState<ConcessionMode>('months')
  const [freeMonths, setFreeMonths] = useState('2')
  const [creditDollars, setCreditDollars] = useState('0')
  const [requiredMonthlyFees, setRequiredMonthlyFees] = useState('150')
  const [nonRefundableOneTimeFees, setNonRefundableOneTimeFees] = useState('0')
  const [errors, setErrors] = useState<FormErrors>({})

  const calculate = () => {
    const rent = parseFloat(monthlyRent)
    const months = parseInt(leaseMonths, 10)
    const concession = concessionMode === 'months' ? parseFloat(freeMonths) : parseFloat(creditDollars)
    const fees = parseFloat(requiredMonthlyFees) || 0
    const oneTime = parseFloat(nonRefundableOneTimeFees) || 0

    const newErrors: FormErrors = {}
    if (!Number.isFinite(rent) || rent <= 0) newErrors.rent = 'Enter a rent amount greater than 0.'
    if (!Number.isInteger(months) || months < 1) newErrors.months = 'Enter a whole number of at least 1 month.'
    if (!Number.isFinite(concession) || concession < 0) newErrors.concession = 'Enter 0 or a positive number.'
    if (!newErrors.months && concessionMode === 'months' && concession > months) {
      newErrors.concession = 'Free months cannot exceed the lease length.'
    }
    if (!newErrors.rent && !newErrors.months && concessionMode === 'dollars' && concession > rent * months) {
      newErrors.concession = 'Credit cannot exceed total base rent.'
    }

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return null

    const gross = rent * months
    const credit = concessionMode === 'months' ? rent * concession : concession
    const net = gross - credit
    const netMonthly = net / months
    const recurring = netMonthly + fees
    const total = net + fees * months + oneTime
    const average = total / months

    return { gross, credit, net, netMonthly, recurring, total, average }
  }

  const results = calculate()
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="mb-calc">
      <h3>Run the numbers on your lease</h3>

      <div className="mb-calc-grid">
        <div className="mb-calc-field">
          <label htmlFor="rent">Monthly base rent ($)</label>
          <input id="rent" type="number" min="0" step="0.01" value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)} />
          {errors.rent && <div className="mb-calc-error">{errors.rent}</div>}
        </div>

        <div className="mb-calc-field">
          <label htmlFor="months">Lease length (whole months)</label>
          <input id="months" type="number" min="1" step="1" value={leaseMonths} onChange={e => setLeaseMonths(e.target.value)} />
          {errors.months && <div className="mb-calc-error">{errors.months}</div>}
        </div>

        <div className="mb-calc-field">
          <label htmlFor="mode">Concession type</label>
          <select id="mode" value={concessionMode} onChange={e => setConcessionMode(e.target.value as ConcessionMode)}>
            <option value="months">Free months</option>
            <option value="dollars">Dollar credit</option>
          </select>
        </div>

        <div className="mb-calc-field">
          <label htmlFor="concession">{concessionMode === 'months' ? 'Free months' : 'Credit amount ($)'}</label>
          <input
            id="concession"
            type="number"
            min="0"
            step={concessionMode === 'months' ? '0.5' : '0.01'}
            value={concessionMode === 'months' ? freeMonths : creditDollars}
            onChange={e => concessionMode === 'months' ? setFreeMonths(e.target.value) : setCreditDollars(e.target.value)}
          />
          {errors.concession && <div className="mb-calc-error">{errors.concession}</div>}
        </div>

        <div className="mb-calc-field">
          <label htmlFor="fees">Required monthly fees ($)</label>
          <input id="fees" type="number" min="0" step="0.01" value={requiredMonthlyFees} onChange={e => setRequiredMonthlyFees(e.target.value)} />
        </div>

        <div className="mb-calc-field">
          <label htmlFor="oneTime">Nonrefundable one-time fees ($)</label>
          <input id="oneTime" type="number" min="0" step="0.01" value={nonRefundableOneTimeFees} onChange={e => setNonRefundableOneTimeFees(e.target.value)} />
        </div>
      </div>

      {results ? (
        <div className="mb-calc-results">
          <div className="mb-calc-result">
            <div className="mb-rlabel">Gross base rent</div>
            <div className="mb-rvalue">${fmt(results.gross)}</div>
          </div>
          <div className="mb-calc-result credit">
            <div className="mb-rlabel">Total concession</div>
            <div className="mb-rvalue">−${fmt(results.credit)}</div>
          </div>
          <div className="mb-calc-result hero">
            <div className="mb-rlabel">Net effective / mo</div>
            <div className="mb-rvalue">${fmt(results.netMonthly)}</div>
          </div>
          <div className="mb-calc-result hero">
            <div className="mb-rlabel">Avg monthly w/ fees</div>
            <div className="mb-rvalue">${fmt(results.recurring)}</div>
          </div>
        </div>
      ) : (
        <div className="mb-calc-error">Fix the highlighted fields above to see results.</div>
      )}

      <div className="mb-calc-note">
        These are lease-term averages for fixed base rent and entered costs, not a billing schedule or a quote.
        Credits may be applied in specific months. Utilities, optional expenses and variable charges are excluded
        unless entered; refundable deposits are excluded from these totals. Confirm timing, eligibility and
        obligations in the written offer and lease.
      </div>
    </div>
  )
}
