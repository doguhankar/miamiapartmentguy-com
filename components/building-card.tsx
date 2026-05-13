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
              <p className="text-xs text-muted-foreground">Price Range</p>
              <p className="font-medium text-foreground">
                ${building.priceMin.toLocaleString()} - ${building.priceMax.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Requirements</p>
              <p className="font-medium text-foreground">
                Income: {building.incomeReq} | Credit: {building.creditReq}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
              <Sparkles className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600">Hold Days</p>
              <p className="font-medium text-blue-700">{building.holdDays.join(", ")} days available</p>
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
          <p className="mb-2 text-sm font-medium text-foreground">Available Units</p>
          <div className="flex flex-wrap gap-2">
            {building.units.map((unit) => (
              <Badge key={unit} variant="outline">
                {unit}
              </Badge>
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
