"use client"

import { Building } from "@/lib/buildings"
import { ImageCarousel } from "@/components/image-carousel"
import { InfoTooltip } from "@/components/info-tooltip"

interface BuildingDetailsProps {
  building: Building
  onBack: () => void
  onQualify: () => void
}

export function BuildingDetails({ building, onBack, onQualify }: BuildingDetailsProps) {
  return (
    <div className="p-6">
      <button
        onClick={onBack}
        className="text-blue-600 hover:text-blue-700 text-sm mb-4 font-medium"
      >
        ← Back to List
      </button>

      <ImageCarousel images={building.images} />

      <h1 className="text-2xl font-bold mt-4 mb-2 text-gray-900">{building.name}</h1>

      <div className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded text-xs font-medium mb-4">
        {building.neighborhood}
      </div>

      <div className="flex items-center gap-2 text-gray-600 text-sm mb-6">
        <span>📍</span>
        <span>{building.address}</span>
      </div>

      {/* Price Range */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">$</span>
          <span className="text-sm text-gray-600">Price Range</span>
          <InfoTooltip text="Pricing fluctuates daily based on neighborhood market rates" />
        </div>
        <p className="text-xl font-bold text-gray-900">
          ${building.priceMin.toLocaleString()} - ${building.priceMax.toLocaleString()}
        </p>
      </div>

      {/* Current Offer */}
      <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-500 rounded-lg">
        <p className="text-sm font-semibold text-blue-900">Current Offer</p>
        <p className="text-lg font-bold text-blue-600">{building.concession}</p>
      </div>

      {/* Requirements */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 mb-1">Requirements</p>
        <p className="font-semibold text-gray-900">
          Income: {building.incomeReq} | Credit: {building.creditReq}
        </p>
      </div>

      {/* Hold Days */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 mb-1">Hold Days</p>
        <p className="font-semibold text-gray-900">{building.holdDays.join(", ")} days available</p>
      </div>

      {/* Amenities */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-900 mb-2">Amenities</p>
        <div className="flex flex-wrap gap-2">
          {building.amenities.map((amenity) => (
            <span key={amenity} className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded">
              {amenity}
            </span>
          ))}
        </div>
      </div>

      {/* Available Units */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-900 mb-2">Available Units</p>
        <div className="flex gap-2">
          {building.units.map((unit) => (
            <span key={unit} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded">
              {unit}
            </span>
          ))}
        </div>
      </div>

      {/* Qualify Button */}
      <button
        onClick={onQualify}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Qualify Now
      </button>
    </div>
  )
}
