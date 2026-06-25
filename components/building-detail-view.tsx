"use client"

import { useState, useEffect } from "react"
import { Heart, Share2, Phone } from "lucide-react"
import { Building } from "@/lib/buildings"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface BuildingDetailViewProps {
  building: Building
  onBack: () => void
}

interface Unit {
  floorPlanType: string
  beds: number | null
  baths: number
  sqft: number
  price: number
  availableDate: string
}

export function BuildingDetailView({ building, onBack }: BuildingDetailViewProps) {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState("all")
  const [isHearted, setIsHearted] = useState(false)

  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/prices/${building.id}?t=${Date.now()}`)
        
        if (res.ok) {
          const data = await res.json()
          setUnits(data.units || [])
        } else {
          setError("Unable to load unit availability")
        }
      } catch (err) {
        setError("Error loading units")
      } finally {
        setLoading(false)
      }
    }

    fetchUnits()
  }, [building.id])

  // Get minimum price from units
  const minPrice = units.length > 0 ? Math.min(...units.map(u => u.price)) : building.priceMin

  // Filter units by bed count
  const getFilteredUnits = () => {
    if (selectedTab === "all") return units
    if (selectedTab === "studio") return units.filter(u => u.beds === null)
    if (selectedTab === "1") return units.filter(u => u.beds === 1)
    if (selectedTab === "2") return units.filter(u => u.beds === 2)
    if (selectedTab === "3") return units.filter(u => u.beds === 3)
    return units
  }

  const filteredUnits = getFilteredUnits()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getUnitTypeLabel = (unit: Unit) => {
    if (unit.beds === null) return "Studio"
    return `${unit.beds} Bed${unit.beds > 1 ? 's' : ''}`
  }

  return (
    <div className="h-full bg-white overflow-y-auto flex flex-col">
      {/* Header with close button */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">{building.name}</h2>
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 text-2xl"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* 3-Panel Photo Grid */}
        <div className="grid grid-cols-3 gap-1 h-40">
          {building.images.slice(0, 3).map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`${building.name} photo ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          ))}
        </div>

        <div className="p-4">
          {/* Building Info with Heart & Share Icons */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{building.name}</h1>
              <p className="text-gray-600">{building.neighborhood}</p>
              <p className="text-sm text-gray-500">{building.address}</p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => setIsHearted(!isHearted)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
                aria-label="Save building"
              >
                <Heart
                  size={24}
                  className={isHearted ? "fill-red-500 text-red-500" : "text-gray-400"}
                />
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
                aria-label="Share building"
              >
                <Share2 size={24} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* Badge Row */}
          <div className="flex flex-wrap gap-2 mb-4">
            {building.concession && (
              <Badge className="bg-green-100 text-green-800 border-0">
                {building.concession}
              </Badge>
            )}
            <Badge className="bg-blue-100 text-blue-800 border-0">
              Commission available
            </Badge>
            {building.management && (
              <Badge className="bg-amber-100 text-amber-800 border-0">
                {building.management}
              </Badge>
            )}
          </div>

          {/* Starting Price & Unit Count */}
          <div className="text-lg font-semibold text-gray-900 mb-4 pb-4 border-b border-gray-200">
            Starting at {formatPrice(minPrice)}/mo · {units.length} units available
          </div>

          {/* Tab Filter for Units */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {["all", "studio", "1", "2", "3"].map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition ${
                  selectedTab === tab
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab === "all" && "All"}
                {tab === "studio" && "Studio"}
                {tab === "1" && "1 bed"}
                {tab === "2" && "2 bed"}
                {tab === "3" && "3 bed"}
              </button>
            ))}
          </div>

          {/* Unit List */}
          <div className="space-y-3 mb-6">
            {loading ? (
              <p className="text-gray-500">Loading units...</p>
            ) : error ? (
              <p className="text-red-500">{error}</p>
            ) : filteredUnits.length === 0 ? (
              <p className="text-gray-500">No units available in this category</p>
            ) : (
              filteredUnits.map((unit, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <div className="font-bold text-lg text-gray-900">
                      {formatPrice(unit.price)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {getUnitTypeLabel(unit)} • {unit.baths} ba • {unit.sqft} sqft{" "}
                      {unit.floorPlanType && `• Floor ${unit.floorPlanType}`}
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-0 ml-2 shrink-0">
                    Available now
                  </Badge>
                </div>
              ))
            )}
          </div>

          {/* Requirements Section - 2x2 Grid */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Requirements</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase">Income</div>
                <div className="text-lg font-bold text-gray-900">
                  {building.requirements?.incomeMultiplier || building.incomeReq}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase">Credit Score</div>
                <div className="text-lg font-bold text-gray-900">
                  {building.requirements?.creditScore || building.creditReq}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase">Guarantor</div>
                <div className="text-lg font-bold text-gray-900">
                  {building.requirements?.guarantor || (building.guarantor ? "Required" : "Not required")}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs font-semibold text-gray-500 uppercase">Hold Days</div>
                <div className="text-lg font-bold text-gray-900">
                  {building.requirements?.holdDays ||
                    (building.holdDays?.length > 0 ? `${Math.min(...building.holdDays)}-${Math.max(...building.holdDays)} days` : "N/A")}
                </div>
              </div>
            </div>
          </div>

          {/* Move-In Fees Section */}
          {building.fees && Object.keys(building.fees).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Move-In Fees</h3>
              <div className="space-y-2">
                {Object.entries(building.fees).map(([key, value], idx) => (
                  <div key={idx}>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {typeof value === "number" ? formatPrice(value) : value}
                      </span>
                    </div>
                    {idx < Object.keys(building.fees).length - 1 && (
                      <div className="border-b border-gray-100" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dual CTA Buttons */}
          <div className="flex gap-3 pb-6">
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
              onClick={() => {
                // Text action - could open SMS or modal
                if (building.phone) {
                  window.location.href = `sms:${building.phone}`
                }
              }}
            >
              Text about {building.name}
            </Button>
            <Button
              variant="outline"
              className="flex-1 border border-gray-300 text-gray-900 font-semibold py-3 rounded-lg hover:bg-gray-50"
              onClick={() => {
                if (building.phone) {
                  window.location.href = `tel:${building.phone}`
                }
              }}
            >
              <Phone size={18} className="mr-2" />
              Call
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
