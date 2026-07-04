"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { buildings, Building } from "@/lib/buildings"
import { MapView } from "@/components/map-view"

// ─── Design tokens ───────────────────────────────────────────────
const INK = "#0B1220"
const PANEL = "#0F1B30"
const LINE = "rgba(255,255,255,.12)"
const MUT = "#7E8CA0"
const TXT2 = "#B8C4D4"
const AQUA = "#19C6C0"
const FLAMINGO = "#FF4D8D"
const SUN = "#FFC24B"

// ─── Neighborhoods available in the dataset ─────────────────────
const ALL_NEIGHBORHOODS = ["All", "Brickell", "Downtown", "Edgewater", "Midtown", "Wynwood", "Coral Gables", "Little Havana", "Las Olas"]
const ALL_BEDS = ["Any", "Studio", "1B", "2B", "3B"]
const ALL_PRICES = ["Any", "Under $2,000", "$2,000–$2,500", "$2,500–$3,000", "$3,000+"]

function priceInRange(price: number, range: string): boolean {
  if (range === "Any") return true
  if (range === "Under $2,000") return price < 2000
  if (range === "$2,000–$2,500") return price >= 2000 && price < 2500
  if (range === "$2,500–$3,000") return price >= 2500 && price < 3000
  if (range === "$3,000+") return price >= 3000
  return true
}

