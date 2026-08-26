"use client"

import { useRef, useEffect, useState, useMemo } from "react"
import { Building } from "@/lib/buildings"
import { MapPin, Loader2 } from "lucide-react"

interface MapViewProps {
  selectedBuilding: Building | null
  highlightedBuilding?: Building | null
  onSelectBuilding: (building: Building) => void
  buildings: Building[]
  onBuildingsInView?: (buildings: Building[]) => void
}

interface PricingData {
  buildingId: string
  minPrice?: number
  units?: Array<{ price: number }>
}

<<<<<<< HEAD
// Miami center to fit core buildings: Brickell Hammock (25.71) through Downtown/Edgewater/Midtown/Wynwood to Rt 195 (~25.82)
const MIAMI_CENTER = { lat: 25.765, lng: -80.185 }
=======
const MIAMI_CENTER = { lat: 25.7617, lng: -80.1918 }
>>>>>>> 03fc5097df0c4aa2a1dea6ee2c391c3d9ed2e818

// Neighborhood colors for map pins
const NEIGHBORHOOD_PIN_COLORS: Record<string, string> = {
  Brickell: "#2563EB", // blue-600
  Downtown: "#059669", // emerald-600
  Wynwood: "#DC2626", // red-600
  "Edgewater": "#7C3AED", // violet-600
  "Midtown": "#EA580C", // orange-600
  "Coral Gables": "#0891B2", // cyan-600
}

export function MapView({ selectedBuilding, highlightedBuilding, onSelectBuilding, buildings, onBuildingsInView }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const markers = useRef<any[]>([])
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapboxgl, setMapboxgl] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [pricingData, setPricingData] = useState<Record<string, PricingData>>({})
  const [bounds, setBounds] = useState<{ south: number; north: number; west: number; east: number } | null>(null)
  const buildingsInView = useMemo(() => {
    if (!bounds) return buildings
    return buildings.filter((building) => building.lat >= bounds.south && building.lat <= bounds.north && building.lng >= bounds.west && building.lng <= bounds.east)
  }, [buildings, bounds])

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
<<<<<<< HEAD
        zoom: 11, // Zoom 11 fits all core Miami neighborhoods: Brickell, Downtown, Edgewater, Midtown, Wynwood
=======
        zoom: 13.5,
>>>>>>> 03fc5097df0c4aa2a1dea6ee2c391c3d9ed2e818
      })

      map.current.addControl(new mapboxgl.default.NavigationControl(), "bottom-right")

<<<<<<< HEAD
      // Map stays at initial zoom 11 centered on 25.765, -80.185
      // This shows the entire Miami corridor from Brickell to Wynwood
      const updateBuildingsInView = () => {
        const mapBounds = map.current.getBounds()
        setBounds({
          south: mapBounds.getSouth(),
          north: mapBounds.getNorth(),
          west: mapBounds.getWest(),
          east: mapBounds.getEast(),
        })
      }

      map.current.on('load', () => {
        // No fitBounds - keep initial zoom 11 and center position
        updateBuildingsInView()
=======
      // Keep map at tight zoom on downtown/Brickell, don't fitBounds to all scattered buildings
      // Buildings spread from Brickell (25.75-25.77) to Edgewater/Wynwood (25.79-26.0)
      // Zoom 13-14 keeps focus on core downtown/Brickell clusters, not outer neighborhoods
      map.current.on('load', () => {
        // Map stays at zoom 13.5 centered on Miami, initial view tight on downtown core
>>>>>>> 03fc5097df0c4aa2a1dea6ee2c391c3d9ed2e818
      })
      map.current.on('moveend', updateBuildingsInView)
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

  useEffect(() => {
    onBuildingsInView?.(buildingsInView)
  }, [buildingsInView, onBuildingsInView])

  // Update markers when buildings in the viewport or visual marker state changes
  useEffect(() => {
    if (!map.current) {
      return
    }

    // Clear existing markers
    markers.current.forEach((m) => m.remove())
    markers.current = []
    
    // Add new markers
    buildingsInView.forEach((building) => {
      const isSelected = selectedBuilding?.id === building.id
      const isHighlighted = highlightedBuilding?.id === building.id
      const pricing = pricingData[building.id]
      
      // Get color based on neighborhood, with selection/highlight states
      let pinColor = NEIGHBORHOOD_PIN_COLORS[building.neighborhood] || "#6B7280"
      const isActive = isSelected || isHighlighted
      
      // Create marker element as a simple colored div circle
      const markerEl = document.createElement("div")
<<<<<<< HEAD
      markerEl.style.position = "relative"
      markerEl.style.width = isActive ? "4px" : "3px"
      markerEl.style.height = isActive ? "4px" : "3px"
=======
      const size = isActive ? 24 : 18
      markerEl.style.width = size + "px"
      markerEl.style.height = size + "px"
      markerEl.style.backgroundColor = pinColor
      markerEl.style.borderRadius = "50%"
      markerEl.style.border = "2px solid #ffffff"
      markerEl.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.4)"
>>>>>>> 03fc5097df0c4aa2a1dea6ee2c391c3d9ed2e818
      markerEl.style.cursor = "pointer"
      markerEl.style.transition = "all 0.2s ease"
<<<<<<< HEAD

      const priceText = pricing?.minPrice 
        ? `$${(pricing.minPrice / 1000).toFixed(1)}k`
        : null
      
      if (priceText) {
        // Create a badge-style marker with price and neighborhood color
        markerEl.innerHTML = `
          <div style="
            position: relative;
            width: ${isActive ? "4px" : "3px"};
            height: ${isActive ? "4px" : "3px"};
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
=======
      markerEl.style.transform = isActive ? "scale(1.2)" : "scale(1)"
      markerEl.style.position = "relative"
      markerEl.style.display = "block"
>>>>>>> 03fc5097df0c4aa2a1dea6ee2c391c3d9ed2e818

      markerEl.addEventListener("click", () => onSelectBuilding(building))
      markerEl.addEventListener("mouseenter", () => {
        markerEl.style.transform = `scale(${isActive ? 1.3 : 1.2})`
      })
      markerEl.addEventListener("mouseleave", () => {
        markerEl.style.transform = `scale(${isActive ? 1.2 : 1})`
      })

      try {
        const marker = new mapboxgl.default.Marker({ 
          element: markerEl,
          anchor: 'center' 
        })
          .setLngLat([building.lng, building.lat])
          .addTo(map.current)

        markers.current.push(marker)
      } catch (err) {
        // Silent fail - marker creation issue
      }
    })

    // Fly to selected building
    if (selectedBuilding && buildings.includes(selectedBuilding)) {
      map.current.flyTo({
        center: [selectedBuilding.lng, selectedBuilding.lat],
        zoom: 14,
        duration: 1000,
      })
    }
  }, [buildingsInView, selectedBuilding, highlightedBuilding, onSelectBuilding, pricingData])

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
