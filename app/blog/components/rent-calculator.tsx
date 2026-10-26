'use client'

import { useState } from 'react'

export function RentCalculator() {
  const [monthlyRent, setMonthlyRent] = useState(3200)
  const [leaseMonths, setLeaseMonths] = useState(14)
  const [concessionMode, setConcessionMode] = useState<'months' | 'dollars'>('months')
  const [freeMonths, setFreeMonths] = useState(2)
  const [creditDollars, setCreditDollars] = useState(0)
  const [requiredMonthlyFees, setRequiredMonthlyFees] = useState(0)
  const [nonRefundableOneTimeFees, setNonRefundableOneTimeFees] = useState(0)

  const calculate = () => {
    const grossBaseTotal = monthlyRent * leaseMonths
    const concessionTotal =
      concessionMode === 'months' ? monthlyRent * freeMonths : creditDollars
    const netBaseTotal = grossBaseTotal - concessionTotal
    const recurringTotal = netBaseTotal + requiredMonthlyFees * leaseMonths
    const leaseCostIncludingOneTimeFees = recurringTotal + nonRefundableOneTimeFees

    return {
      grossBaseTotal: Math.round(grossBaseTotal * 100) / 100,
      concessionTotal: Math.round(concessionTotal * 100) / 100,
      netBaseTotal: Math.round(netBaseTotal * 100) / 100,
      netEffectiveBaseRent: Math.round((netBaseTotal / leaseMonths) * 100) / 100,
      averageRecurringCost: Math.round((recurringTotal / leaseMonths) * 100) / 100,
      leaseCostIncludingOneTimeFees: Math.round(leaseCostIncludingOneTimeFees * 100) / 100,
      averageCostIncludingOneTimeFees: Math.round(
        (leaseCostIncludingOneTimeFees / leaseMonths) * 100
      ) / 100,
    }
  }

  const results = calculate()

  return (
    <div className="bg-gray-50 rounded-lg p-6 my-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Rent Calculator</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Base Rent
          </label>
          <input
            type="number"
            value={monthlyRent}
            onChange={e => setMonthlyRent(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lease Length (months)
          </label>
          <input
            type="number"
            value={leaseMonths}
            onChange={e => setLeaseMonths(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Concession Type
          </label>
          <select
            value={concessionMode}
            onChange={e => setConcessionMode(e.target.value as 'months' | 'dollars')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="months">Free Months</option>
            <option value="dollars">Dollar Credit</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {concessionMode === 'months' ? 'Free Months' : 'Credit Amount ($)'}
          </label>
          <input
            type="number"
            value={concessionMode === 'months' ? freeMonths : creditDollars}
            onChange={e =>
              concessionMode === 'months'
                ? setFreeMonths(Number(e.target.value))
                : setCreditDollars(Number(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Required Monthly Fees ($)
          </label>
          <input
            type="number"
            value={requiredMonthlyFees}
            onChange={e => setRequiredMonthlyFees(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Non-Refundable One-Time Fees ($)
          </label>
          <input
            type="number"
            value={nonRefundableOneTimeFees}
            onChange={e => setNonRefundableOneTimeFees(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="border-t border-gray-300 pt-6">
        <h4 className="font-semibold text-gray-900 mb-4">Results</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">Base Rent (Gross)</p>
            <p className="text-lg font-semibold text-gray-900">
              ${results.grossBaseTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">Concession</p>
            <p className="text-lg font-semibold text-blue-600">
              -${results.concessionTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">Net Base Rent</p>
            <p className="text-lg font-semibold text-gray-900">
              ${results.netBaseTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="col-span-2 md:col-span-1 pt-2 border-t border-gray-200 md:border-t-0">
            <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">Net Effective Monthly</p>
            <p className="text-lg font-semibold text-gray-900">
              ${results.netEffectiveBaseRent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="col-span-2 md:col-span-1 pt-2 border-t border-gray-200 md:border-t-0">
            <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">Avg Monthly (w/ fees)</p>
            <p className="text-lg font-semibold text-gray-900">
              ${results.averageRecurringCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="col-span-2 md:col-span-1 pt-2 border-t border-gray-200 md:border-t-0">
            <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">Avg w/ One-Time Fees</p>
            <p className="text-lg font-semibold text-gray-900">
              ${results.averageCostIncludingOneTimeFees.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-gray-300 text-xs text-gray-500 space-y-2">
        <p>
          <strong>Note:</strong> These are lease-term averages for fixed base rent and entered costs, not
          a monthly billing schedule.
        </p>
        <p>
          Actual credits, qualification criteria, fee timing and payment obligations depend on the written
          offer and lease.
        </p>
        <p>Utilities and optional costs are excluded unless entered.</p>
      </div>
    </div>
  )
}
