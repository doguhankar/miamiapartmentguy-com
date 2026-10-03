"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import { useAgentMode } from "@/components/agent-mode-provider"

export type DraftUnit = {
  building_id: string
  unit_number: string
  building_name: string | null
  unit_type: string | null
  beds: number | null
  baths: number | null
  price: number | null
  note: string
}

type ToggleInput = Omit<DraftUnit, "note"> & { note?: string }

type AgentListContextValue = {
  isAgent: boolean
  agentName: string | null
  showHearts: boolean
  draft: DraftUnit[]
  toggle: (unit: ToggleInput) => void
  has: (buildingId: string, unitNumber: string) => boolean
  setNote: (buildingId: string, unitNumber: string, note: string) => void
  move: (from: number, to: number) => void
  remove: (buildingId: string, unitNumber: string) => void
  clear: () => void
}

const AgentListContext = createContext<AgentListContextValue | null>(null)

const STORAGE_KEY = "mag_agent_draft"

function keyOf(buildingId: string, unitNumber: string) {
  return `${buildingId}::${unitNumber}`
}

function loadDraft(): DraftUnit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((u) => u && typeof u.building_id === "string" && typeof u.unit_number === "string")
  } catch {
    return []
  }
}

function saveDraft(draft: DraftUnit[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // ignore quota / privacy-mode failures
  }
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function AgentListProvider({ children }: { children: React.ReactNode }) {
  const { isUnlocked } = useAgentMode()
  const { data } = useSWR<{ agent: boolean; name?: string }>("/api/agent-lists/me", fetcher, {
    revalidateOnFocus: false,
  })
  const isAgent = data?.agent === true
  const agentName = data?.name ?? null

  const [draft, setDraft] = useState<DraftUnit[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setDraft(loadDraft())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) saveDraft(draft)
  }, [draft, hydrated])

  const has = useCallback(
    (buildingId: string, unitNumber: string) =>
      draft.some((u) => u.building_id === buildingId && u.unit_number === unitNumber),
    [draft],
  )

  const toggle = useCallback((unit: ToggleInput) => {
    if (!unit.building_id || !unit.unit_number) return
    setDraft((prev) => {
      const exists = prev.some(
        (u) => u.building_id === unit.building_id && u.unit_number === unit.unit_number,
      )
      if (exists) {
        return prev.filter(
          (u) => !(u.building_id === unit.building_id && u.unit_number === unit.unit_number),
        )
      }
      return [...prev, { ...unit, note: unit.note ?? "" }]
    })
  }, [])

  const setNote = useCallback((buildingId: string, unitNumber: string, note: string) => {
    setDraft((prev) =>
      prev.map((u) =>
        u.building_id === buildingId && u.unit_number === unitNumber
          ? { ...u, note: note.slice(0, 200) }
          : u,
      ),
    )
  }, [])

  const move = useCallback((from: number, to: number) => {
    setDraft((prev) => {
      if (from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next
    })
  }, [])

  const remove = useCallback((buildingId: string, unitNumber: string) => {
    setDraft((prev) =>
      prev.filter((u) => !(u.building_id === buildingId && u.unit_number === unitNumber)),
    )
  }, [])

  const clear = useCallback(() => setDraft([]), [])

  const showHearts = isAgent && isUnlocked

  const value = useMemo<AgentListContextValue>(
    () => ({ isAgent, agentName, showHearts, draft, toggle, has, setNote, move, remove, clear }),
    [isAgent, agentName, showHearts, draft, toggle, has, setNote, move, remove, clear],
  )

  return <AgentListContext.Provider value={value}>{children}</AgentListContext.Provider>
}

export function useAgentList() {
  const ctx = useContext(AgentListContext)
  if (!ctx) throw new Error("useAgentList must be used within AgentListProvider")
  return ctx
}

export { keyOf as agentDraftKey }
