"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Star, Phone } from "lucide-react"
import { Building } from "@/lib/buildings"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { copyToClipboard, showToast } from "@/lib/toast-utils"

interface BuildingDetailViewProps {
  building: Building
  onBack: () => void
}

// Mock unit data - in production this would come from the building data or API
const mockUnits = [
  { id: "1", type: "Studio", sqft: 450, floor: 5, price: 2790 },
  { id: "2", type: "Studio", sqft: 480, floor: 12, price: 2950 },
  { id: "3", type: "1 Bedroom", sqft: 750, floor: 8, price: 3500 },
  { id: "4", type: "1 Bedroom", sqft: 780, floor: 15, price: 3650 },
  { id: "5", type: "2 Bedroom", sqft: 1200, floor: 3, price: 5200 },
  { id: "6", type: "2 Bedroom", sqft: 1250, floor: 20, price: 5400 },
  { id: "7", type: "3 Bedroom", sqft: 1800, floor: 18, price: 8500 },
]

const amenityIcons: Record<string, string> = {
  Pool: "🏊",
  Gym: "💪",
  Concierge: "🎩",
  Parking: "🅿️",
  Rooftop: "🏢",
  Lounge: "🛋️",
  "Dog Wash": "🐕",
  "Yoga Studio": "🧘",
  Spa: "🧖",
  "Bar Lounge": "🍸",
  Billiards: "🎱",
  Valet: "🚗",
  "Pet-Friendly": "🐾",
  Coworking: "💻",
}

export function BuildingDetailView({ building, onBack }: BuildingDetailViewProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [starredUnits, setStarredUnits] = useState<Set<string>>(new Set())
  const [displayedUnits, setDisplayedUnits] = useState(7)

  const toggleUnitStar = (unitId: string) => {
    const newStarred = new Set(starredUnits)
    if (newStarred.has(unitId)) {
      newStarred.delete(unitId)
    } else {
      newStarred.add(unitId)
    }
    setStarredUnits(newStarred)
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((i) => (i + 1) % building.images.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((i) => (i - 1 + building.images.length) % building.images.length)
  }

  const handleSaveStarred = async () => {
    if (starredUnits.size === 0) return

    try {
      const starredUnitIds = Array.from(starredUnits)

      // Call API to save the list (with building ID and unit IDs)
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          buildingIds: [building.id],
          unitIds: starredUnitIds 
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save list')
      }

      const data = await response.json()
      const shareUrl = data.shareUrl

      // Copy to clipboard
      await copyToClipboard(shareUrl, "Link copied to clipboard")
    } catch (error) {
      console.error("[v0] Error saving starred units:", error)
      showToast("Failed to save starred units", { type: "error" })
    }
  }

  const visibleUnits = mockUnits.slice(0, displayedUnits)
  const dealPercentage = building.concession.match(/(\d+)%/) ? building.concession.match(/(\d+)%/)?.[1] : "50"

  return (
    <div className="fixed inset-0 bg-white flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back to search</span>
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{building.name}</h1>
        <div className="w-24" /> {/* Spacer for balance */}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - 45% */}
        <div className="w-[45%] border-r border-gray-200 flex flex-col">
          <ScrollArea className="flex-1">
            {/* Photo Carousel */}
            <div className="px-6 py-6">
              <div className="relative h-[300px] bg-gray-100 rounded-lg overflow-hidden group">
                <img
                  src={building.images[currentPhotoIndex]}
                  alt={`${building.name} - Photo ${currentPhotoIndex + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Carousel Controls */}
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white hover:bg-black/50 transition-colors"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                {/* View All Button */}
                <button className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 text-white text-sm font-medium rounded hover:bg-black/70 transition-colors">
                  VIEW ALL {building.images.length}
                </button>
              </div>

              {/* Building Details */}
              <div className="mt-6 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{building.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{building.address}</p>
                </div>

                {/* Deal Badges */}
                <div className="flex gap-2">
                  <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">DEALS</Badge>
                  <Badge className="bg-gray-200 text-gray-700 hover:bg-gray-200">{dealPercentage}% OFF</Badge>
                </div>

                {/* Deal Info Card */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                  <p className="text-sm font-bold text-gray-900">{building.concession}</p>
                  <p className="text-xs text-gray-500 mt-2">Updated now • Expires in 30 days</p>
                </div>

                {/* Phone Section */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Phone</p>
                  <a href="tel:3055550123" className="text-sm font-medium text-blue-600 hover:text-blue-700 mt-1">
                    (305) 555-0123
                  </a>
                </div>

                {/* Management Section */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Management</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">Sterling Management</p>
                </div>

                {/* Amenities Section */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-3">Amenities</p>
                  <div className="grid grid-cols-2 gap-2">
                    {building.amenities.slice(0, 4).map((amenity) => (
                      <div key={amenity} className="flex items-center gap-2 text-sm">
                        <span className="text-lg">{amenityIcons[amenity] || "•"}</span>
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements Section */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-2">Requirements</p>
                  <p className="text-sm text-gray-700">{building.incomeReq}x income • {'>'}{building.creditReq} credit score</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Right Column - 55% */}
        <div className="w-[55%] flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-base font-bold text-gray-900">Available units ({mockUnits.length})</h3>
          </div>

          {/* Units Grid */}
          <ScrollArea className="flex-1">
            <div className="p-6 grid grid-cols-2 gap-4">
              {visibleUnits.map((unit) => {
                const isStarred = starredUnits.has(unit.id)
                return (
                  <div
                    key={unit.id}
                    className={`relative p-3 border rounded-lg transition-all ${
                      isStarred
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    {/* Star Button */}
                    <button
                      onClick={() => toggleUnitStar(unit.id)}
                      className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded transition-colors"
                      aria-label={isStarred ? "Unstar unit" : "Star unit"}
                    >
                      <Star
                        className={`h-5 w-5 ${
                          isStarred
                            ? "fill-blue-500 text-blue-500"
                            : "text-gray-300 hover:text-gray-400"
                        }`}
                      />
                    </button>

                    {/* Unit Info */}
                    <div className="pr-8">
                      <p className="text-sm font-bold text-gray-900">{unit.type}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {unit.sqft} sqft • Floor {unit.floor}
                      </p>
                      <p className={`text-sm font-bold mt-2 ${isStarred ? "text-blue-600" : "text-blue-600"}`}>
                        ${unit.price.toLocaleString()}/mo
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Load More Button */}
            {displayedUnits < mockUnits.length && (
              <div className="px-6 pb-6">
                <button
                  onClick={() => setDisplayedUnits(Math.min(displayedUnits + 10, mockUnits.length))}
                  className="w-full py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 rounded transition-colors"
                >
                  Load {Math.min(10, mockUnits.length - displayedUnits)} more units
                </button>
              </div>
            )}
          </ScrollArea>

          {/* Action Buttons */}
          <div className="px-6 py-4 border-t border-gray-200 bg-white flex gap-3">
            <button
              onClick={handleSaveStarred}
              disabled={starredUnits.size === 0}
              className={`flex-1 py-2.5 px-4 rounded font-semibold text-white transition-colors ${
                starredUnits.size === 0
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Save starred ({starredUnits.size})
            </button>
            <button className="flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-colors">
              Text Don
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
