"use client"

import { Building } from "@/lib/buildings"
import { ImageCarousel } from "./image-carousel"
import { SaveHeartButton } from "./save-heart-button"
import { useState } from "react"
import { Star } from "lucide-react"
import { useBuildingPrice } from "@/hooks/use-building-price"
import { CommissionPill } from "@/components/commission-pill"

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
    <div className="relative">
      <div
        className={`rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer group ${
          isHighlighted || isHovered
            ? "border-blue-500 shadow-lg scale-[1.02]"
            : "border-gray-200 shadow-md hover:shadow-xl"
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          onClick?.(building);
          onViewDetails?.(building);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.(building);
            onViewDetails?.(building);
          }
        }}
      >
        <div className="relative h-56 bg-gray-100 overflow-hidden">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onStar?.(building)
            }}
            className="absolute top-2 right-2 z-10 p-2 rounded-full bg-white/90 hover:bg-white transition-colors shadow-md hover:shadow-lg"
            aria-label={isStarred ? "Remove from list" : "Add to list"}
          >
            <Star
              className={`h-5 w-5 transition-colors ${
                isStarred
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-400 hover:text-yellow-400"
              }`}
            />
          </button>
          {hasSavedBadge && (
            <div className="absolute top-2 left-2 z-10 px-2.5 py-1 bg-green-500 text-white text-xs font-semibold rounded">
              Saved
            </div>
          )}
          <ImageCarousel images={building.images} />
        </div>
        <div className="p-4 bg-white">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-full">
              {building.neighborhood}
            </span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 flex items-center gap-2 flex-wrap">
            <span>{building.name}</span>
            <span onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
              <CommissionPill buildingName={building.name} />
            </span>
          </h3>
          {building.tagline && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-1">
              {building.tagline}
            </p>
          )}
          <div className="mb-3 pb-3 border-b border-gray-100">
            <p className="text-2xl font-bold text-blue-600">
              From ${dynamicPrice.toLocaleString()}
            </p>
          </div>
          {amenities.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {amenities.slice(0, 4).map((amenity) => {
                const colors = AMENITY_COLORS[amenity.toLowerCase()] || {
                  bg: "bg-gray-100",
                  text: "text-gray-700",
                }
                return (
                  <span
                    key={amenity}
                    className={`text-xs font-medium px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}
                  >
                    {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                  </span>
                )
              })}
              {amenities.length > 4 && (
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                  +{amenities.length - 4}
                </span>
              )}
            </div>
          )}
          <div className="mb-4 flex gap-1 flex-wrap">
            {building.units.slice(0, 3).map((unit) => (
              <span
                key={unit}
                className="text-xs font-semibold px-2 py-1 bg-gray-50 text-gray-700 rounded border border-gray-200"
              >
                {unit}
              </span>
            ))}
          </div>
          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onViewDetails?.(building)
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              View Details
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
              }}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              Text Don
            </button>
          </div>
        </div>
      </div>
      <SaveHeartButton
        buildingId={building.id}
        className="absolute top-2 left-2 z-20"
      />
    </div>
  )
}
