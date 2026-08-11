"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"

type CommissionRow = { name: string; commission: string | null }
type AgentModeContextValue = {
  isUnlocked: boolean
  commissionFor: (name: string) => string | null
}

const AgentModeContext = createContext<AgentModeContextValue>({ isUnlocked: false, commissionFor: () => null })
const storageKey = "mag-agent-mode-unlocked"

function useCommissionRows() {
  return useSWR<CommissionRow[]>("agent-commissions", async () => {
    const supabase = createClient()
    const { data, error } = await supabase.from("buildings").select("name, commission")
    if (error) throw error
    return data ?? []
  }, { revalidateOnFocus: false })
}

export function AgentModeProvider({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  useEffect(() => setIsUnlocked(window.localStorage.getItem(storageKey) === "1"), [])
  const { data } = useCommissionRows()
  const commissionMap = useMemo(() => new Map((data ?? []).map((row) => [row.name.trim().toLowerCase(), row.commission])), [data])

  return (
    <AgentModeContext.Provider value={{ isUnlocked, commissionFor: (name) => commissionMap.get(name.trim().toLowerCase()) ?? null }}>
      {children}
    </AgentModeContext.Provider>
  )
}

export function useAgentMode() { return useContext(AgentModeContext) }

export function AgentModeControl() {
  const [open, setOpen] = useState(false)
  const [pin, setPin] = useState("")
  const [error, setError] = useState(false)
  const { isUnlocked } = useAgentMode()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (pin === "1738") {
      window.localStorage.setItem(storageKey, "1")
      window.location.reload()
      return
    }
    setError(true); setPin("")
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Open Agent Mode" style={{ height: 36, border: 0, borderRadius: 999, padding: "0 16px", background: isUnlocked ? "#19C6C0" : "#0B1220", color: "#fff", fontSize: 14, fontWeight: 600, lineHeight: 1, cursor: "pointer" }}>
        Agent Mode
      </button>
      {open && !isUnlocked && (
        <div role="presentation" onMouseDown={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 110, display: "grid", placeItems: "center", padding: 20, background: "rgba(11,18,32,.42)" }}>
          <form role="dialog" aria-modal="true" aria-labelledby="agent-mode-title" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()} style={{ width: "min(100%, 320px)", borderRadius: 18, padding: 24, background: "#fff", boxShadow: "0 20px 60px rgba(11,18,32,.25)" }}>
            <h2 id="agent-mode-title" style={{ margin: 0, color: "#0B1220", fontSize: 20 }}>Agent Mode</h2>
            <p style={{ color: "#667085", fontSize: 13, lineHeight: 1.5 }}>Enter your 4-digit access code to view commission details.</p>
            <input autoFocus inputMode="numeric" pattern="[0-9]*" maxLength={4} value={pin} onChange={(event) => { setPin(event.target.value.replace(/\D/g, "")); setError(false) }} aria-label="4-digit access code" style={{ width: "100%", boxSizing: "border-box", border: "1px solid #D0D5DD", borderRadius: 10, padding: "12px 14px", fontSize: 22, letterSpacing: ".35em", textAlign: "center" }} />
            {error && <p role="alert" style={{ color: "#B42318", fontSize: 12 }}>Incorrect access code.</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}><button type="button" onClick={() => setOpen(false)} style={{ flex: 1, padding: 10, borderRadius: 9, border: "1px solid #D0D5DD", background: "#fff" }}>Cancel</button><button type="submit" style={{ flex: 1, padding: 10, borderRadius: 9, border: 0, background: "#0B1220", color: "#fff", fontWeight: 700 }}>Unlock</button></div>
          </form>
        </div>
      )}
    </>
  )
}
