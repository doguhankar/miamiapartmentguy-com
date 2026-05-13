"use client"

import { useState } from "react"
import { Search, Settings } from "lucide-react"
import { buildings, Building } from "@/lib/buildings"
import { StaticMap } from "@/components/static-map"
import { BuildingDetails } from "@/components/building-details"
import { BuildingList } from "@/components/building-list"
import { FilterSidebar } from "@/components/filter-sidebar"
import { QualifyModal } from "@/components/qualify-modal"

export default function Home() {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [showQualifyModal, setShowQualifyModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPrice, setSelectedPrice] = useState("all")
  const [selectedUnits, setSelectedUnits] = useState<string[]>([])
  const [selectedIncome, setSelectedIncome] = useState("all")
  const [selectedCredit, setSelectedCredit] = useState("all")
  const [guarantorOnly, setGuarantorOnly] = useState(false)
  const [selectedHold, setSelectedHold] = useState("all")

  // Filter buildings based on all criteria
  const filteredBuildings = buildings.filter((building) => {
    if (searchTerm && !building.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (selectedPrice !== "all" && building.priceTier !== selectedPrice) return false
    if (selectedUnits.length > 0 && !selectedUnits.some((u) => building.units.includes(u))) return false
    if (selectedIncome !== "all" && building.incomeReq !== selectedIncome) return false
    if (selectedCredit !== "all" && building.creditReq !== selectedCredit) return false
    if (guarantorOnly && !building.guarantor) return false
    if (selectedHold !== "all" && !building.holdDays.includes(parseInt(selectedHold))) return false
    return true
  })

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-sm font-bold text-white">M</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Miami Rentals</h1>
        </div>

        <div className="hidden flex-1 mx-8 md:block">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search buildings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-100 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{filteredBuildings.length} results</span>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100">
            <Settings className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Filter Sidebar */}
        <FilterSidebar
          selectedPrice={selectedPrice}
          setSelectedPrice={setSelectedPrice}
          selectedUnits={selectedUnits}
          setSelectedUnits={setSelectedUnits}
          selectedIncome={selectedIncome}
          setSelectedIncome={setSelectedIncome}
          selectedCredit={selectedCredit}
          setSelectedCredit={setSelectedCredit}
          guarantorOnly={guarantorOnly}
          setGuarantorOnly={setGuarantorOnly}
          selectedHold={selectedHold}
          setSelectedHold={setSelectedHold}
        />

        {/* Map */}
        <div className="flex-1 relative">
          <StaticMap
            buildings={filteredBuildings}
            selectedBuilding={selectedBuilding}
            onBuildingClick={setSelectedBuilding}
          />
        </div>

        {/* Right Panel */}
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
          {!selectedBuilding ? (
            <BuildingList
              buildings={filteredBuildings}
              onSelectBuilding={setSelectedBuilding}
            />
          ) : (
            <BuildingDetails
              building={selectedBuilding}
              onBack={() => setSelectedBuilding(null)}
              onQualify={() => setShowQualifyModal(true)}
            />
          )}
        </div>
      </div>

      {showQualifyModal && selectedBuilding && (
        <QualifyModal
          building={selectedBuilding}
          onClose={() => setShowQualifyModal(false)}
        />
      )}
    </div>
  )
}
