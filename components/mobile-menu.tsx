"use client"

import { X, Building2 } from "lucide-react"
import { Building, buildings, neighborhoodColors } from "@/lib/buildings"
import { Badge } from "@/components/ui/badge"

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelectBuilding: (building: Building) => void
  selectedBuilding: Building | null
}

const neighborhoods = ["All", "Wynwood", "Midtown", "Brickell", "Downtown", "Edgewater"]

export function MobileMenu({
  isOpen,
  onClose,
  onSelectBuilding,
  selectedBuilding,
}: MobileMenuProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#0066CC]" />
            <span className="font-semibold text-foreground">All Buildings</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto border-b border-border p-3">
          {neighborhoods.map((hood) => (
            <Badge
              key={hood}
              variant="secondary"
              className={`cursor-pointer whitespace-nowrap ${
                hood === "All" ? "bg-[#0066CC] text-white hover:bg-[#0055AA]" : ""
              }`}
            >
              {hood}
            </Badge>
          ))}
        </div>

        <div className="overflow-y-auto p-2" style={{ maxHeight: "calc(100vh - 120px)" }}>
          {buildings.map((building) => (
            <button
              key={building.id}
              onClick={() => {
                onSelectBuilding(building)
                onClose()
              }}
              className={`mb-2 w-full rounded-lg p-3 text-left transition-colors ${
                selectedBuilding?.id === building.id
                  ? "bg-[#0066CC]/10 ring-1 ring-[#0066CC]"
                  : "bg-muted/50 hover:bg-muted"
              }`}
            >
              <div className="flex items-start gap-3">
                <img
                  src={building.image}
                  alt={building.name}
                  className="h-16 w-16 rounded-md object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{building.name}</h3>
                  <Badge
                    className={`mt-1 text-xs ${neighborhoodColors[building.neighborhood]}`}
                  >
                    {building.neighborhood}
                  </Badge>
                  <p className="mt-1 text-xs text-muted-foreground">
                    From {building.units[0].priceRange.split("-")[0]}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
