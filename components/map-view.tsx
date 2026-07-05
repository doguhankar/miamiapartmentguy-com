"use client"

import { useRef, useEffect, useState } from "react"
import { Building } from "@/lib/buildings"
import { MapPin, Loader2 } from "lucide-react"

interface MapViewProps {
  selectedBuilding: Building | null
  highlightedBuilding?: Building | null
  onSelectBuilding: (building: Building) => void
  buildings: Building[]
}

interface PricingData {
  buildingId: string
  minPrice?: number
  units?: Array<{ price: number }>
}

const MIAMI_CENTER = { lat: 25.7617, lng: -80.1918 }

// Neighborhood colors for map pins
const NEIGHBORHOOD_PIN_COLORS: Record<string, string> = {
  Brickell: "#2563EB", // blue-600
  Downtown: "#059669", // emerald-600
  Wynwood: "#DC2626", // red-600
  "Edgewater": "#7C3AED", // violet-600
  "Midtown": "#EA580C", // orange-600
  "Coral Gables": "#0891B2", // cyan-600
}

export function MapView({ selectedBuilding, highlightedBuilding, onSelectBuilding, buildings }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const markers = useRef<any[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapboxgl, setMapboxgl] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pricingData, setPricingData] = useState<Record<string, PricingData>>({})

  // Fetch pricing data for buildings
  useEffect(() => {
    const fetchPricingData = async () => {
      try {
        const pricingMap: Record<string, PricingData> = {}

        // Fetch pricing for all buildings using their IDs as API slugs
        for (const building of buildings) {
          const slug = building.id
          try {
            const url = `/api/prices/${slug}?t=${Date.now()}`
            const response = await fetch(url)
            
            if (response.ok) {
              const data = await response.json()
              
              if (data.units && data.units.length > 0) {
                const prices = data.units.map((u: any) => u.price)
                const minPrice = Math.min(...prices)
                pricingMap[slug] = { buildingId: slug, minPrice, units: data.units }
              }
            }
          } catch (err) {
            // Silent fail for individual buildings
          }
        }
        
        setPricingData(pricingMap)
      } catch (err) {
        // Silent fail
      }
    }

    fetchPricingData()
  }, [buildings])

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
        style: "mapbox://styles/mapbox/streets-v12",
        center: [MIAMI_CENTER.lng, MIAMI_CENTER.lat],
        zoom: 13.5,
      })

      map.current.addControl(new mapboxgl.default.NavigationControl(), "bottom-right")

      // Keep map at tight zoom on downtown/Brickell, don't fitBounds to all scattered buildings
      // Buildings spread from Brickell (25.75-25.77) to Edgewater/Wynwood (25.79-26.0)
      // Zoom 13-14 keeps focus on core downtown/Brickell clusters, not outer neighborhoods
      map.current.on('load', () => {
        // Map stays at zoom 13 centered on Miami, initial view tight on downtown core
      })
    } catch {
      setMapError("Failed to initialize map")
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [mapboxgl, buildings])

  // Update markers when buildings or selectedBuilding changes
  useEffect(() => {
    if (!map.current) {
      return
    }

    // Clear existing markers
    markers.current.forEach((m) => m.remove())
    markers.current = []

    // Add new markers
    buildings.forEach((building) => {
      const isSelected = selectedBuilding?.id === building.id
      const isHighlighted = highlightedBuilding?.id === building.id
      const pricing = pricingData[building.id]
      
      // Get color based on neighborhood, with selection/highlight states
      let pinColor = NEIGHBORHOOD_PIN_COLORS[building.neighborhood] || "#6B7280"
      const isActive = isSelected || isHighlighted
      
      // Create marker element
      const markerEl = document.createElement("div")
      markerEl.style.position = "relative"
      markerEl.style.width = isActive ? "8px" : "6px"
      markerEl.style.height = isActive ? "8px" : "6px"
      markerEl.style.cursor = "pointer"
      markerEl.style.display = "flex"
      markerEl.style.alignItems = "center"
      markerEl.style.justifyContent = "center"
      markerEl.style.transition = "all 0.2s ease"

      // Clean colored circle marker for each building
      markerEl.innerHTML = `
        <div style="
          position: relative;
          width: ${isActive ? "12px" : "8px"};
          height: ${isActive ? "12px" : "8px"};
          display: flex;
          align-items: center;
          justify-content: center;
          background: ${pinColor};
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          border: 2px solid white;
          transform: scale(${isActive ? 1.2 : 1});
          transition: all 0.2s ease;
        "></div>
      `

      markerEl.addEventListener("click", () => onSelectBuilding(building))
      markerEl.addEventListener("mouseenter", () => {
        markerEl.style.transform = `scale(${isActive ? 1.3 : 1.2})`
      })
      markerEl.addEventListener("mouseleave", () => {
        markerEl.style.transform = `scale(${isActive ? 1.2 : 1})`
      })

      const marker = new mapboxgl.default.Marker({ element: markerEl })
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
  }, [buildings, selectedBuilding, highlightedBuilding, onSelectBuilding, pricingData])

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
