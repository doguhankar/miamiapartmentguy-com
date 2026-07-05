"use client"

import { Building } from "@/lib/buildings"
import { ImageCarousel } from "./image-carousel"
import { useState } from "react"
import { Star } from "lucide-react"
import { useBuildingPrice } from "@/hooks/use-building-price"

interface DesktopBuildingCardProps {
  building: Building
  isHighlighted?: boolean
  isAgentMode?: boolean
  isStarred?: boolean
  hasSavedBadge?: boolean
  onHover?: (building: Building | null) => void
  onClick?: (building: Building) => void
  onStar?: (building: Building) => void
  onViewDetails?: (building: Building) => void
}

// Amenity color mapping for badges
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

// Extract amenities from building data - using amenities array if available
function extractAmenities(building: Building): string[] {
  if ("amenities" in building && Array.isArray(building.amenities)) {
    return building.amenities as string[]
  }
  // Fallback: extract from tagline or return empty
  const tagline = building.tagline?.toLowerCase() || ""
  const amenities: string[] = []
  
  if (tagline.includes("pool")) amenities.push("pool")
  if (tagline.includes("gym")) amenities.push("gym")
  if (tagline.includes("doorman")) amenities.push("doorman")
  if (tagline.includes("rooftop")) amenities.push("rooftop")
  
  return amenities
}

// Check if building has deal badges based on concession
function getDealBadge(building: Building): string | null {
  const concession = building.concession?.toLowerCase() || ""
  if (concession.includes("2 months") || concession.includes("8 weeks")) return "🔥 2 months free"
  if (concession.includes("month free") && building.name === "Maizon") return "💰 Best value"
  return null
}

export function DesktopBuildingCard({
  building,
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
  const dealBadge = getDealBadge(building)
  
  // Fetch dynamic pricing for buildings with live data (e.g., Flow Brickell)
  const { price: dynamicPrice } = useBuildingPrice(building.id, building.priceMin)

  const handleMouseEnter = () => {
    setIsHovered(true)
    onHover?.(building)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    onHover?.(null)
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer ${
        isHighlighted || isHovered
          ? "border-[#19C6C0] shadow-lg scale-[1.02]"
          : "border-[#19C6C0] shadow-md hover:shadow-xl hover:border-[#19C6C0]"
      }`}
      style={{ background: '#0F1B30' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onClick?.(building)}
    >
      {/* Image Carousel - Full Width */}
      <div className="relative h-56 bg-[#1B2A45] overflow-hidden">
        {/* Neighborhood Badge */}
        <div className="badge absolute top-3 left-3 z-10 px-3 py-1.5 bg-[#0F1B30]/85 backdrop-blur-sm border border-[#19C6C0] text-[#F6F8F9] text-xs rounded-full" style={{ fontFamily: 'Archivo', fontWeight: 900, textTransform: 'uppercase', fontVariationSettings: "'wdth' 118", letterSpacing: '-0.01em' }}>
          {building.neighborhood}
        </div>

        {/* Deal Badge */}
        {dealBadge && (
          <div className="badge absolute top-3 right-3 z-10 px-3 py-1.5 bg-[#FFC24B] text-[#0B1220] text-xs rounded-full" style={{ fontFamily: 'Archivo', fontWeight: 900, textTransform: 'uppercase', fontVariationSettings: "'wdth' 118", letterSpacing: '-0.01em' }}>
            {dealBadge}
          </div>
        )}

        {/* Star Icon */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onStar?.(building)
          }}
          className="absolute bottom-3 right-3 z-10 p-2 rounded-full bg-[#0F1B30]/85 backdrop-blur-sm hover:bg-[#0F1B30] transition-colors shadow-md hover:shadow-lg border border-[#19C6C0]"
          aria-label={isStarred ? "Remove from list" : "Add to list"}
        >
          <Star
            className={`h-5 w-5 transition-colors ${
              isStarred
                ? "fill-[#FFC24B] text-[#FFC24B]"
                : "text-[#7E8CA0] hover:text-[#FFC24B]"
            }`}
          />
        </button>

        <ImageCarousel images={building.images} />
      </div>

      {/* Card Content */}
      <div className="p-4" style={{ background: '#0F1B30' }}>
        {/* Building Name and Price Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-black" style={{ fontFamily: 'Archivo', color: '#F6F8F9', textTransform: 'uppercase', fontVariationSettings: "'wdth' 118", letterSpacing: '-0.01em' }}>
            {building.name}
          </h3>
          <div className="text-right flex-shrink-0">
            <p className="text-xs" style={{ color: '#7E8CA0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>From</p>
            <p className="text-xl font-bold" style={{ color: '#19C6C0', fontFamily: 'Archivo' }}>
              ${dynamicPrice.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Tagline/Description */}
        {building.tagline && (
          <p className="text-sm mb-3 line-clamp-1" style={{ color: '#B8C4D4' }}>
            {building.tagline}
          </p>
        )}

        {/* Amenity Badges */}
        {amenities.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {amenities.slice(0, 4).map((amenity) => (
              <span
                key={amenity}
                className="text-xs font-medium px-2.5 py-1 rounded-full"
                style={{ background: '#1B2A45', color: '#B8C4D4' }}
              >
                {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
              </span>
            ))}
            {amenities.length > 4 && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: '#1B2A45', color: '#B8C4D4' }}>
                +{amenities.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Unit Types */}
        <div className="mb-4 flex gap-1.5 flex-wrap">
          {building.units.slice(0, 3).map((unit) => (
            <span
              key={unit}
              className="text-xs font-semibold px-2.5 py-1 rounded-full border"
              style={{ borderColor: '#19C6C0', color: '#19C6C0', background: 'transparent' }}
            >
              {unit}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,.12)' }}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails?.(building)
            }}
            className="flex-1 font-semibold py-2.5 rounded-lg transition-colors text-sm"
            style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.12)', color: '#F6F8F9' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#19C6C0'; e.currentTarget.style.color = '#19C6C0' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; e.currentTarget.style.color = '#F6F8F9' }}
          >
            View details
          </button>
          <a
            href={`sms:+14077657306?body=Hi%20Don%2C%20I%27m%20interested%20in%20${building.name}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 font-semibold py-2.5 rounded-lg transition-colors text-sm text-white"
            style={{ background: '#FF4D8D' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#E53A73' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#FF4D8D' }}
          >
            💬 Text Don
          </a>
        </div>
      </div>

    </div>
  )
}
