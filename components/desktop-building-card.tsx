"use client"

import { Building } from "@/lib/buildings"
import { useState } from "react"
import { useSupabaseImages } from "@/hooks/use-supabase-images"
import Link from "next/link"
import { CommissionPill } from "@/components/commission-pill"
import { SaveBuildingButton } from "@/components/save-building-button"

interface DesktopBuildingCardProps {
  building: Building
  isHighlighted?: boolean
  isStarred?: boolean
  hasSavedBadge?: boolean
  onHover?: (building: Building | null) => void
  onStar?: (building: Building) => void
}

// Derive price tier display from units array and priceMin
function getPriceTiers(building: Building): Array<{ label: string; price: string }> {
  const tiers: Array<{ label: string; price: string }> = []
  const units = building.units ?? []

  // Map unit abbreviations to display labels
  const labelMap: Record<string, string> = {
    'Studio': 'Studio',
    'studio': 'Studio',
    '1B': '1 Bed',
    '1 Bed': '1 Bed',
    '1 bed': '1 Bed',
    '2B': '2 Beds',
    '2 Bed': '2 Beds',
    '2 bed': '2 Beds',
    '3B': '3 Beds',
    '3+ Bed': '3+ Beds',
  }

  // Price step heuristic per tier based on priceMin
  const base = building.priceMin ?? 2000
  const steps = [0, Math.round(base * 0.3), Math.round(base * 0.65)]

  const displayUnits = units.slice(0, 3)
  displayUnits.forEach((unit, i) => {
    const label = labelMap[unit] ?? unit
    const price = base + (steps[i] ?? 0)
    tiers.push({ label, price: `$${price.toLocaleString()}+` })
  })

  return tiers
}

function hasSpecials(building: Building): boolean {
  const c = building.concession?.toLowerCase() ?? ""
  return c.length > 0 && c !== "none"
}

function truncateAmenities(amenities: string[], maxChars = 56): string {
  if (!amenities || amenities.length === 0) return ""
  const joined = amenities.join(", ")
  if (joined.length <= maxChars) return joined
  return joined.slice(0, maxChars).replace(/,\s*\w*$/, "") + "…"
}

export function DesktopBuildingCard({
  building,
  isHighlighted = false,
  isStarred = false,
  hasSavedBadge = false,
  onHover,
  onClick,
  onStar,
}: DesktopBuildingCardProps) {
  const [localStarred, setLocalStarred] = useState(isStarred)
  const { images: supabaseImages } = useSupabaseImages(building.id)
  const thumbnailSrc = supabaseImages[0] ?? building.images?.[0]

  const priceTiers = getPriceTiers(building)
  const specials = hasSpecials(building)
  const amenityText = truncateAmenities(building.amenities ?? [])

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = !localStarred
    setLocalStarred(next)
    onStar?.(building)
  }

  return (
    <div style={{ position: 'relative' }}>
    <Link
      href={`/buildings/${building.id}`}
      onMouseEnter={() => onHover?.(building)}
      onMouseLeave={() => onHover?.(null)}
      style={{
        display: 'block',
        color: 'inherit',
        textDecoration: 'none',
        background: '#FFFFFF',
        border: isHighlighted ? '1.5px solid #FF4D8D' : '1px solid #E1E5EB',
        borderRadius: '14px',
        padding: '14px',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        boxShadow: isHighlighted ? '0 0 0 3px rgba(255,77,141,0.12)' : 'none',
        marginBottom: '2px',
      }}
      onMouseOver={(e) => {
        if (!isHighlighted) {
          e.currentTarget.style.borderColor = 'rgba(255,77,141,0.45)'
          e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.18)'
        }
      }}
      onMouseOut={(e) => {
        if (!isHighlighted) {
          e.currentTarget.style.borderColor = '#E1E5EB'
          e.currentTarget.style.boxShadow = 'none'
        }
      }}
    >
      {/* Top row: name / address / heart */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontFamily: '"Archivo", sans-serif',
            fontWeight: 700,
            fontSize: '15px',
            color: '#0A0F1C',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
            marginBottom: '2px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {building.name}
          </div>
          <div style={{ fontSize: '11px', color: '#667085', lineHeight: 1.3 }}>
            {building.address}
          </div>
          </div>
          <CommissionPill buildingName={building.name} />

      </div>

      {/* Content row: image + details */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {/* Image */}
        <div style={{
          position: 'relative',
          width: '160px',
          height: '120px',
          flexShrink: 0,
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#F2F4F7',
        }}>
          {thumbnailSrc ? (
            <img
              src={thumbnailSrc}
              alt={building.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #1B2A45, #0F1B30)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', color: '#2A3B52',
            }}>
              &#9679;
            </div>
          )}
          {/* Video / tour overlay tag */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'rgba(0,0,0,0.60)',
            padding: '4px 8px',
            fontSize: '9px', color: '#fff',
            display: 'flex', alignItems: 'center', gap: '5px',
            letterSpacing: '0.04em',
          }}>
            <span style={{ fontSize: '8px' }}>&#9654;</span>
            Videos &bull; Virtual tours
          </div>
        </div>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            {/* Price tiers */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '8px' }}>
              {priceTiers.map((tier, i) => (
                <div
                  key={tier.label}
                  style={{
                    paddingRight: i < priceTiers.length - 1 ? '14px' : '0',
                    borderRight: i < priceTiers.length - 1 ? '0.5px solid #1E2E47' : 'none',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#19C6C0', lineHeight: 1.2 }}>
                    {tier.price}
                  </div>
                  <div style={{ fontSize: '10px', color: '#667085', marginTop: '1px' }}>
                    {tier.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Specials badge */}
            {specials && (
              <div style={{
                display: 'inline-block',
                background: '#FFF4D6',
                color: '#A66B00',
                fontSize: '10px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '6px',
                marginBottom: '7px',
                letterSpacing: '0.04em',
              }}>
                SPECIALS
              </div>
            )}

            {/* Amenities */}
            {amenityText && (
              <div style={{
                fontSize: '11px',
                color: '#667085',
                lineHeight: 1.45,
                marginBottom: specials ? '0' : '7px',
              }}>
                {amenityText}
              </div>
            )}
          </div>

        </div>
      </div>
    </Link>
    <div
      style={{ position: 'absolute', top: '14px', right: '14px', zIndex: 2 }}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
      }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <SaveBuildingButton buildingId={String(building.id)} />
    </div>
    </div>
  )
}
