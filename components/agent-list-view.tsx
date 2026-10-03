import Link from "next/link"
import type { PublicListItem } from "@/lib/agent-lists"

const TEAL_DARK = "#0F6E56"
const TEAL_TEXT = "#04342C"
const INK = "#0A0F1C"
const MUTED = "#6b6b68"
const BORDER = "#E2E0D8"
const CARD_BG = "#F9F8F6"
const PAGE_BG = "#FFFFFF"

export type AgentListViewData = {
  slug: string | null
  title: string | null
  createdAt: string | null
  agentName: string
  agentPhone: string
  items: PublicListItem[]
}

function fmtPrice(n: number | null | undefined): string {
  return typeof n === "number" ? "$" + n.toLocaleString() : "Contact"
}

function fmtAvail(raw: string | null | undefined): string {
  if (!raw) return "Available now"
  const today = new Date().toISOString().slice(0, 10)
  if (raw <= today) return "Available now"
  const d = new Date(raw + "T00:00:00")
  return "Available " + d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function fmtDate(raw: string | null): string {
  if (!raw) return ""
  const d = new Date(raw)
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
}

function bedBathSqft(item: PublicListItem): string {
  const s = item.snapshot
  const parts: string[] = []
  if (s.beds === 0) parts.push("Studio")
  else if (typeof s.beds === "number") parts.push(`${s.beds} bd`)
  if (typeof s.baths === "number") parts.push(`${s.baths} ba`)
  if (typeof s.sqft === "number") parts.push(`${s.sqft.toLocaleString()} sqft`)
  return parts.join(" · ")
}

export function AgentListView({ data, preview = false }: { data: AgentListViewData; preview?: boolean }) {
  const { items, agentName, agentPhone, title, createdAt, slug } = data
  const count = items.length
  const heading = title || "Apartment picks"
  const listUrl = slug ? `miamiapartmentguy.com/l/${slug}` : "miamiapartmentguy.com"
  const smsListBody = encodeURIComponent(`Hi, I'm looking at ${listUrl}`)

  return (
    <div style={{ background: PAGE_BG, color: INK, minHeight: "100%", fontFamily: "inherit" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "28px 18px 132px" }}>
        <header style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2, margin: 0, color: INK, textWrap: "balance" }}>
            {heading}
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: 14, color: MUTED }}>
            {count} {count === 1 ? "unit" : "units"} · Picked by {agentName}
          </p>
          {createdAt && (
            <p style={{ margin: "2px 0 0", fontSize: 13, color: MUTED }}>Prices as of {fmtDate(createdAt)}</p>
          )}
        </header>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {items.map((item) => {
            const s = item.snapshot
            const photo = s.photo_url || s.floor_plan_image || "/placeholder.svg"
            const unavailable = item.live === null
            const price = unavailable ? s.price : item.live?.price ?? s.price
            const avail = unavailable ? null : item.live?.available_date ?? s.available_date
            const smsSimilar = `sms:${agentPhone}?&body=${encodeURIComponent(
              `Hi ${agentName}, is there something similar to ${s.building_name ?? "this unit"} unit ${s.unit_number}?`,
            )}`

            return (
              <div
                key={`${item.building_id}::${item.unit_number}`}
                style={{
                  border: `1px solid ${BORDER}`,
                  borderRadius: 14,
                  overflow: "hidden",
                  background: unavailable ? CARD_BG : "#fff",
                  opacity: unavailable ? 0.92 : 1,
                }}
              >
                <Link
                  href={`/buildings/${item.building_id}`}
                  style={{ display: "block", color: "inherit", textDecoration: "none" }}
                >
                  <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 10", background: "#eceae4" }}>
                    <img
                      src={photo || "/placeholder.svg"}
                      alt={s.building_name ? `${s.building_name} unit ${s.unit_number}` : `Unit ${s.unit_number}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        filter: unavailable ? "grayscale(0.6)" : "none",
                      }}
                    />
                    {unavailable && (
                      <span
                        style={{
                          position: "absolute",
                          top: 10,
                          left: 10,
                          background: "rgba(10,15,28,0.82)",
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 600,
                          padding: "4px 8px",
                          borderRadius: 6,
                        }}
                      >
                        No longer available
                      </span>
                    )}
                  </div>
                  <div style={{ padding: "12px 14px 4px" }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: INK }}>
                      {s.building_name || "Building"}
                    </div>
                    <div style={{ fontSize: 13, color: MUTED, margin: "2px 0 6px" }}>
                      Unit {s.unit_number}
                      {bedBathSqft(item) ? ` · ${bedBathSqft(item)}` : ""}
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: TEAL_DARK }}>
                      {fmtPrice(price)}
                      {!unavailable && (
                        <span style={{ fontSize: 13, fontWeight: 500, color: MUTED }}>{` · ${fmtAvail(avail)}`}</span>
                      )}
                    </div>
                  </div>
                </Link>

                <div style={{ padding: "6px 14px 14px" }}>
                  {item.note && (
                    <p
                      style={{
                        margin: "6px 0 0",
                        fontSize: 13,
                        lineHeight: 1.5,
                        color: TEAL_TEXT,
                        background: "#EAF7F2",
                        border: `1px solid #CDE9DF`,
                        borderRadius: 10,
                        padding: "8px 10px",
                      }}
                    >
                      {item.note}
                    </p>
                  )}
                  {unavailable && (
                    <a
                      href={smsSimilar}
                      style={{
                        display: "inline-block",
                        marginTop: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        color: TEAL_DARK,
                        textDecoration: "none",
                      }}
                    >
                      Text {agentName} for something similar →
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ marginTop: 22, textAlign: "center" }}>
          <Link href="/map" style={{ fontSize: 14, fontWeight: 600, color: TEAL_DARK, textDecoration: "none" }}>
            Browse all apartments →
          </Link>
        </div>

        <footer style={{ marginTop: 26, paddingTop: 16, borderTop: `1px solid ${BORDER}`, fontSize: 12, color: MUTED, textAlign: "center" }}>
          305 International Realty · Doguhan Karahan, FL License SL3581300
        </footer>
      </div>

      {!preview && (
        <div
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 60,
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(8px)",
            borderTop: `1px solid ${BORDER}`,
            padding: "10px 14px calc(10px + env(safe-area-inset-bottom))",
          }}
        >
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", gap: 10 }}>
            <a
              href={`sms:${agentPhone}?&body=${smsListBody}`}
              style={{
                flex: 1,
                textAlign: "center",
                background: TEAL_DARK,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                padding: "12px 14px",
                borderRadius: 12,
                textDecoration: "none",
              }}
            >
              Text {agentName} about this list
            </a>
            <a
              href={`tel:${agentPhone}`}
              style={{
                flexShrink: 0,
                textAlign: "center",
                background: "#fff",
                color: TEAL_DARK,
                border: `1.5px solid ${TEAL_DARK}`,
                fontSize: 14,
                fontWeight: 700,
                padding: "12px 18px",
                borderRadius: 12,
                textDecoration: "none",
              }}
            >
              Call
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
