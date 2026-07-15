"use client"

import { Building } from "@/lib/buildings"
import { useState } from "react"

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
      className={`flex gap-3 rounded-lg overflow-hidden border transition-all duration-200 cursor-pointer p-3 ${
        isHighlighted || isHovered
          ? "border-[#FF4D8D] shadow-lg"
          : "border-[rgba(255,255,255,.12)] hover:border-[#FF4D8D]"
      }`}
      style={{ background: '#0F1B30' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onClick?.(building)}
    >
      {/* Image - Left (96px square) */}
      <div className="relative flex-shrink-0" style={{ width: '96px', height: '96px' }}>
        <div className="relative w-full h-full bg-[#1B2A45] rounded-lg overflow-hidden">
          {building.images && building.images.length > 0 ? (
            <>
              <img
                src={building.images[0]}
                alt={building.name}
                className="w-full h-full object-cover"
              />
              {/* Neighborhood Badge - Top Left */}
              <div className="absolute top-1 left-1 z-10 px-2 py-0.5 bg-[#0B1220]/90 text-[#F6F8F9] text-xs rounded" style={{ fontFamily: 'Archivo', fontWeight: 900, textTransform: 'uppercase', fontVariationSettings: "'wdth' 118", letterSpacing: '-0.01em' }}>
                {building.neighborhood}
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1B2A45, #0F1B30)' }}>
              <div style={{ fontSize: '24px' }}>📷</div>
            </div>
          )}
        </div>
      </div>

      {/* Content - Right */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        {/* Top: Building Name + Description */}
        <div className="min-w-0">
          <h3 className="text-sm font-black truncate" style={{ fontFamily: 'Archivo', color: '#F6F8F9', textTransform: 'uppercase', fontVariationSettings: "'wdth' 118", letterSpacing: '-0.01em' }}>
            {building.name}
          </h3>
          {building.tagline && (
            <p className="text-xs line-clamp-1" style={{ color: '#B8C4D4' }}>
              {building.tagline}
            </p>
          )}
        </div>

        {/* Bottom: Bedroom Chips + Text Don Button (ONE ROW) */}
        <div className="flex items-center gap-2 pt-2">
          {/* Bedroom Chips - Left Aligned */}
          <div className="flex gap-1 flex-wrap">
            {building.units.slice(0, 2).map((unit) => (
              <span
                key={unit}
                className="text-xs font-semibold px-2 py-0.5 rounded border flex-shrink-0"
                style={{ borderColor: '#19C6C0', color: '#19C6C0', background: 'transparent' }}
              >
                {unit}
              </span>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Text Don Button - Right Aligned */}
          <a
            href={`sms:+14077657306?body=Hi%20Don%2C%20I%27m%20interested%20in%20${building.name}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-shrink-0 font-semibold py-1.5 px-2.5 rounded text-xs text-white transition-colors whitespace-nowrap"
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
