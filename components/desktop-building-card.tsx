"use client"

import { Building } from "@/lib/buildings"
import { useMemo, useState } from "react"
import { CommissionPill } from "@/components/commission-pill"
import { DealBadge } from "@/components/deal-badge"
import { getPriceRange } from "@/lib/price-range"
import { hasPrice, PRICING_COMING_SOON } from "@/lib/price-display"
import { lowestApproxPrice, useApproxPricing } from "@/lib/approx-pricing"
import {
  type AvailableUnit,
  unitMatchesBedroomFilter,
  unitMatchesBathroomFilter,
  unitAvailableByDate,
} from "@/lib/unit-filters"
import type { MapFilterState } from "@/components/map-filter-card"

interface DesktopBuildingCardProps {
  building: Building
  supabaseImages?: string[]
  units?: AvailableUnit[]
  mapFilters?: MapFilterState
  isHighlighted?: boolean
  isAgentMode?: boolean
  isStarred?: boolean
  hasSavedBadge?: boolean
  onHover?: (building: Building | null) => void
  onClick?: (building: Building) => void
  onStar?: (building: Building) => void
  onRemove?: (building: Building) => void
  onViewDetails?: (building: Building) => void
  dealBadgeLabel?: string | null
}

// Same "Available Month D" / "Available Now" convention used on the building
// detail page, condensed to fit a single summary line on the card.
function formatAvailability(availableDate: string | null | undefined): string {
  if (!availableDate) return "Contact for availability"
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]
  const dateOnly = availableDate.slice(0, 10)
  if (dateOnly <= todayStr) return "Avail now"
  const match = dateOnly.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return availableDate
  const [, year, month, day] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const monthName = date.toLocaleDateString("en-US", { month: "short" })
  return `Avail ${monthName} ${Number(day)}`
}

// Pick the single best unit for the active filters: cheapest match wins,
// soonest move-in date breaks a price tie.
function pickBestMatchingUnit(units: AvailableUnit[], mapFilters?: MapFilterState): AvailableUnit | null {
  if (!mapFilters) return null
  const { bedrooms, bathrooms, price, moveInDate } = mapFilters
  const hasActiveFilter = bedrooms.length > 0 || bathrooms.length > 0 || price.length > 0 || moveInDate.length > 0
  if (!hasActiveFilter || units.length === 0) return null

  const matches = units.filter((unit) => {
    if (bedrooms.length > 0 && !bedrooms.some((filter) => unitMatchesBedroomFilter(unit, filter))) return false
    if (bathrooms.length > 0 && !bathrooms.some((filter) => unitMatchesBathroomFilter(unit, filter))) return false
    if (price.length > 0) {
      if (typeof unit.price !== "number") return false
      const matchesPrice = price.some((filter) => {
        const range = getPriceRange(filter)
        return (range.min === null || unit.price! >= range.min) && (range.max === null || unit.price! <= range.max)
      })
      if (!matchesPrice) return false
    }
    if (moveInDate.length > 0 && !moveInDate.some((filter) => unitAvailableByDate(unit, filter))) return false
    return true
  })

  if (matches.length === 0) return null

  return matches.reduce((best, unit) => {
    if (typeof unit.price !== "number") return best
    if (typeof best.price !== "number") return unit
    if (unit.price < best.price) return unit
    if (unit.price > best.price) return best
    const bestDate = best.availableDate ?? best.available_date ?? ""
    const unitDate = unit.availableDate ?? unit.available_date ?? ""
    return unitDate < bestDate ? unit : best
  })
}

function extractAmenities(building: Building): string[] {
  if ("amenities" in building && Array.isArray(building.amenities)) {
    return building.amenities as string[]
  }
  const tagline = building.tagline?.toLowerCase() || ""
  const amenities: string[] = []
  if (tagline.includes("pool")) amenities.push("pool")
  if (tagline.includes("gym")) amenities.push("gym")
  if (tagline.includes("doorman")) amenities.push("doorman")
  if (tagline.includes("rooftop")) amenities.push("rooftop")
  return amenities
}

