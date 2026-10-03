"use client"

import Link from "next/link"
import { Heart } from "lucide-react"
import { usePathname } from "next/navigation"
import { useAgentList } from "@/components/agent-list-provider"

const TEAL_DARK = "#0F6E56"

export function AgentListBar() {
  const { showHearts, draft } = useAgentList()
  const pathname = usePathname()

  if (!showHearts || draft.length === 0) return null
  // Don't show the bar on the review page itself.
  if (pathname === "/agent/list") return null

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 70,
        display: "flex",
        justifyContent: "center",
        padding: "0 12px calc(12px + env(safe-area-inset-bottom))",
        pointerEvents: "none",
      }}
    >
      <Link
        href="/agent/list"
        style={{
          pointerEvents: "auto",
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          background: TEAL_DARK,
          color: "#fff",
          fontSize: 14,
          fontWeight: 700,
          padding: "12px 20px",
          borderRadius: 999,
          textDecoration: "none",
          boxShadow: "0 8px 24px rgba(15,110,86,0.35)",
        }}
      >
        <Heart size={16} aria-hidden="true" style={{ fill: "#fff" }} />
        {draft.length} · Review list
      </Link>
    </div>
  )
}
