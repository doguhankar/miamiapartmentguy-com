"use client"

import { X, MapPin, DollarSign, CreditCard, Sparkles } from "lucide-react"
import { Building, neighborhoodColors } from "@/lib/buildings"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface BuildingCardProps {
  building: Building
  onClose: () => void
  onQualify: () => void
}

export function BuildingCard({ building, onClose, onQualify }: BuildingCardProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      <div className="relative">
        <img
          src={building.image}
          alt={building.name}
          className="h-48 w-full object-cover sm:h-56"
        />
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-md hover:bg-background"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="absolute bottom-3 left-3">
          <Badge className={neighborhoodColors[building.neighborhood]}>
            {building.neighborhood}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-4">
        <h2 className="text-xl font-semibold text-foreground">{building.name}</h2>
        <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span>{building.address}</span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Income Requirement</p>
              <p className="font-medium text-foreground">
                ${building.incomeRequirement.toLocaleString()}/mo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Credit Score</p>
              <p className="font-medium text-foreground">{building.creditRequirement}+</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-emerald-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
              <Sparkles className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-emerald-600">Move-in Special</p>
              <p className="font-medium text-emerald-700">{building.moveInSpecial}</p>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-foreground">Amenities</p>
          <div className="flex flex-wrap gap-1.5">
            {building.amenities.map((amenity) => (
              <Badge key={amenity} variant="secondary" className="text-xs">
                {amenity}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-foreground">Pricing</p>
          <div className="space-y-1.5">
            {building.units.map((unit) => (
              <div
                key={unit.type}
                className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">{unit.type}</span>
                <span className="font-medium text-foreground">{unit.priceRange}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-4">
          <Button
            onClick={onQualify}
            className="w-full bg-[#0066CC] text-white hover:bg-[#0055AA]"
            size="lg"
          >
            See If You Qualify
          </Button>
        </div>
      </div>
    </div>
  )
}