export function DesktopBuildingCard({
  building,
  supabaseImages = [],
  units = [],
  mapFilters,
  isHighlighted = false,
  isAgentMode = false,
  isStarred = false,
  hasSavedBadge = false,
  onHover,
  onClick,
  onStar,
  onRemove,
  onViewDetails,
  dealBadgeLabel,
}: DesktopBuildingCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const approxPricing = useApproxPricing()
  const approxLowest = lowestApproxPrice(approxPricing[String(building.id)])
  const cheapestOverall = useMemo(() => {
    const numericPrices = units
      .map((unit) => unit.price)
      .filter((price): price is number => hasPrice(price))
    if (numericPrices.length > 0) return Math.min(...numericPrices)
    return approxLowest ?? building.priceMin
  }, [units, building.priceMin, approxLowest])

  const bestMatch = useMemo(() => pickBestMatchingUnit(units, mapFilters), [units, mapFilters])
  const displayedPrice = bestMatch?.price ?? cheapestOverall
  const cardImage = supabaseImages.find((url) => url.trim()) ?? building.images?.[0] ?? null

  const handleMouseEnter = () => {
    setIsHovered(true)
    onHover?.(building)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    onHover?.(null)
  }

  return (
    <article onClick={() => onClick?.(building)} className="cursor-pointer">
      <div
        className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#E8ECF2] ${isHighlighted ? "ring-2 ring-[#DB2777]" : ""}`}
      >
        {cardImage ? (
          <img
            src={cardImage}
            alt={building.name}
            onError={(event) => {
              event.currentTarget.style.display = "none"
            }}
            className="block size-full object-cover"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-[#64748B]">
            No photo
          </span>
        )}
        {dealBadgeLabel ? (
          <DealBadge
            label={dealBadgeLabel}
            style={{ top: 12, left: isAgentMode && isStarred && onRemove ? 56 : 12 }}
          />
        ) : building.concession && (
          <span className="absolute left-3 top-3 max-w-[70%] truncate rounded-full bg-[#FFE3EE] px-3 py-1.5 text-xs font-bold text-[#A80F47]">
            {building.concession}
          </span>
        )}
        {isAgentMode && (
          <>
            {isStarred && onRemove && (
              <button
                type="button"
                aria-label={`Remove ${building.name} from saved list`}
                onClick={(event) => {
                  event.stopPropagation()
                  onRemove(building)
                }}
                className="absolute left-3 top-3 z-10 flex size-9 items-center justify-center rounded-full border border-white/80 bg-black/45 text-white transition-colors hover:bg-black/65"
              >
                <span aria-hidden="true" className="text-xl leading-none">×</span>
              </button>
            )}
            <button
            type="button"
            aria-label={isStarred ? `Remove ${building.name} from saved buildings` : `Save ${building.name}`}
            aria-pressed={isStarred}
            onClick={(event) => {
              event.stopPropagation()
              onStar?.(building)
            }}
            className={`absolute right-3 top-3 flex size-11 items-center justify-center rounded-full border transition-colors ${
              isStarred ? "border-[#DB2777] bg-[#DB2777]" : "border-white/80 bg-black/25"
            }`}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill={isStarred ? "white" : "none"} stroke={isStarred ? "white" : "#F8FAFC"} strokeWidth="1.8" aria-hidden="true">
              <path d="M12 21C12 21 3 14.5 3 8.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9 2.5C21 14.5 12 21 12 21z" />
            </svg>
          </button>
          </>
        )}
      </div>
      <div className="flex flex-col gap-0.5 px-0.5 pt-3">
        <div className="text-base font-semibold leading-snug text-[#0A0F1C]">
          {building.name} {isAgentMode && <CommissionPill buildingName={building.name} />}
        </div>
        <div className="text-sm text-[#6B7280]">{building.neighborhood}</div>
        <div className="mt-0.5 text-[15px] font-semibold text-[#0A0F1C]">
          {hasPrice(displayedPrice) ? (
            <>
              From ${displayedPrice.toLocaleString("en-US")}
              <span className="font-normal text-[#6B7280]">/mo</span>
            </>
          ) : (
            <span className="font-normal text-[#6B7280]">{PRICING_COMING_SOON}</span>
          )}
        </div>
      </div>
    </article>
  )
}