// ─── Ticker ──────────────────────────────────────────────────────
function Ticker() {
  const items = [
    { label: "Flow Brickell — 1BD from $2,841 · 2 months free" },
    { label: "CMPND Downtown — from $1,950 · brand new" },
    { label: "The Dorsey Wynwood — from $2,100 · 6 weeks free" },
    { label: "Parkline — from $2,120 · waived admin" },
    { label: "Modera Riverside — from $2,500 · 50% off first 60 days" },
    { label: "Solitair Brickell — from $2,654 · free first month + parking" },
  ]
  const repeated = [...items, ...items]

  return (
    <div
      aria-hidden="true"
      style={{
        background: FLAMINGO,
        color: "#fff",
        overflow: "hidden",
        whiteSpace: "nowrap",
        fontWeight: 700,
        fontSize: "12.5px",
        letterSpacing: ".06em",
        textTransform: "uppercase",
      }}
    >
      <div className="mag-ticker-track" style={{ display: "inline-block", padding: "8px 0" }}>
        {repeated.map((item, i) => (
          <span key={i}>
            <span style={{ color: INK, margin: "0 6px" }}>LIVE</span>
            {item.label}
            <span style={{ margin: "0 16px", opacity: 0.6 }}>✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Nav ─────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        background: "rgba(11,18,32,.88)",
        backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${LINE}`,
      }}
    >
      <div
        style={{
          maxWidth: 1440,
          margin: "0 auto",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 62,
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--font-archivo, 'Archivo', sans-serif)",
            fontWeight: 900,
            fontVariationSettings: "'wdth' 125",
            fontSize: 18,
            textTransform: "uppercase",
            color: "#F6F8F9",
            textDecoration: "none",
          }}
        >
          MIAMI APARTMENT <span style={{ color: FLAMINGO }}>GUY</span>™
        </Link>
        <a
          href="sms:+14077657306?body=Hi%20Don%2C%20I%27m%20looking%20for%20a%20Miami%20apartment"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "11px 20px",
            borderRadius: 999,
            fontWeight: 700,
            fontSize: 14,
            background: FLAMINGO,
            color: "#fff",
            boxShadow: "0 4px 20px rgba(255,77,141,.4)",
            textDecoration: "none",
            transition: "transform .15s",
          }}
        >
          💬 Text Don
        </a>
      </div>
    </nav>
  )
}

// ─── Filter chip ─────────────────────────────────────────────────
function Chip({
  label,
  active,
  onClick,
  dashed,
}: {
  label: string
  active?: boolean
  onClick?: () => void
  dashed?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: PANEL,
        border: `1px ${dashed ? "dashed" : "solid"} ${active ? AQUA : LINE}`,
        borderRadius: 999,
        padding: "10px 18px",
        fontSize: 14,
        fontWeight: 500,
        cursor: "pointer",
        color: active ? AQUA : dashed ? MUT : "#F6F8F9",
        transition: "border-color .15s",
        fontFamily: "inherit",
      }}
    >
      {label} <span style={{ fontSize: 10, color: MUT }}>▼</span>
    </button>
  )
}

// ─── Building card ───────────────────────────────────────────────
function BuildingCard({
  building,
  highlighted,
  onHover,
  onLeave,
}: {
  building: Building
  highlighted: boolean
  onHover: () => void
  onLeave: () => void
}) {
  const hasImage = building.images && building.images.length > 0
  const hasDeal = building.concession && building.concession !== "TBD" && building.concession !== "Contact for current offers" && building.concession !== "No current concessions"

  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        background: PANEL,
        border: `1px solid ${highlighted ? AQUA : LINE}`,
        borderRadius: 18,
        overflow: "hidden",
        marginBottom: 16,
        cursor: "pointer",
        transition: "border-color .15s, transform .15s",
        transform: highlighted ? "translateY(-2px)" : undefined,
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", aspectRatio: "16/9", overflow: "hidden" }}>
        {hasImage ? (
          <img
            src={building.images[0]}
            alt={building.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: `linear-gradient(135deg, #0F1B30, #152341)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: MUT,
              fontSize: 13,
            }}
          >
            {building.neighborhood}
          </div>
        )}
        <span
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            background: "rgba(11,18,32,.85)",
            backdropFilter: "blur(6px)",
            border: `1px solid ${LINE}`,
            borderRadius: 999,
            padding: "5px 12px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: ".1em",
            textTransform: "uppercase",
            color: "#F6F8F9",
          }}
        >
          {building.neighborhood}
        </span>
        {hasDeal && (
          <span
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: SUN,
              color: INK,
              border: "none",
              borderRadius: 999,
              padding: "5px 12px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
            }}
          >
            Deal
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <h3
            style={{
              fontFamily: "var(--font-archivo, 'Archivo', sans-serif)",
              fontVariationSettings: "'wdth' 115",
              textTransform: "uppercase",
              fontSize: 17,
              fontWeight: 900,
              color: "#F6F8F9",
            }}
          >
            {building.name}
          </h3>
          <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
            <span
              style={{
                display: "block",
                fontSize: 11,
                color: MUT,
                textTransform: "uppercase",
                letterSpacing: ".1em",
              }}
            >
              From
            </span>
            <span
              style={{
                fontFamily: "var(--font-archivo, 'Archivo', sans-serif)",
                fontWeight: 900,
                fontSize: 19,
                color: AQUA,
              }}
            >
              ${building.priceMin.toLocaleString()}
            </span>
          </div>
        </div>

        {(building as any).tagline && (
          <p style={{ color: TXT2, fontSize: 13.5, margin: "8px 0 12px" }}>
            {(building as any).tagline}
          </p>
        )}

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
          <span
            style={{
              border: `1px solid rgba(25,198,192,.35)`,
              color: AQUA,
              background: "transparent",
              borderRadius: 999,
              padding: "4px 10px",
              fontSize: 11.5,
            }}
          >
            {building.units.join(" · ")}
          </span>
          {building.amenities.slice(0, 3).map((a) => (
            <span
              key={a}
              style={{
                background: "#152341",
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 11.5,
                color: TXT2,
              }}
            >
              {a}
            </span>
          ))}
          {building.amenities.length > 3 && (
            <span
              style={{
                background: "#152341",
                borderRadius: 999,
                padding: "4px 10px",
                fontSize: 11.5,
                color: TXT2,
              }}
            >
              +{building.amenities.length - 3}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link
            href={`/?building=${building.id}`}
            style={{
              flex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "11px 0",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 13.5,
              background: "transparent",
              border: `1px solid ${LINE}`,
              color: "#F6F8F9",
              textDecoration: "none",
              transition: "border-color .15s, color .15s",
            }}
          >
            View details
          </Link>
          <a
            href={`sms:+14077657306?body=Hi%20Don%2C%20I%27m%20interested%20in%20${encodeURIComponent(building.name)}`}
            style={{
              flex: 1,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "11px 0",
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 13.5,
              background: FLAMINGO,
              color: "#fff",
              boxShadow: "0 4px 20px rgba(255,77,141,.35)",
              textDecoration: "none",
              gap: 6,
            }}
          >
            💬 Text Don
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────
export default function MapPage() {
  const [neighborhood, setNeighborhood] = useState("All")
  const [beds, setBeds] = useState("Any")
  const [priceRange, setPriceRange] = useState("Any")
  const [hoveredBuilding, setHoveredBuilding] = useState<Building | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)

  // Filter buildings
  const filtered = useMemo(() => {
    return buildings.filter((b) => {
      const neighborhoodOk = neighborhood === "All" || b.neighborhood === neighborhood
      const bedsOk = beds === "Any" || b.units.some((u) => u === beds || u.startsWith(beds))
      const priceOk = priceInRange(b.priceMin, priceRange)
      return neighborhoodOk && bedsOk && priceOk
    })
  }, [neighborhood, beds, priceRange])

  const hasFilters = neighborhood !== "All" || beds !== "Any" || priceRange !== "Any"

  function clearFilters() {
    setNeighborhood("All")
    setBeds("Any")
    setPriceRange("Any")
  }

  // Neighborhood cycle on chip click
  function cycleNeighborhood() {
    const idx = ALL_NEIGHBORHOODS.indexOf(neighborhood)
    setNeighborhood(ALL_NEIGHBORHOODS[(idx + 1) % ALL_NEIGHBORHOODS.length])
  }

  function cycleBeds() {
    const idx = ALL_BEDS.indexOf(beds)
    setBeds(ALL_BEDS[(idx + 1) % ALL_BEDS.length])
  }

  function cyclePrice() {
    const idx = ALL_PRICES.indexOf(priceRange)
    setPriceRange(ALL_PRICES[(idx + 1) % ALL_PRICES.length])
  }

  return (
    <div style={{ background: INK, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Ticker />
      <Nav />

      {/* Filter bar */}
      <div
        style={{
          position: "sticky",
          top: 62,
          zIndex: 55,
          background: "rgba(11,18,32,.92)",
          backdropFilter: "blur(14px)",
          borderBottom: `1px solid ${LINE}`,
          padding: "14px 0",
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: "0 20px",
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <Chip
            label={`Neighborhood: ${neighborhood}`}
            active={neighborhood !== "All"}
            onClick={cycleNeighborhood}
          />
          <Chip
            label={`Beds: ${beds}`}
            active={beds !== "Any"}
            onClick={cycleBeds}
          />
          <Chip
            label={`Price: ${priceRange}`}
            active={priceRange !== "Any"}
            onClick={cyclePrice}
          />
          {hasFilters && (
            <Chip label="✕ Clear filters" dashed onClick={clearFilters} />
          )}
          <div style={{ marginLeft: "auto", fontSize: 13, color: MUT }}>
            <span
              style={{
                fontFamily: "var(--font-archivo, 'Archivo', sans-serif)",
                fontWeight: 900,
                color: SUN,
                fontSize: 16,
              }}
            >
              {filtered.length}
            </span>{" "}
            buildings live
          </div>
        </div>
      </div>

      {/* Split: Map + List */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 520px",
          height: "calc(100vh - 104px)",
          minHeight: 640,
          flex: 1,
        }}
        className="map-split"
      >
        {/* Map */}
        <div
          style={{
            position: "relative",
            borderRight: `1px solid ${LINE}`,
            overflow: "hidden",
          }}
        >
          <MapView
            buildings={filtered}
            selectedBuilding={selectedBuilding}
            highlightedBuilding={hoveredBuilding}
            onSelectBuilding={(b) => setSelectedBuilding(b)}
          />
          {/* Bottom hint */}
          <div
            style={{
              position: "absolute",
              left: 20,
              bottom: 20,
              background: PANEL,
              border: `1px solid ${LINE}`,
              borderRadius: 14,
              padding: "14px 18px",
              fontSize: 13,
              color: TXT2,
              maxWidth: 280,
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <span style={{ color: "#F6F8F9", fontWeight: 700 }}>Tap a pin</span> for live pricing, or skip it all — text Don your budget and get quotes back today.
          </div>
        </div>

        {/* Building list */}
        <div
          style={{
            overflowY: "auto",
            padding: 18,
            background: INK,
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: MUT,
              }}
            >
              <p style={{ fontSize: 16, marginBottom: 8 }}>No buildings match these filters.</p>
              <button
                onClick={clearFilters}
                style={{
                  background: "transparent",
                  border: `1px solid ${LINE}`,
                  color: AQUA,
                  borderRadius: 999,
                  padding: "10px 20px",
                  cursor: "pointer",
                  fontSize: 14,
                  fontFamily: "inherit",
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            filtered.map((b) => (
              <BuildingCard
                key={b.id}
                building={b}
                highlighted={hoveredBuilding?.id === b.id || selectedBuilding?.id === b.id}
                onHover={() => setHoveredBuilding(b)}
                onLeave={() => setHoveredBuilding(null)}
              />
            ))
          )}
        </div>
      </div>

      {/* Responsive styles injected inline */}
      <style>{`
        @media (max-width: 1020px) {
          .map-split {
            grid-template-columns: 1fr !important;
            height: auto !important;
          }
          .map-split > div:first-child {
            height: 420px;
            border-right: none !important;
            border-bottom: 1px solid ${LINE};
          }
        }
      `}</style>
    </div>
  )
}
