"use client"

import { useState } from "react"
import { Heart, Share2, ArrowLeft } from "lucide-react"
import { Building } from "@/lib/buildings"
import { ImageCarousel } from "@/components/image-carousel"

interface BuildingDetailViewProps {
  building: Building
  onBack: () => void
}

interface Unit {
  floorPlanType: string
  beds: number | null
  baths: number
  sqft: number
  price: number
  availableDate: string
}

export function BuildingDetailView({ building, onBack }: BuildingDetailViewProps) {
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState("all")
  const [isHearted, setIsHearted] = useState(false)

  // Get minimum price from units
  const minPrice = units.length > 0 ? Math.min(...units.map(u => u.price)) : building.priceMin

  // Filter units by bed count
  const getFilteredUnits = () => {
    if (selectedTab === "all") return units
    if (selectedTab === "studio") return units.filter(u => u.beds === null)
    if (selectedTab === "1") return units.filter(u => u.beds === 1)
    if (selectedTab === "2") return units.filter(u => u.beds === 2)
    if (selectedTab === "3") return units.filter(u => u.beds === 3)
    return units
  }

  const filteredUnits = getFilteredUnits()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const getUnitTypeLabel = (unit: Unit) => {
    if (unit.beds === null) return "Studio"
    return `${unit.beds} Bed${unit.beds > 1 ? 's' : ''}`
  }

  const formatAvailabilityDate = (availableDate: string | null) => {
    if (!availableDate) {
      return "Contact for availability"
    }

    const lowerDate = availableDate.toLowerCase()
    
    // If it says "available now" or is today's date, show "Available Now"
    if (lowerDate === "available now" || lowerDate === "available immediately") {
      return "Available Now"
    }

    // Check if it's today's date
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    if (availableDate === todayStr) {
      return "Available Now"
    }

    // If it's a future date in YYYY-MM-DD format, format as "Available Month DD"
    const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/
    const match = availableDate.match(dateRegex)
    if (match) {
      const [_, year, month, day] = match
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      const monthName = date.toLocaleDateString('en-US', { month: 'long' })
      return `Available ${monthName} ${parseInt(day)}`
    }

    // Fallback: return as-is if format is unexpected
    return availableDate
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", backgroundColor: "#fff" }}>
      {/* Photo carousel */}
      <div style={{ position: "relative", height: "220px" }}>
        <ImageCarousel images={building.images} />
        {/* Back button overlay */}
        <button
          onClick={onBack}
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            background: "rgba(0,0,0,0.6)",
            border: "none",
            borderRadius: "6px",
            padding: "8px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
          aria-label="Go back"
        >
          <ArrowLeft size={20} color="#fff" />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", width: "100%", overflowY: "auto", flex: 1 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "12px", color: "#888", marginBottom: "2px" }}>{building.neighborhood}</p>
            <h1 style={{ fontSize: "20px", fontWeight: 500, marginBottom: "2px" }}>{building.name}</h1>
            <p style={{ fontSize: "12px", color: "#888" }}>{building.address}</p>
          </div>
          <div style={{ display: "flex", gap: "12px", paddingTop: "4px" }}>
            <button
              onClick={() => setIsHearted(!isHearted)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
              aria-label="Save"
            >
              <Heart size={20} fill={isHearted ? "#dc2626" : "none"} stroke={isHearted ? "#dc2626" : "#999"} />
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(window.location.href)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px" }}
              aria-label="Share"
            >
              <Share2 size={20} stroke="#999" />
            </button>
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", margin: "12px 0" }}>
          {building.concession && (
            <span style={{ fontSize: "11px", fontWeight: 500, padding: "4px 10px", borderRadius: "6px", background: "#EAF3DE", color: "#3B6D11" }}>
              {building.concession}
            </span>
          )}
          <span style={{ fontSize: "11px", fontWeight: 500, padding: "4px 10px", borderRadius: "6px", background: "#E6F1FB", color: "#185FA5" }}>
            100% commission
          </span>
          {building.management && (
            <span style={{ fontSize: "11px", fontWeight: 500, padding: "4px 10px", borderRadius: "6px", background: "#FAEEDA", color: "#854F0B" }}>
              {building.management}
            </span>
          )}
        </div>

        {/* Starting price */}
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "16px" }}>
          <span style={{ fontSize: "12px", color: "#888" }}>Starting at</span>
          <span style={{ fontSize: "22px", fontWeight: 500, color: "#185FA5" }}>${minPrice}/mo</span>
          <span style={{ fontSize: "12px", color: "#aaa" }}>· {units.length} units available</span>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "16px 0" }} />

        {/* Requirements */}
        <p style={{ fontSize: "11px", fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
          Requirements
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" }}>
          {[
            building.requirements?.income || { label: "Income", value: building.incomeReq || "2.5×" },
            building.requirements?.creditScore || { label: "Credit score", value: building.creditReq || "650+" },
            building.requirements?.guarantor || { label: "Guarantor", value: building.guarantor ? "Accepted" : "Not required" },
            building.requirements?.holdDays || { label: "Hold days", value: building.holdDays?.length > 0 ? `${Math.min(...building.holdDays)}-${Math.max(...building.holdDays)} days` : "30/60/90" },
          ].map((r) => (
            <div key={r.label} style={{ background: "#f7f7f7", borderRadius: "8px", padding: "10px 12px" }}>
              <div style={{ fontSize: "11px", color: "#888", marginBottom: "3px" }}>{r.label}</div>
              <div style={{ fontSize: "14px", fontWeight: 500 }}>{r.value}</div>
            </div>
          ))}
        </div>

        <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "16px 0" }} />

        {/* Move-In Fees */}
        {building.moveInFees && building.moveInFees.length > 0 && (
          <>
            <p style={{ fontSize: "11px", fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
              Move-in fees
            </p>
            {building.moveInFees.map((fee, idx) => (
              <div key={idx}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <span style={{ color: "#555" }}>{fee.type}</span>
                  <span style={{ fontWeight: 500 }}>{`$${fee.amount.toLocaleString()}`}</span>
                </div>
              </div>
            ))}
          </>
        )}

        <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "16px 0" }} />

        {/* Monthly Charges */}
        {building.monthlyCharges && building.monthlyCharges.length > 0 && (
          <>
            <p style={{ fontSize: "11px", fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
              Monthly charges
            </p>
            {building.monthlyCharges.map((charge, idx) => (
              <div key={idx}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <span style={{ color: "#555" }}>{charge.type}</span>
                  <span style={{ fontWeight: 500 }}>{charge.amount === 0 ? "Included" : `$${charge.amount.toLocaleString()}/mo`}</span>
                </div>
              </div>
            ))}
          </>
        )}

        <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "16px 0" }} />

        {/* Available units section with tabs */}
        <p style={{ fontSize: "11px", fontWeight: 500, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
          Available units
        </p>

        {/* Unit tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #eee", marginBottom: "16px" }}>
          {["all", "studio", "1", "2", "3"].map((tab) => {
            const labels: Record<string, string> = { all: "All", studio: "Studio", "1": "1 bed", "2": "2 bed", "3": "3 bed" }
            return (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                style={{
                  padding: "8px 14px",
                  fontSize: "13px",
                  border: "none",
                  background: "none",
                  borderBottom: selectedTab === tab ? "2px solid #000" : "2px solid transparent",
                  fontWeight: selectedTab === tab ? 500 : 400,
                  color: selectedTab === tab ? "#000" : "#888",
                  cursor: "pointer",
                }}
              >
                {labels[tab]}
              </button>
            )
          })}
        </div>

        {/* Unit rows */}
        {loading ? (
          <p style={{ color: "#888", fontSize: "14px" }}>Loading units...</p>
        ) : error ? (
          <p style={{ color: "#dc2626", fontSize: "14px" }}>{error}</p>
        ) : filteredUnits.length === 0 ? (
          <p style={{ color: "#888", fontSize: "14px" }}>No units available in this category</p>
        ) : (
          filteredUnits.map((unit, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                border: "1px solid #eee",
                borderRadius: "8px",
                marginBottom: "8px",
              }}
            >
              <div>
                <div style={{ fontSize: "18px", fontWeight: 500, color: "#185FA5" }}>${unit.price}/mo</div>
                <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>
                  {getUnitTypeLabel(unit)} · {unit.baths} ba · {unit.sqft} sqft{unit.floorPlanType ? ` · Floor ${unit.floorPlanType}` : ""}
                </div>
              </div>
              <span style={{ fontSize: "11px", padding: "3px 8px", borderRadius: "6px", background: "#EAF3DE", color: "#3B6D11" }}>
                {formatAvailabilityDate(unit.availableDate)}
              </span>
            </div>
          ))
        )}

        <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "16px 0" }} />

        {/* CTA */}
        <div style={{ display: "flex", gap: "8px", marginTop: "20px", paddingBottom: "20px" }}>
          <button
            onClick={() => {
              if (building.phone) window.location.href = `sms:${building.phone}`
            }}
            style={{
              flex: 1,
              padding: "13px",
              borderRadius: "8px",
              background: "#185FA5",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Text Don about {building.name}
          </button>
          <button
            onClick={() => {
              if (building.phone) window.location.href = `tel:${building.phone}`
            }}
            style={{
              flex: 1,
              padding: "13px",
              borderRadius: "8px",
              background: "#f7f7f7",
              color: "#000",
              fontSize: "14px",
              fontWeight: 500,
              border: "1px solid #eee",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            Call Don
          </button>
        </div>
      </div>
    </div>
  )
}
