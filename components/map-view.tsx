"use client"

import { useRef, useEffect, useState } from "react"
import { Building } from "@/lib/buildings"
import { MapPin, Loader2 } from "lucide-react"

interface MapViewProps {
  selectedBuilding: Building | null
  onSelectBuilding: (building: Building) => void
  buildings: Building[]
}

const MIAMI_CENTER = { lat: 25.76, lng: -80.19 }

export function MapView({ selectedBuilding, onSelectBuilding, buildings }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const markers = useRef<any[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapboxgl, setMapboxgl] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      setMapError("Mapbox token not configured. Please add NEXT_PUBLIC_MAPBOX_TOKEN to your environment variables.")
      setLoading(false)
      return
    }

    import("mapbox-gl").then((mod) => {
      import("mapbox-gl/dist/mapbox-gl.css")
      mod.default.accessToken = token
      setMapboxgl(mod)
      setLoading(false)
    }).catch(() => {
      setMapError("Failed to load map library")
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!mapContainer.current || !mapboxgl || map.current) return

    try {
      map.current = new mapboxgl.default.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [MIAMI_CENTER.lng, MIAMI_CENTER.lat],
        zoom: 13,
      })

      map.current.addControl(new mapboxgl.default.NavigationControl(), "bottom-right")
    } catch {
      setMapError("Failed to initialize map")
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [mapboxgl])

  // Update markers when buildings or selectedBuilding changes
  useEffect(() => {
    if (!map.current) return

    // Clear existing markers
    markers.current.forEach((m) => m.remove())
    markers.current = []

    // Add new markers
    buildings.forEach((building) => {
      const isSelected = selectedBuilding?.id === building.id
      const el = document.createElement("div")
      el.className = "marker"
      el.style.width = "32px"
      el.style.height = "40px"
      el.style.cursor = "pointer"

      const color = isSelected ? "#0066CC" : "#9CA3AF"
      el.innerHTML = `
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2)); transition: transform 0.2s ease;">
          <path d="M16 2C10.48 2 6 6.48 6 12c0 8 10 26 10 26s10-18 10-26c0-5.52-4.48-10-10-10z" fill="${color}"/>
          <circle cx="16" cy="12" r="3" fill="white"/>
        </svg>
      `

      el.addEventListener("click", () => onSelectBuilding(building))

      const marker = new mapboxgl.default.Marker({ element: el })
        .setLngLat([building.lng, building.lat])
        .addTo(map.current)

      markers.current.push(marker)
    })

    // Fly to selected building
    if (selectedBuilding && buildings.includes(selectedBuilding)) {
      map.current.flyTo({
        center: [selectedBuilding.lng, selectedBuilding.lat],
        zoom: 14,
        duration: 1000,
      })
    }
  }, [buildings, selectedBuilding, onSelectBuilding])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (mapError) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-muted p-8 text-center">
        <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 font-semibold text-foreground">Map Unavailable</h3>
        <p className="text-sm text-muted-foreground">{mapError}</p>
      </div>
    )
  }

  return <div ref={mapContainer} className="h-full w-full" />
}
