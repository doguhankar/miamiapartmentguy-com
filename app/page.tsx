"use client"

import { useState } from "react"
import { Menu, Building2 } from "lucide-react"
import { Building, buildings } from "@/lib/buildings"
import { MapView } from "@/components/map-view"
import { BuildingCard } from "@/components/building-card"
import { QualifyModal } from "@/components/qualify-modal"
import { MobileMenu } from "@/components/mobile-menu"

export default function Home() {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [showQualifyModal, setShowQualifyModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileCardOpen, setMobileCardOpen] = useState(false)

  const handleSelectBuilding = (building: Building) => {
    setSelectedBuilding(building)
    setMobileCardOpen(true)
  }

  const handleCloseCard = () => {
    setSelectedBuilding(null)
    setMobileCardOpen(false)
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#0066CC]" />
            <span className="text-lg font-semibold text-foreground">Miami Rentals</span>
          </div>
        </div>
        <div className="hidden text-sm text-muted-foreground lg:block">
          {buildings.length} buildings available
        </div>
      </header>

      {/* Main Content */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Map - Full width on mobile, 70% on desktop */}
        <div className="h-full w-full lg:w-[70%]">
          <MapView
            selectedBuilding={selectedBuilding}
            onSelectBuilding={handleSelectBuilding}
          />
        </div>

        {/* Desktop Side Panel */}
        <div className="hidden w-[30%] border-l border-border bg-card lg:block">
          {selectedBuilding ? (
            <BuildingCard
              building={selectedBuilding}
              onClose={handleCloseCard}
              onQualify={() => setShowQualifyModal(true)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">Select a Building</h3>
              <p className="text-sm text-muted-foreground">
                Click on a pin on the map to view building details, pricing, and check
                your eligibility.
              </p>
            </div>
          )}
        </div>

        {/* Mobile Bottom Card */}
        {selectedBuilding && mobileCardOpen && (
          <div className="fixed inset-x-0 bottom-0 z-40 max-h-[70vh] overflow-hidden rounded-t-2xl bg-card shadow-2xl lg:hidden">
            <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-border" />
            <BuildingCard
              building={selectedBuilding}
              onClose={handleCloseCard}
              onQualify={() => setShowQualifyModal(true)}
            />
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onSelectBuilding={handleSelectBuilding}
        selectedBuilding={selectedBuilding}
      />

      {/* Qualify Modal */}
      {showQualifyModal && selectedBuilding && (
        <QualifyModal
          building={selectedBuilding}
          onClose={() => setShowQualifyModal(false)}
        />
      )}
    </div>
  )
}
