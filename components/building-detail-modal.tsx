"use client"

import { useState } from "react"
import { X, ChevronLeft, ChevronRight, Star, Phone, Users } from "lucide-react"
import { Building } from "@/lib/buildings"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface BuildingDetailModalProps {
  building: Building
  onClose: () => void
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

export function BuildingDetailModal({ building, onClose }: BuildingDetailModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [starredUnits, setStarredUnits] = useState<Set<string>>(new Set())

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl h-[600px] flex flex-col shadow-lg overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT COLUMN - Building Info (55%) */}
          <div className="w-[55%] border-r border-gray-200 flex flex-col overflow-hidden">
            {/* Photo Carousel */}
            <div className="relative h-[280px] bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center overflow-hidden">
              <img
                src={building.images[currentPhotoIndex]}
                alt={`${building.name} photo ${currentPhotoIndex + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Navigation Buttons */}
              <button
                onClick={prevPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              {/* View All Photos Button */}
              <button className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 hover:bg-black/85 text-white px-4 py-1.5 rounded text-sm font-medium transition-colors">
                VIEW ALL {building.images.length} PHOTOS
              </button>
            </div>

            {/* Building Info - Scrollable */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 pr-4">
                {/* Building Name */}
                <div>
                  <h2 className="text-[17px] font-bold text-gray-900">{building.name}</h2>
                  <p className="text-[12px] text-gray-600 mt-1">{building.address}</p>
                </div>

                {/* Deal Badges */}
                <div className="flex gap-2">
                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[11px]">
                    DEALS
                  </Badge>
                  <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-200 text-[11px]">
                    {building.priceTier === "$$" ? "50% OFF" : "SPECIAL"}
                  </Badge>
                </div>

                {/* Deal Info Card */}
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                  <p className="text-[12px] font-bold text-gray-900 mb-1">{building.concession}</p>
                  <p className="text-[11px] text-gray-500">Updated Nov 1 • Expires Dec 31</p>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-200" />

                {/* Phone Section */}
                <div>
                  <p className="text-[11px] text-gray-500 font-medium mb-1">PHONE</p>
                  <p className="text-[13px] text-blue-600 font-medium">(305) 555-0123</p>
                </div>

                {/* Management Section */}
                <div>
                  <p className="text-[11px] text-gray-500 font-medium mb-1">MANAGEMENT</p>
                  <p className="text-[13px] text-gray-900 font-medium">Sterling Management</p>
                </div>

                {/* Amenities Section */}
                <div>
                  <p className="text-[11px] text-gray-500 font-medium mb-2">AMENITIES</p>
                  <div className="grid grid-cols-2 gap-2">
                    {building.amenities.map((amenity) => (
                      <div
                        key={amenity}
                        className="flex items-center gap-2 text-[12px] text-gray-700"
                      >
                        <div className="w-1 h-1 bg-blue-500 rounded-full" />
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <p className="text-[11px] text-gray-500 font-medium mb-2">REQUIREMENTS</p>
                  <p className="text-[12px] text-gray-700">
                    {building.incomeReq} income • {building.creditReq} credit score
                  </p>
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* RIGHT COLUMN - Units List (45%) */}
          <div className="w-[45%] flex flex-col overflow-hidden">
            {/* Fixed Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white">
              <h3 className="text-[14px] font-bold text-gray-900">
                Available units ({mockUnits.length})
              </h3>
            </div>

            {/* Scrollable Units List */}
            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-2 pr-4">
                {mockUnits.map((unit) => {
                  const isStarred = starredUnits.has(unit.id)
                  return (
                    <div
                      key={unit.id}
                      className={`p-3 rounded border transition-all ${
                        isStarred
                          ? "bg-blue-50 border-2 border-blue-600"
                          : "bg-white border border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex-1">
                          <p className="text-[13px] font-bold text-gray-900">{unit.type}</p>
                          <p className="text-[11px] text-gray-600 mt-0.5">
                            {unit.sqft} sqft • Floor {unit.floor}
                          </p>
                        </div>
                        <button
                          onClick={() => toggleUnitStar(unit.id)}
                          className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded transition-colors ml-2"
                        >
                          <Star
                            className={`h-4 w-4 ${
                              isStarred
                                ? "fill-blue-600 text-blue-600"
                                : "text-gray-400"
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-[14px] font-bold text-blue-600">
                        ${unit.price.toLocaleString()}/mo
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Load More Button */}
              <button className="w-full mt-3 px-4 py-2 text-[12px] text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                Load 10 more units
              </button>
            </ScrollArea>

            {/* Fixed Action Buttons */}
            <div className="flex-shrink-0 flex gap-2 p-3 border-t border-gray-200 bg-white">
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2"
                disabled={starredUnits.size === 0}
              >
                Save starred ({starredUnits.size})
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2"
              >
                Text Don
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
