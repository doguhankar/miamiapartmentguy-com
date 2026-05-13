"use client"

import { MapPin, DollarSign, CreditCard, Calendar } from "lucide-react"
import { Building, neighborhoodColors } from "@/lib/buildings"
import { Badge } from "@/components/ui/badge"

interface BuildingCardProps {
  building: Building
}

export function BuildingCard({ building }: BuildingCardProps) {
  return (
    <div className="space-y-4">
      <div>
        <img
          src={building.image}
          alt={building.name}
          className="w-full h-40 object-cover rounded-lg"
        />
      </div>

      <div>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{building.name}</h2>
            <Badge className={`${neighborhoodColors[building.neighborhood]} mt-1`}>
              {building.neighborhood}
            </Badge>
          </div>
          <span className="text-sm font-bold text-foreground">{building.priceTier}</span>
        </div>
        <div className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
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
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-blue-600">Hold Days</p>
              <p className="font-medium text-blue-700">{building.holdDays.join(", ")} days available</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
