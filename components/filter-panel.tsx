"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface FilterPanelProps {
  filters: {
    price: string
    units: string[]
    income: string
    credit: string
    guarantorOnly: boolean
    holdDays: string
  }
  setFilters: (filters: any) => void
}

export function FilterPanel({ filters, setFilters }: FilterPanelProps) {
  const handlePriceChange = (value: string) => {
    setFilters({ ...filters, price: value })
  }

  const handleUnitsChange = (unit: string, checked: boolean) => {
    const newUnits = checked ? [...filters.units, unit] : filters.units.filter((u) => u !== unit)
    setFilters({ ...filters, units: newUnits })
  }

  const handleIncomeChange = (value: string) => {
    setFilters({ ...filters, income: value })
  }

  const handleCreditChange = (value: string) => {
    setFilters({ ...filters, credit: value })
  }

  const handleHoldChange = (value: string) => {
    setFilters({ ...filters, holdDays: value })
  }

  return (
    <div className="hidden w-80 border-r border-border bg-card overflow-y-auto p-6 lg:block">
      <h2 className="mb-6 text-lg font-semibold text-foreground">Filters</h2>

      {/* Pricing */}
      <div className="mb-6">
        <label className="mb-3 block text-sm font-medium text-foreground">Pricing</label>
        <RadioGroup value={filters.price} onValueChange={handlePriceChange}>
          {["$", "$$", "$$$"].map((price) => (
            <div key={price} className="flex items-center gap-3 mb-2">
              <RadioGroupItem value={price} id={`price-${price}`} />
              <Label htmlFor={`price-${price}`} className="text-sm text-foreground cursor-pointer">
                {price}
              </Label>
            </div>
          ))}
          <div className="flex items-center gap-3 mb-2">
            <RadioGroupItem value="all" id="price-all" />
            <Label htmlFor="price-all" className="text-sm text-foreground cursor-pointer">
              All
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Unit Types */}
      <div className="mb-6">
        <label className="mb-3 block text-sm font-medium text-foreground">Unit Type</label>
        <div className="space-y-2">
          {["Studio", "1B", "2B", "3B"].map((unit) => (
            <div key={unit} className="flex items-center gap-3">
              <Checkbox
                id={`unit-${unit}`}
                checked={filters.units.includes(unit)}
                onCheckedChange={(checked) => handleUnitsChange(unit, checked === true)}
              />
              <Label htmlFor={`unit-${unit}`} className="text-sm text-foreground cursor-pointer">
                {unit}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Income Requirements */}
      <div className="mb-6">
        <label className="mb-3 block text-sm font-medium text-foreground">Income Requirement</label>
        <RadioGroup value={filters.income} onValueChange={handleIncomeChange}>
          {["2.5x", "3x"].map((income) => (
            <div key={income} className="flex items-center gap-3 mb-2">
              <RadioGroupItem value={income} id={`income-${income}`} />
              <Label htmlFor={`income-${income}`} className="text-sm text-foreground cursor-pointer">
                {income}
              </Label>
            </div>
          ))}
          <div className="flex items-center gap-3 mb-2">
            <RadioGroupItem value="all" id="income-all" />
            <Label htmlFor="income-all" className="text-sm text-foreground cursor-pointer">
              All
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Credit Requirements */}
      <div className="mb-6">
        <label className="mb-3 block text-sm font-medium text-foreground">Credit Requirement</label>
        <RadioGroup value={filters.credit} onValueChange={handleCreditChange}>
          {[">650", ">600"].map((credit) => (
            <div key={credit} className="flex items-center gap-3 mb-2">
              <RadioGroupItem value={credit} id={`credit-${credit}`} />
              <Label htmlFor={`credit-${credit}`} className="text-sm text-foreground cursor-pointer">
                {credit}
              </Label>
            </div>
          ))}
          <div className="flex items-center gap-3 mb-2">
            <RadioGroupItem value="all" id="credit-all" />
            <Label htmlFor="credit-all" className="text-sm text-foreground cursor-pointer">
              All
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Guarantor */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Checkbox
            id="guarantor"
            checked={filters.guarantorOnly}
            onCheckedChange={(checked) => setFilters({ ...filters, guarantorOnly: checked === true })}
          />
          <Label htmlFor="guarantor" className="text-sm font-medium text-foreground cursor-pointer">
            Works w/ Guarantors
          </Label>
        </div>
      </div>

      {/* Hold Duration */}
      <div className="mb-6">
        <label className="mb-3 block text-sm font-medium text-foreground">Hold Duration</label>
        <RadioGroup value={filters.holdDays} onValueChange={handleHoldChange}>
          {[14, 30, 60, 90].map((days) => (
            <div key={days} className="flex items-center gap-3 mb-2">
              <RadioGroupItem value={String(days)} id={`hold-${days}`} />
              <Label htmlFor={`hold-${days}`} className="text-sm text-foreground cursor-pointer">
                {days} days
              </Label>
            </div>
          ))}
          <div className="flex items-center gap-3 mb-2">
            <RadioGroupItem value="all" id="hold-all" />
            <Label htmlFor="hold-all" className="text-sm text-foreground cursor-pointer">
              All
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  )
}
