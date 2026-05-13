"use client"

interface FilterSidebarProps {
  selectedPrice: string
  setSelectedPrice: (price: string) => void
  selectedUnits: string[]
  setSelectedUnits: (units: string[]) => void
  selectedIncome: string
  setSelectedIncome: (income: string) => void
  selectedCredit: string
  setSelectedCredit: (credit: string) => void
  guarantorOnly: boolean
  setGuarantorOnly: (value: boolean) => void
  selectedHold: string
  setSelectedHold: (hold: string) => void
}

export function FilterSidebar({
  selectedPrice,
  setSelectedPrice,
  selectedUnits,
  setSelectedUnits,
  selectedIncome,
  setSelectedIncome,
  selectedCredit,
  setSelectedCredit,
  guarantorOnly,
  setGuarantorOnly,
  selectedHold,
  setSelectedHold,
}: FilterSidebarProps) {
  const toggleUnit = (unit: string) => {
    setSelectedUnits(
      selectedUnits.includes(unit)
        ? selectedUnits.filter((u) => u !== unit)
        : [...selectedUnits, unit]
    )
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Filters</h2>

        {/* Price Tier */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-3">Price Tier</label>
          <div className="space-y-2">
            {["$", "$$", "$$$"].map((price) => (
              <label key={price} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="price"
                  value={price}
                  checked={selectedPrice === price}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">{price}</span>
              </label>
            ))}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="price"
                value="all"
                checked={selectedPrice === "all"}
                onChange={(e) => setSelectedPrice(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">All</span>
            </label>
          </div>
        </div>

        {/* Unit Types */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-3">Unit Types</label>
          <div className="space-y-2">
            {["Studio", "1B", "2B", "3B"].map((unit) => (
              <label key={unit} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUnits.includes(unit)}
                  onChange={() => toggleUnit(unit)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">{unit}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Income Requirement */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-3">Income Requirement</label>
          <div className="space-y-2">
            {["2.5x", "3x"].map((income) => (
              <label key={income} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="income"
                  value={income}
                  checked={selectedIncome === income}
                  onChange={(e) => setSelectedIncome(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">{income}</span>
              </label>
            ))}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="income"
                value="all"
                checked={selectedIncome === "all"}
                onChange={(e) => setSelectedIncome(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">All</span>
            </label>
          </div>
        </div>

        {/* Credit Requirement */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-3">Credit Requirement</label>
          <div className="space-y-2">
            {[">650", ">600"].map((credit) => (
              <label key={credit} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="credit"
                  value={credit}
                  checked={selectedCredit === credit}
                  onChange={(e) => setSelectedCredit(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">{credit}</span>
              </label>
            ))}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="credit"
                value="all"
                checked={selectedCredit === "all"}
                onChange={(e) => setSelectedCredit(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">All</span>
            </label>
          </div>
        </div>

        {/* Guarantor */}
        <div className="mb-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={guarantorOnly}
              onChange={(e) => setGuarantorOnly(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">Works w/ Guarantors</span>
          </label>
        </div>

        {/* Hold Duration */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-3">Hold Duration</label>
          <div className="space-y-2">
            {[14, 30, 60, 90].map((days) => (
              <label key={days} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="hold"
                  value={String(days)}
                  checked={selectedHold === String(days)}
                  onChange={(e) => setSelectedHold(e.target.value)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">{days} days</span>
              </label>
            ))}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="hold"
                value="all"
                checked={selectedHold === "all"}
                onChange={(e) => setSelectedHold(e.target.value)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700">All</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
