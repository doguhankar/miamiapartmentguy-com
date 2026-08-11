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
  const [saved, setSaved] = React.useState(false)
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
        position: "relative",
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
              right: 48,
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

        {/* Heart button */}
        <button
          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault() }}
          onMouseDown={(e) => { e.stopPropagation(); e.preventDefault() }}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setSaved((s) => !s)
          }}
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 20,
            background: "white",
            border: "none",
            borderRadius: "50%",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={saved ? "#ef4444" : "none"}
            stroke={saved ? "#ef4444" : "#6b7280"}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
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
            <span style={{ display: "block", fontSize: 11, color: MUT, textTransform: "uppercase", letterSpacing: ".1em" }}>From</span>
            <span style={{ fontFamily: "var(--font-archivo, 'Archivo', sans-serif)", fontWeight: 900, fontSize: 19, color: AQUA }}>
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
          <span style={{ border: `1px solid rgba(25,198,192,.35)`, color: AQUA, background: "transparent", borderRadius: 999, padding: "4px 10px", fontSize: 11.5 }}>
            {building.units.join(" · ")}
          </span>
          {building.amenities.slice(0, 3).map((a) => (
            <span key={a} style={{ background: "#152341", borderRadius: 999, padding: "4px 10px", fontSize: 11.5, color: TXT2 }}>
              {a}
            </span>
          ))}
          {building.amenities.length > 3 && (
            <span style={{ background: "#152341", borderRadius: 999, padding: "4px 10px", fontSize: 11.5, color: TXT2 }}>
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
