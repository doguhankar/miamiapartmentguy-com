"use client"

import { Building } from "@/lib/buildings"
import { ImageCarousel } from "./image-carousel"
import { SaveHeartButton } from "./save-heart-button"
import { useMemo, useState } from "react"
import { Star } from "lucide-react"
import { CommissionPill } from "@/components/commission-pill"
import { getPriceRange } from "@/lib/price-range"
import {
  type AvailableUnit,
  unitMatchesBedroomFilter,
  unitMatchesBathroomFilter,
  unitAvailableByDate,
} from "@/lib/unit-filters"
import type { MapFilterState } from "@/components/map-filter-card"

interface DesktopBuildingCardProps {
  building: Building
  units?: AvailableUnit[]
  mapFilters?: MapFilterState
  isHighlighted?: boolean
  isAgentMode?: boolean
  isStarred?: boolean
  hasSavedBadge?: boolean
  onHover?: (building: Building | null) => void
  onClick?: (building: Building) => void
  onStar?: (building: Building) => void
  onViewDetails?: (building: Building) => void
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

const AMENITY_COLORS: Record<string, { bg: string; text: string }> = {
  pool: { bg: "bg-blue-100", text: "text-blue-700" },
  gym: { bg: "bg-green-100", text: "text-green-700" },
  doorman: { bg: "bg-purple-100", text: "text-purple-700" },
  lounge: { bg: "bg-pink-100", text: "text-pink-700" },
  rooftop: { bg: "bg-orange-100", text: "text-orange-700" },
  concierge: { bg: "bg-indigo-100", text: "text-indigo-700" },
  parking: { bg: "bg-yellow-100", text: "text-yellow-700" },
  furnished: { bg: "bg-teal-100", text: "text-teal-700" },
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
  units = [],
  mapFilters,
  isHighlighted = false,
  isAgentMode = false,
  isStarred = false,
  hasSavedBadge = false,
  onHover,
  onClick,
  onStar,
  onViewDetails,
}: DesktopBuildingCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const amenities = extractAmenities(building)

  // Default Studio/1Bed/2Bed starting prices, derived from the same live
  // pricing data the parent already fetched once for every building — no
  // per-card fetch needed.
  const { studioMin, oneBedMin, twoBedMin } = useMemo(() => {
    let studio: number | null = null
    let oneBed: number | null = null
    let twoBed: number | null = null
    for (const unit of units) {
      if (typeof unit.price !== "number") continue
      if (unit.beds === 0) studio = studio === null ? unit.price : Math.min(studio, unit.price)
      else if (unit.beds === 1) oneBed = oneBed === null ? unit.price : Math.min(oneBed, unit.price)
      else if (unit.beds === 2) twoBed = twoBed === null ? unit.price : Math.min(twoBed, unit.price)
    }
    return { studioMin: studio, oneBedMin: oneBed, twoBedMin: twoBed }
  }, [units])
  const studioPrice = studioMin ?? building.priceMin
  const oneBedPrice = oneBedMin ?? building.priceMin
  const twoBedPrice = twoBedMin ?? building.priceMin

  // When a bedroom/bathroom/price/move-in filter is active, swap the static
  // 3-price row for the single unit that actually matches — otherwise a
  // filtered building can show a price/bed combo that isn't real for it.
  const bestMatch = useMemo(() => pickBestMatchingUnit(units, mapFilters), [units, mapFilters])

  const handleMouseEnter = () => {
    setIsHovered(true)
    onHover?.(building)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    onHover?.(null)
  }

  return (
    <div onClick={() => onClick?.(building)} style={{background:'white', border:'0.5px solid #e5e7eb', borderRadius:12, padding:14, marginBottom:12, cursor:'pointer'}}>
      <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8}}>
        <div>
          <div style={{fontWeight:600, fontSize:15, color:'#111', marginBottom:2}}>{building.name} {isAgentMode && <CommissionPill buildingName={building.name} />}</div>
          <div style={{fontSize:11, color:'#9aa5b8'}}>{building.address}</div>
        </div>
        <span style={{color:'#FF4D8D', fontSize:18, cursor:'pointer'}}>♥</span>
      </div>
      <div style={{display:'flex', gap:12}}>
        <div style={{position:'relative', width:150, height:115, flexShrink:0, borderRadius:8, overflow:'hidden'}}>
          <img src={building.images?.[0]} alt={building.name} style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}} />
          <div style={{position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,0.55)', padding:'4px 8px', fontSize:9, color:'#fff'}}>Videos • Virtual tours</div>
        </div>
        <div style={{flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
          <div>
            {bestMatch ? (
              <div style={{marginBottom:6}}>
                <div style={{fontSize:13, fontWeight:600, color:'#19C6C0'}}>
                  Unit {bestMatch.floorPlanType ?? '—'} · ${bestMatch.price?.toLocaleString()} · {formatAvailability(bestMatch.availableDate ?? bestMatch.available_date)}
                </div>
              </div>
            ) : (
              <div style={{display:'flex', marginBottom:6}}>
                <div style={{paddingRight:12, marginRight:12, borderRight:'0.5px solid #e5e7eb'}}><div style={{fontSize:13, fontWeight:500, color:'#19C6C0'}}>{studioPrice}+</div><div style={{fontSize:10, color:'#9aa5b8'}}>Studio</div></div>
                <div style={{paddingRight:12, marginRight:12, borderRight:'0.5px solid #e5e7eb'}}><div style={{fontSize:13, fontWeight:500, color:'#19C6C0'}}>{oneBedPrice}+</div><div style={{fontSize:10, color:'#9aa5b8'}}>1 Bed</div></div>
                <div><div style={{fontSize:13, fontWeight:500, color:'#19C6C0'}}>{twoBedPrice}+</div><div style={{fontSize:10, color:'#9aa5b8'}}>2 Beds</div></div>
              </div>
            )}
            <span style={{background:'#fef3cd', color:'#92660a', fontSize:10, fontWeight:500, padding:'2px 7px', borderRadius:5, marginBottom:6, display:'inline-block'}}>SPECIALS</span>
            <div style={{fontSize:11, color:'#6b7280', lineHeight:1.4, marginBottom:8}}>{building.amenities.join(', ')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
