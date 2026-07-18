"use client"

import { useState } from "react"
import { X, ChevronLeft, ChevronRight, Receipt } from "lucide-react"
import { Building } from "@/lib/buildings"
import { useSupabaseImages } from "@/hooks/use-supabase-images"

interface BuildingDetailModalProps {
  building: Building
  onClose: () => void
}

// ── Fee categorisation helpers ────────────────────────────────────────────────

type FeeEntry = { label: string; raw: string | number }

function formatAmount(v: string | number): string {
  if (typeof v === "number") return `$${v.toLocaleString()}`
  const s = String(v).trim()
  if (s === "" || s.toLowerCase() === "tbd" || s.toLowerCase() === "none") return ""
  if (s.startsWith("$")) return s
  const n = parseFloat(s.replace(/[^0-9.]/g, ""))
  if (!isNaN(n) && s === String(n)) return `$${n.toLocaleString()}`
  return s
}

function parseFees(fees?: Record<string, string | number>): FeeEntry[] {
  if (!fees) return []
  return Object.entries(fees)
    .map(([k, v]) => ({ label: k, raw: v }))
    .filter(({ raw }) => {
      const s = String(raw).trim().toLowerCase()
      return s !== "" && s !== "tbd" && s !== "none"
    })
}

function categoriseFees(building: Building): {
  moveIn: FeeEntry[]
  monthly: FeeEntry[]
  petParking: FeeEntry[]
} {
  // Collect all fee sources
  const all: FeeEntry[] = [
    ...parseFees(building.fees),
    ...parseFees(building.moveInFees),
    ...parseFees(building.monthlyCharges),
  ]

  const moveInKw = ["deposit", "application", "admin", "move-in", "movein", "move in", "pet deposit"]
  const monthlyKw = ["monthly", "amenity", "utility", "pest", "trash", "valet", "package", "renters", "insurance", "concierge fee"]
  const petParkingKw = ["parking", "pet fee", "pet rent", "pet"]

  const moveIn: FeeEntry[] = []
  const monthly: FeeEntry[] = []
  const petParking: FeeEntry[] = []
  const seen = new Set<string>()

  for (const entry of all) {
    const key = entry.label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    if (petParkingKw.some((kw) => key.includes(kw))) {
      petParking.push(entry)
    } else if (monthlyKw.some((kw) => key.includes(kw))) {
      monthly.push(entry)
    } else if (moveInKw.some((kw) => key.includes(kw))) {
      moveIn.push(entry)
    } else {
      moveIn.push(entry) // default bucket
    }
  }

  return { moveIn, monthly, petParking }
}

// ── Move-in total estimator ───────────────────────────────────────────────────

function estimateMoveIn(entries: FeeEntry[]): string | null {
  let total = 0
  let hasPet = false
  for (const { label, raw } of entries) {
    const lk = label.toLowerCase()
    const s = String(raw).replace(/[^0-9.]/g, "")
    const n = parseFloat(s)
    if (isNaN(n)) continue
    if (lk.includes("pet")) { hasPet = true; total += n; continue }
    // For ranges like "$1,000–$2,000" take the low end
    const match = String(raw).match(/(\d[\d,.]*)/)
    if (match) {
      const lo = parseFloat(match[1].replace(/,/g, ""))
      if (!isNaN(lo)) total += lo
      else total += n
    } else {
      total += n
    }
  }
  if (total === 0) return null
  return `~$${total.toLocaleString()}+`
}

// ── Sub-components ────────────────────────────────────────────────────────────

const DIVIDER = "rgba(34,48,67,0.5)"
const CARD_BG = "#131c2b"

