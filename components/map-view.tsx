"use client"

import { useRef, useEffect, useState } from "react"
import { Building } from "@/lib/buildings"
import { MapPin, Loader2 } from "lucide-react"

interface MapViewProps {
  selectedBuilding: Building | null
  onSelectBuilding: (building: Building) => void
  buildings: Building[]
}

interface PricingData {
  buildingId: string
  minPrice?: number
  units?: Array<{ price: number }>
}

const MIAMI_CENTER = { lat: 25.76, lng: -80.19 }

// Mapping of numeric building IDs to API slugs
const buildingIdMap: Record<number | string, string> = {
  1: "flow-brickell",
  // Add more mappings as needed
}

export function MapView({ selectedBuilding, onSelectBuilding, buildings }: MapViewProps) {
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

        // Fetch pricing for buildings that have API slugs
        for (const [numericId, slug] of Object.entries(buildingIdMap)) {
          try {
            const response = await fetch(`/api/prices/${slug}?t=${Date.now()}`)
            if (response.ok) {
              const data = await response.json()
              if (data.units && data.units.length > 0) {
                const minPrice = Math.min(...data.units.map((u: any) => u.price))
                pricingMap[numericId] = { buildingId: slug, minPrice, units: data.units }
              }
            }
          } catch (err) {
            console.log('[v0] Failed to fetch pricing for', slug, err)
          }
        }
        setPricingData(pricingMap)
      } catch (err) {
        console.error('[v0] Error fetching pricing data:', err)
      }
    }

    fetchPricingData()
  }, [])

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
      const pricing = pricingData[building.id]
      
      // Create marker element
      const markerEl = document.createElement("div")
      markerEl.style.position = "relative"
      markerEl.style.width = "48px"
      markerEl.style.height = "48px"
      markerEl.style.cursor = "pointer"
      markerEl.style.display = "flex"
      markerEl.style.alignItems = "center"
      markerEl.style.justifyContent = "center"

      const color = isSelected ? "#0066CC" : "#9CA3AF"
      const priceText = pricing?.minPrice 
        ? `$${(pricing.minPrice / 1000).toFixed(1)}k`
        : null

      if (priceText) {
        // Create a badge-style marker with price
        markerEl.innerHTML = `
          <div style="
            position: relative;
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
            border-radius: 50%;
            box-shadow: 0 3px 10px rgba(124, 58, 237, 0.5), 0 2px 4px rgba(0, 0, 0, 0.2);
            border: 2px solid white;
            font-size: 11px;
            font-weight: bold;
            color: white;
            transform: scale(1);
            transition: transform 0.2s ease;
          " class="price-badge">
            ${priceText}
          </div>
        `
      } else {
        // Fallback to traditional pin marker
        markerEl.innerHTML = `
          <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2)); transition: transform 0.2s ease;">
            <path d="M16 2C10.48 2 6 6.48 6 12c0 8 10 26 10 26s10-18 10-26c0-5.52-4.48-10-10-10z" fill="${color}"/>
            <circle cx="16" cy="12" r="3" fill="white"/>
          </svg>
        `
      }

      markerEl.addEventListener("click", () => onSelectBuilding(building))
      markerEl.addEventListener("mouseenter", (e) => {
        const badge = markerEl.querySelector(".price-badge")
        if (badge) {
          badge.style.transform = "scale(1.1)"
        }
      })
      markerEl.addEventListener("mouseleave", (e) => {
        const badge = markerEl.querySelector(".price-badge")
        if (badge) {
          badge.style.transform = "scale(1)"
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
  }, [buildings, selectedBuilding, onSelectBuilding, pricingData])

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
