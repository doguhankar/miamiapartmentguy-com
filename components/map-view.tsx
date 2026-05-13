"use client"

import { useRef, useEffect, useCallback } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Building, buildings } from "@/lib/buildings"

interface MapViewProps {
  selectedBuilding: Building | null
  onSelectBuilding: (building: Building) => void
}

const MIAMI_CENTER = { lat: 25.795, lng: -80.19 }
const DEFAULT_ZOOM = 12.5

export function MapView({ selectedBuilding, onSelectBuilding }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<mapboxgl.Marker[]>([])

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
    if (!mapContainer.current || map.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [MIAMI_CENTER.lng, MIAMI_CENTER.lat],
      zoom: DEFAULT_ZOOM,
    })

    map.current.addControl(new mapboxgl.NavigationControl(), "bottom-right")

    buildings.forEach((building) => {
      const el = createMarkerElement(building, false)
      el.addEventListener("click", () => onSelectBuilding(building))

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([building.lng, building.lat])
        .addTo(map.current!)

      markers.current.push(marker)
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [createMarkerElement, onSelectBuilding])

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
