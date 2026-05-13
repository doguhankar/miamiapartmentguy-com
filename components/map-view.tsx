"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import { Building, buildings } from "@/lib/buildings"
import { MapPin } from "lucide-react"
import type mapboxglType from "mapbox-gl"

interface MapViewProps {
  selectedBuilding: Building | null
  onSelectBuilding: (building: Building) => void
}

const MIAMI_CENTER = { lat: 25.795, lng: -80.19 }
const DEFAULT_ZOOM = 12.5

export function MapView({ selectedBuilding, onSelectBuilding }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxglType.Map | null>(null)
  const markers = useRef<mapboxglType.Marker[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapboxgl, setMapboxgl] = useState<typeof import("mapbox-gl") | null>(null)

  // Dynamically import mapbox-gl to handle missing token gracefully
  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      setMapError("Mapbox token not configured. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables.")
      return
    }

    import("mapbox-gl").then((mod) => {
      import("mapbox-gl/dist/mapbox-gl.css")
      mod.default.accessToken = token
      setMapboxgl(mod)
    }).catch(() => {
      setMapError("Failed to load map library")
    })
  }, [])

  const createMarkerElement = useCallback((building: Building, isSelected: boolean) => {
    const el = document.createElement("div")
    el.className = "building-marker"
    el.innerHTML = `
      <div class="marker-pin ${isSelected ? "selected" : ""}">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="currentColor"/>
          <circle cx="12" cy="9" r="3" fill="white"/>
        </svg>
      </div>
    `
    return el
  }, [])

  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxgl) return

    try {
      map.current = new mapboxgl.default.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [MIAMI_CENTER.lng, MIAMI_CENTER.lat],
        zoom: DEFAULT_ZOOM,
      })

      map.current.addControl(new mapboxgl.default.NavigationControl(), "bottom-right")

      buildings.forEach((building) => {
        const el = createMarkerElement(building, false)
        el.addEventListener("click", () => onSelectBuilding(building))

        const marker = new mapboxgl.default.Marker({ element: el })
          .setLngLat([building.lng, building.lat])
          .addTo(map.current!)

        markers.current.push(marker)
      })
    } catch {
      setMapError("Failed to initialize map")
    }

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [createMarkerElement, onSelectBuilding, mapboxgl])

  useEffect(() => {
    if (!map.current) return

    markers.current.forEach((marker, index) => {
      const building = buildings[index]
      const el = createMarkerElement(building, selectedBuilding?.id === building.id)
      el.addEventListener("click", () => onSelectBuilding(building))
      marker.getElement().replaceWith(el)
      ;(marker as unknown as { _element: HTMLElement })._element = el
    })

    if (selectedBuilding) {
      map.current.flyTo({
        center: [selectedBuilding.lng, selectedBuilding.lat],
        zoom: 14,
        duration: 1000,
      })
    }
  }, [selectedBuilding, createMarkerElement, onSelectBuilding])

  // Show error state or loading state when map isn't ready
  if (mapError) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-muted/50 p-8 text-center">
        <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{mapError}</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {buildings.map((building) => (
            <button
              key={building.id}
              onClick={() => onSelectBuilding(building)}
              className={`rounded-lg border p-3 text-left transition-colors hover:border-primary ${
                selectedBuilding?.id === building.id ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <p className="text-xs font-medium">{building.name}</p>
              <p className="text-xs text-muted-foreground">{building.neighborhood}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!mapboxgl) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted/50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        .building-marker {
          cursor: pointer;
        }
        .marker-pin {
          color: #0066cc;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
          transition: transform 0.2s ease;
        }
        .marker-pin:hover {
          transform: scale(1.1);
        }
        .marker-pin.selected {
          color: #0055aa;
          transform: scale(1.2);
        }
        .mapboxgl-ctrl-bottom-left,
        .mapboxgl-ctrl-bottom-right {
          bottom: 20px !important;
        }
        .mapboxgl-ctrl-attrib {
          font-size: 10px !important;
        }
      `}</style>
      <div ref={mapContainer} className="h-full w-full" />
    </>
  )
}