function FeeGroup({
  label,
  color,
  entries,
  totalRow,
}: {
  label: string
  color: string
  entries: FeeEntry[]
  totalRow?: string | null
}) {
  if (entries.length === 0) return null
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: "1.5px",
          fontWeight: 700,
          color,
          marginBottom: 8,
          marginLeft: 2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ background: CARD_BG, borderRadius: 12, padding: "4px 16px" }}>
        {entries.map(({ label: name, raw }, i) => {
          const amount = formatAmount(raw)
          if (!amount) return null
          return (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "9px 0",
                borderBottom: i < entries.length - 1 ? `0.5px solid ${DIVIDER}` : "none",
              }}
            >
              <span style={{ fontSize: 13.5, color: "#b8c2d0", textTransform: "capitalize" }}>{name}</span>
              <span style={{ fontSize: 13.5, color: "#fff", fontWeight: 600 }}>{amount}</span>
            </div>
          )
        })}
        {totalRow && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "11px 0 9px",
              borderTop: `0.5px solid #FF4D8D`,
              marginTop: 2,
            }}
          >
            <span style={{ fontSize: 13.5, color: "#FF4D8D", fontWeight: 700 }}>Est. Move-In</span>
            <span style={{ fontSize: 14, color: "#FF4D8D", fontWeight: 700 }}>{totalRow}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function BuildingDetailModal({ building, onClose }: BuildingDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const { images: supabaseImages } = useSupabaseImages(building.id)

  const images = supabaseImages.length > 0 ? supabaseImages : (building.images ?? [])

  const nextImage = () => setCurrentImageIndex((i) => (i + 1) % (images.length || 1))
  const prevImage = () => setCurrentImageIndex((i) => (i - 1 + (images.length || 1)) % (images.length || 1))

  const { moveIn, monthly, petParking } = categoriseFees(building)
  const moveInTotal = estimateMoveIn(moveIn)
  const hasFees = moveIn.length > 0 || monthly.length > 0 || petParking.length > 0

  const dealLabel = building.concession && building.concession.toLowerCase() !== "tbd"
    ? building.concession
    : "—"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full rounded-2xl overflow-hidden overflow-y-auto"
        style={{ maxWidth: 480, maxHeight: "90vh", background: "#0B1220", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Close button ── */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-50 flex items-center justify-center rounded-full transition-colors"
          style={{ width: 36, height: 36, background: "rgba(0,0,0,0.5)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.75)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.5)")}
        >
          <X className="h-4 w-4" style={{ color: "#F6F8F9" }} />
        </button>

        {/* ── Image carousel ── */}
        <div
          className="relative w-full"
          style={{ height: 240, background: "linear-gradient(135deg, #1a2a3a, #0B1220)" }}
        >
          {images.length > 0 ? (
            <>
              <img
                src={images[currentImageIndex]}
                alt={`${building.name} ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors"
                style={{ background: "rgba(0,0,0,0.4)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.65)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.4)")}
              >
                <ChevronLeft className="h-5 w-5" style={{ color: "#F6F8F9" }} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors"
                style={{ background: "rgba(0,0,0,0.4)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.65)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.4)")}
              >
                <ChevronRight className="h-5 w-5" style={{ color: "#F6F8F9" }} />
              </button>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span style={{ fontSize: 40, opacity: 0.3 }}>&#9634;</span>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "20px 22px 24px" }}>

          {/* Title */}
          <h2
            style={{
              fontFamily: "Archivo, sans-serif",
              fontSize: 26,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.5px",
              textTransform: "uppercase",
              lineHeight: 1.1,
            }}
          >
            {building.name}
          </h2>
          {building.tagline && (
            <p style={{ fontSize: 14, color: "#8a97a8", marginTop: 4 }}>{building.tagline}</p>
          )}

          {/* ── 3-box stat grid ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
              marginTop: 18,
              marginBottom: 16,
            }}
          >
            {/* DEALS */}
            <div style={{ background: CARD_BG, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, letterSpacing: "1px", color: "#8a97a8", fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                Deals
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#FFC24B", marginTop: 6, lineHeight: 1.3 }}>
                {dealLabel}
              </div>
            </div>

            {/* NEIGHBORHOOD */}
            <div style={{ background: CARD_BG, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, letterSpacing: "1px", color: "#8a97a8", fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                Area
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#19C6C0", marginTop: 6, lineHeight: 1.3 }}>
                {building.neighborhood}
              </div>
            </div>

            {/* GUARANTORS */}
            <div style={{ background: CARD_BG, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, letterSpacing: "1px", color: "#8a97a8", fontWeight: 600, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                Guarantors?
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 6, lineHeight: 1.3 }}>
                {building.guarantor ? "Yes" : "No"}
              </div>
            </div>
          </div>

          {/* ── Fees & Policies ── */}
          {hasFees && (
            <>
              {/* Section header */}
              <div
                style={{
                  background: CARD_BG,
                  borderRadius: 12,
                  padding: "14px 16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Receipt style={{ color: "#FF4D8D", width: 18, height: 18 }} />
                  <span style={{ fontSize: 13, letterSpacing: "1px", color: "#fff", fontWeight: 600, textTransform: "uppercase" }}>
                    Fees &amp; Policies
                  </span>
                </div>
                {/* Chevron pointing up = expanded */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a97a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(180deg)" }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              <FeeGroup
                label="Move-In"
                color="#FF4D8D"
                entries={moveIn}
                totalRow={moveInTotal}
              />
              <FeeGroup
                label="Monthly"
                color="#19C6C0"
                entries={monthly}
              />
              <FeeGroup
                label="Pet &amp; Parking"
                color="#FFC24B"
                entries={petParking}
              />
            </>
          )}

          {/* ── CTA ── */}
          <a
            href={`sms:+14077657306?body=Hi%20Don%2C%20I%27m%20interested%20in%20${encodeURIComponent(building.name)}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "block",
              marginTop: 20,
              background: "#FF4D8D",
              borderRadius: 14,
              padding: 16,
              textAlign: "center",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              textDecoration: "none",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#E53A73")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#FF4D8D")}
          >
            Text Don about this building
          </a>
        </div>
      </div>
    </div>
  )
}
