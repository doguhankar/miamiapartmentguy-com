"use client"

import { useState, useEffect } from "react"
import { Search, Settings } from "lucide-react"
import { buildings, Building } from "@/lib/buildings"
import { MapView } from "@/components/map-view"
import { BuildingCard } from "@/components/building-card"
import { FilterPanel } from "@/components/filter-panel"

export default function Home() {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(buildings[0] || null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    price: "all",
    units: [] as string[],
    income: "all",
    credit: "all",
    guarantorOnly: false,
    holdDays: "all",
  })

  const filteredBuildings = buildings.filter((b) => {
    if (searchTerm && !b.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (filters.price !== "all" && b.priceTier !== filters.price) {
      return false
    }
    if (filters.units.length > 0 && !filters.units.some((u) => b.units.includes(u))) {
      return false
    }
    if (filters.income !== "all" && b.incomeReq !== filters.income) {
      return false
    }
    if (filters.credit !== "all" && b.creditReq !== filters.credit) {
      return false
    }
    if (filters.guarantorOnly && !b.guarantor) {
      return false
    }
    if (filters.holdDays !== "all" && !b.holdDays.includes(parseInt(filters.holdDays))) {
      return false
    }
    return true
  })

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0066CC]">
            <span className="text-sm font-bold text-white">M</span>
          </div>
          <h1 className="text-xl font-semibold text-foreground">Miami Rentals</h1>
        </div>

        <div className="hidden flex-1 mx-8 md:block">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search buildings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{filteredBuildings.length} results</span>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Filters Sidebar */}
        <FilterPanel filters={filters} setFilters={setFilters} />

        {/* Map */}
        <div className="flex-1">
          <MapView
            selectedBuilding={selectedBuilding}
            onSelectBuilding={setSelectedBuilding}
            buildings={filteredBuildings}
          />
        </div>

        {/* Right Panel - Building List & Details */}
        <div className="hidden w-96 border-l border-border bg-card lg:flex lg:flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Buildings ({filteredBuildings.length})
            </h2>

            {filteredBuildings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-muted-foreground">No buildings match your filters</p>
              </div>
            ) : (
              <div className="space-y-3 mb-6">
                {filteredBuildings.map((building) => (
                  <button
                    key={building.id}
                    onClick={() => setSelectedBuilding(building)}
                    className={`w-full rounded-lg border-2 p-3 text-left transition ${
                      selectedBuilding?.id === building.id
                        ? "border-[#0066CC] bg-blue-50"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm">{building.name}</h3>
                        <p className="text-xs text-muted-foreground">{building.neighborhood}</p>
                      </div>
                      <span className="text-xs font-bold text-foreground">{building.priceTier}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      ${building.priceMin.toLocaleString()} - ${building.priceMax.toLocaleString()}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {building.units.map((unit) => (
                        <span key={unit} className="text-xs bg-muted px-2 py-0.5 rounded">
                          {unit}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedBuilding && filteredBuildings.includes(selectedBuilding) && (
            <div className="border-t border-border p-6">
              <BuildingCard building={selectedBuilding} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
