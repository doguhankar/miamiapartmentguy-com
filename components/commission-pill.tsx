"use client"

import { useState } from "react"
import { useAgentMode } from "@/components/agent-mode-provider"

export function CommissionPill({ buildingName }: { buildingName: string }) {
  const { isUnlocked, commissionFor } = useAgentMode()
  const [show, setShow] = useState(false)
  const commission = commissionFor(buildingName)
  if (!isUnlocked || !commission || commission.trim().toUpperCase() === "NO COMMISSION") return null
  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <button type="button" onClick={() => setShow((value) => !value)} aria-expanded={show} style={{ border: "1px solid #B7E7E5", borderRadius: 999, background: "#ECFAF9", color: "#087F7B", padding: "4px 9px", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
        Commission
      </button>
      {show && <span role="status" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20, minWidth: 120, borderRadius: 8, padding: "7px 9px", background: "#0B1220", color: "#fff", fontSize: 11, whiteSpace: "nowrap", boxShadow: "0 5px 16px rgba(11,18,32,.2)" }}>{commission}</span>}
    </span>
  )
}
