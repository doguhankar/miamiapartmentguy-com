"use client"

import { useState } from "react"
import { MapPin, DollarSign, CreditCard, Gift } from "lucide-react"
import { Building, neighborhoodColors } from "@/lib/buildings"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ImageCarousel } from "@/components/image-carousel"
import { QualifyModal } from "@/components/qualify-modal"
import { BuildingDetailModal } from "@/components/building-detail-modal"

interface BuildingCardProps {
  building: Building
}

export function BuildingCard({ building }: BuildingCardProps) {
  const [showQualifyModal, setShowQualifyModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)

  return (
    <>
      <div className="space-y-4">
        <ImageCarousel images={building.images} />

        <div>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{building.name}</h2>
              <Badge className={`${neighborhoodColors[building.neighborhood]} mt-1`}>
                {building.neighborhood}
              </Badge>
            </div>
            <span className="text-sm font-bold text-foreground">{building.priceTier}</span>
          </div>
          <div className="flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
            <span>{building.address}</span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="font-medium text-foreground">
                  From ${building.priceMin.toLocaleString()}/mo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Requirements</p>
                <p className="font-medium text-foreground text-sm">
                  {building.incomeReq} income • {building.creditReq} credit
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
                <Gift className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-amber-600">Move-in Special</p>
                <p className="font-medium text-amber-700 text-sm">{building.concession}</p>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Available Units</p>
              <div className="flex flex-wrap gap-2">
                {building.units.map((unit) => (
                  <Badge key={unit} variant="outline" className="text-xs">
                    {unit}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {building.amenities.map((amenity) => (
                  <Badge key={amenity} variant="secondary" className="text-xs">
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              onClick={() => setShowDetailModal(true)}
              className="flex-1 bg-gray-600 text-white hover:bg-gray-700"
            >
              View Details
            </Button>
            <Button
              onClick={() => setShowQualifyModal(true)}
              className="flex-1 bg-[#0066CC] text-white hover:bg-[#0055AA]"
            >
              See If You Qualify
            </Button>
          </div>
        </div>
      </div>

      {showQualifyModal && (
        <QualifyModal building={building} onClose={() => setShowQualifyModal(false)} />
      )}

      {showDetailModal && (
        <BuildingDetailModal building={building} onClose={() => setShowDetailModal(false)} />
      )}
    </>
  )
}
