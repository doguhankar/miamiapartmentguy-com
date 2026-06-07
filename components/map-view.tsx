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
      console.log('[v0] ===== PRICING FETCH START =====')
      console.log('[v0] Number of buildings to fetch:', buildings.length)
      console.log('[v0] Buildings:', buildings)
      console.log('[v0] Buildings IDs:', buildings.map(b => b.id))
      
      try {
        const pricingMap: Record<string, PricingData> = {}

        // Fetch pricing for all buildings using their IDs as API slugs
        for (const building of buildings) {
          const slug = building.id
          console.log(`[v0] Fetching pricing for building: ${building.name}, id/slug=${slug}`)
          try {
            const url = `/api/prices/${slug}?t=${Date.now()}`
            console.log(`[v0] API URL: ${url}`)
            
            const response = await fetch(url)
            console.log(`[v0] Response status: ${response.status}, ok: ${response.ok}`)
            
            if (response.ok) {
              const data = await response.json()
              console.log(`[v0] API data for ${slug}:`, data)
              console.log(`[v0] Units count: ${data.units?.length || 0}`)
              
              if (data.units && data.units.length > 0) {
                const prices = data.units.map((u: any) => u.price)
                console.log(`[v0] Prices array: [${prices.slice(0, 3).join(', ')}...]`)
                
                const minPrice = Math.min(...prices)
                console.log(`[v0] Min price: $${minPrice}`)
                
                pricingMap[slug] = { buildingId: slug, minPrice, units: data.units }
                console.log(`[v0] Added to pricingMap[${slug}]:`, pricingMap[slug])
              } else {
                console.warn(`[v0] No units found for ${slug}`)
              }
            } else {
              const errorText = await response.text()
              console.error(`[v0] API error ${response.status}: ${errorText}`)
            }
          } catch (err) {
            console.error('[v0] Fetch error for', slug, ':', err instanceof Error ? err.message : String(err))
            console.error('[v0] Error details:', err)
          }
        }
        
        console.log('[v0] Final pricingMap:', pricingMap)
        console.log('[v0] pricingMap keys:', Object.keys(pricingMap))
        setPricingData(pricingMap)
        console.log('[v0] ===== PRICING FETCH END =====')
      } catch (err) {
        console.error('[v0] ===== CRITICAL ERROR in fetchPricingData =====')
        console.error('[v0] Error:', err instanceof Error ? err.message : String(err))
        console.error('[v0] Full error:', err)
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
      console.log(`[v0] ========== RENDERING MARKER FOR ${building.name} (id=${building.id}) ==========`)
      
      const isSelected = selectedBuilding?.id === building.id
      const pricing = pricingData[building.id]
      
      console.log(`[v0]   isSelected: ${isSelected}`)
      console.log(`[v0]   pricing data:`, pricing)
      console.log(`[v0]   pricing exists? ${!!pricing}`)
      console.log(`[v0]   pricing.minPrice: ${pricing?.minPrice}`)
      
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

      console.log(`[v0]   priceText: ${priceText}`)
      console.log(`[v0]   Using badge? ${!!priceText}`)
      
      if (priceText) {
        // Create a badge-style marker with price
        console.log(`[v0]   Rendering PRICE BADGE with text: ${priceText}`)
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
        console.log(`[v0]   Rendering PIN MARKER (color: ${color})`)
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

      console.log(`[v0]   Adding marker to map at [${building.lng}, ${building.lat}]`)
      const marker = new mapboxgl.default.Marker({ element: markerEl })
        .setLngLat([building.lng, building.lat])
        .addTo(map.current)

      markers.current.push(marker)
      console.log(`[v0]   Marker added. Total markers: ${markers.current.length}`)
    })

    // Fly to selected building
    if (selectedBuilding && buildings.includes(selectedBuilding)) {
      console.log('[v0] Flying to selected building:', selectedBuilding.name)
      map.current.flyTo({
        center: [selectedBuilding.lng, selectedBuilding.lat],
        zoom: 14,
        duration: 1000,
      })
    }
    
    console.log('[v0] ===== MARKER RENDER END =====')
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
