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
    console.log('[v0] ===== MARKER RENDER START =====')
    console.log('[v0] pricingData state:', pricingData)
    console.log('[v0] pricingData keys:', Object.keys(pricingData))
    console.log('[v0] buildings count:', buildings.length)
    console.log('[v0] buildings:', buildings.map(b => ({ id: b.id, name: b.name })))
    
    if (!map.current) {
      console.warn('[v0] Map not initialized yet')
      return
    }

    // Clear existing markers
    console.log('[v0] Clearing', markers.current.length, 'existing markers')
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

      const priceText = pricing?.minPrice 
        ? `$${(pricing.minPrice / 1000).toFixed(1)}k`
        : null
      
      if (priceText) {
        // Create a badge-style marker with price and neighborhood color
        markerEl.innerHTML = `
          <div style="
            position: relative;
            width: ${isActive ? "8px" : "6px"};
            height: ${isActive ? "8px" : "6px"};
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${pinColor};
            border-radius: 50%;
            box-shadow: ${isActive ? `0 1px 3px rgba(0, 0, 0, 0.3)` : `0 0.5px 1.5px rgba(0, 0, 0, 0.2)`};
            border: 0.5px solid white;
            font-size: ${isActive ? "3px" : "2px"};
            font-weight: bold;
            color: white;
            transform: scale(${isActive ? 1.15 : 1});
            transition: all 0.2s ease;
          " class="price-badge">
            ${priceText}
          </div>
        `
      } else {
        // Fallback to traditional pin marker
        markerEl.innerHTML = `
          <svg width="4" height="5" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 0.5px 1px rgba(0, 0, 0, 0.2)); transition: transform 0.2s ease;">
            <path d="M16 2C10.48 2 6 6.48 6 12c0 8 10 26 10 26s10-18 10-26c0-5.52-4.48-10-10-10z" fill="${pinColor}"/>
            <circle cx="16" cy="12" r="3" fill="white"/>
          </svg>
        `
      }

      markerEl.addEventListener("click", () => onSelectBuilding(building))
      markerEl.addEventListener("mouseenter", () => {
        const badge = markerEl.querySelector(".price-badge")
        if (badge) {
          badge.style.transform = `scale(${isActive ? 1.25 : 1.1})`
        }
      })
      markerEl.addEventListener("mouseleave", () => {
        const badge = markerEl.querySelector(".price-badge")
        if (badge) {
          badge.style.transform = `scale(${isActive ? 1.15 : 1})`
        }
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
