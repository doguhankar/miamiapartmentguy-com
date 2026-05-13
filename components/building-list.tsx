"use client"

import { Building } from "@/lib/buildings"

interface BuildingListProps {
  buildings: Building[]
  onSelectBuilding: (building: Building) => void
}

export function BuildingList({ buildings, onSelectBuilding }: BuildingListProps) {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Buildings ({buildings.length})
      </h2>
      <div className="space-y-3">
        {buildings.map((building) => (
          <div
            key={building.id}
            onClick={() => onSelectBuilding(building)}
            className="p-3 rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900 text-sm">{building.name}</h3>
              <span className="text-sm font-bold text-gray-700">{building.priceTier}</span>
            </div>
            <p className="text-xs text-gray-600 mb-2">{building.neighborhood}</p>
            <p className="text-xs text-gray-500 mb-2">
              ${building.priceMin.toLocaleString()} - ${building.priceMax.toLocaleString()}
            </p>
            <div className="flex flex-wrap gap-1">
              {building.units.map((unit) => (
                <span key={unit} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                  {unit}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
