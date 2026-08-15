"use client"

import { Building } from "@/lib/buildings"
import { ImageCarousel } from "./image-carousel"
import { SaveHeartButton } from "./save-heart-button"
import { useState } from "react"
import { Star } from "lucide-react"
import { useBuildingPrice } from "@/hooks/use-building-price"
import { CommissionPill } from "@/components/commission-pill"

interface DesktopBuildingCardProps {
  building: Building
  isHighlighted?: boolean
  isAgentMode?: boolean
  isStarred?: boolean
  hasSavedBadge?: boolean
  onHover?: (building: Building | null) => void
  onClick?: (building: Building) => void
  onStar?: (building: Building) => void
  onViewDetails?: (building: Building) => void
}

const AMENITY_COLORS: Record<string, { bg: string; text: string }> = {
  pool: { bg: "bg-blue-100", text: "text-blue-700" },
  gym: { bg: "bg-green-100", text: "text-green-700" },
  doorman: { bg: "bg-purple-100", text: "text-purple-700" },
  lounge: { bg: "bg-pink-100", text: "text-pink-700" },
  rooftop: { bg: "bg-orange-100", text: "text-orange-700" },
  concierge: { bg: "bg-indigo-100", text: "text-indigo-700" },
  parking: { bg: "bg-yellow-100", text: "text-yellow-700" },
  furnished: { bg: "bg-teal-100", text: "text-teal-700" },
}

function extractAmenities(building: Building): string[] {
  if ("amenities" in building && Array.isArray(building.amenities)) {
    return building.amenities as string[]
  }
  const tagline = building.tagline?.toLowerCase() || ""
  const amenities: string[] = []
  if (tagline.includes("pool")) amenities.push("pool")
  if (tagline.includes("gym")) amenities.push("gym")
  if (tagline.includes("doorman")) amenities.push("doorman")
  if (tagline.includes("rooftop")) amenities.push("rooftop")
  return amenities
}

export function DesktopBuildingCard({
  building,
  isHighlighted = false,
  isAgentMode = false,
  isStarred = false,
  hasSavedBadge = false,
  onHover,
  onClick,
  onStar,
  onViewDetails,
}: DesktopBuildingCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const amenities = extractAmenities(building)
  const { price: dynamicPrice } = useBuildingPrice(building.id, building.priceMin)

  const handleMouseEnter = () => {
    setIsHovered(true)
    onHover?.(building)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    onHover?.(null)
  }

  return (
    <div onClick={() => onClick?.(building)} style={{background:'white', border:'0.5px solid #e5e7eb', borderRadius:12, padding:14, marginBottom:12, cursor:'pointer'}}>
      <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8}}>
        <div>
          <div style={{fontWeight:600, fontSize:15, color:'#111', marginBottom:2}}>{building.name} {isAgentMode && <CommissionPill buildingName={building.name} />}</div>
          <div style={{fontSize:11, color:'#9aa5b8'}}>{building.address}</div>
        </div>
        <span style={{color:'#FF4D8D', fontSize:18, cursor:'pointer'}}>♥</span>
      </div>
      <div style={{display:'flex', gap:12}}>
        <div style={{position:'relative', width:150, height:115, flexShrink:0, borderRadius:8, overflow:'hidden'}}>
          <img src={building.images?.[0]} alt={building.name} style={{width:'100%', height:'100%', objectFit:'cover', display:'block'}} />
          <div style={{position:'absolute', bottom:0, left:0, right:0, background:'rgba(0,0,0,0.55)', padding:'4px 8px', fontSize:9, color:'#fff'}}>Videos • Virtual tours</div>
        </div>
        <div style={{flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
          <div>
            <div style={{display:'flex', marginBottom:6}}>
              <div style={{paddingRight:12, marginRight:12, borderRight:'0.5px solid #e5e7eb'}}><div style={{fontSize:13, fontWeight:500, color:'#19C6C0'}}>{building.priceMin}+</div><div style={{fontSize:10, color:'#9aa5b8'}}>Studio</div></div>
              <div style={{paddingRight:12, marginRight:12, borderRight:'0.5px solid #e5e7eb'}}><div style={{fontSize:13, fontWeight:500, color:'#19C6C0'}}>{building.priceMin}+</div><div style={{fontSize:10, color:'#9aa5b8'}}>1 Bed</div></div>
              <div><div style={{fontSize:13, fontWeight:500, color:'#19C6C0'}}>{building.priceMin}+</div><div style={{fontSize:10, color:'#9aa5b8'}}>2 Beds</div></div>
            </div>
            <span style={{background:'#fef3cd', color:'#92660a', fontSize:10, fontWeight:500, padding:'2px 7px', borderRadius:5, marginBottom:6, display:'inline-block'}}>SPECIALS</span>
            <div style={{fontSize:11, color:'#6b7280', lineHeight:1.4, marginBottom:8}}>{building.amenities.join(', ')}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
