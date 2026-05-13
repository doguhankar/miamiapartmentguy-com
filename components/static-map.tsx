"use client"

import { useState, useEffect } from "react"
import { Building } from "@/lib/buildings"

interface StaticMapProps {
  buildings: Building[]
  selectedBuilding: Building | null
  onBuildingClick: (building: Building) => void
}

const MIAMI_BOUNDS = {
  minLat: 25.7,
  maxLat: 25.85,
  minLng: -80.25,
  maxLng: -80.15,
}

function latLngToXY(lat: number, lng: number) {
  const x = ((lng - MIAMI_BOUNDS.minLng) / (MIAMI_BOUNDS.maxLng - MIAMI_BOUNDS.minLng)) * 100
  const y = ((MIAMI_BOUNDS.maxLat - lat) / (MIAMI_BOUNDS.maxLat - MIAMI_BOUNDS.minLat)) * 100
  return { x, y }
}

export function StaticMap({ buildings, selectedBuilding, onBuildingClick }: StaticMapProps) {
  const [mapboxgl, setMapboxgl] = useState<typeof import("mapbox-gl") | null>(null)
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  useEffect(() => {
    if (!token) return
    import("mapbox-gl").then((mod) => {
      mod.default.accessToken = token
      setMapboxgl(mod)
    })
  }, [token])

  return (
    <div className="w-full h-full bg-gray-100 relative overflow-hidden">
      {/* Map background placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-gray-50" />
      
      {/* Mapbox Static Background */}
      {token && (
        <img
          src={`https://api.mapbox.com/styles/v1/mapbox/light-v11/static/-80.19,25.76,12.5,0/800x600@2x?access_token=${token}`}
          alt="Miami Map"
          className="w-full h-full object-cover"
        />
      )}

      {/* Building pins */}
      <div className="absolute inset-0">
        {buildings.map((building) => {
          const { x, y } = latLngToXY(building.lat, building.lng)
          const isSelected = selectedBuilding?.id === building.id

          return (
            <button
              key={building.id}
              onClick={() => onBuildingClick(building)}
              className="absolute transform -translate-x-1/2 -translate-y-full focus:outline-none group"
              style={{
                left: `${x}%`,
                top: `${y}%`,
              }}
            >
              {/* Pin marker */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white transition-all ${
                  isSelected
                    ? "bg-blue-600 ring-4 ring-blue-300 scale-125"
                    : "bg-blue-600 hover:bg-blue-700 hover:scale-110"
                }`}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="text-white"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                </svg>
              </div>

              {/* Building name on hover */}
              <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {building.name}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
