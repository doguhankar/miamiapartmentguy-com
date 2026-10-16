"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import useSWR from "swr"
import { Heart, X } from "lucide-react"
import { useAgentMode } from "@/components/agent-mode-provider"
import { createClient } from "@/lib/supabase/client"

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
  requestToggle: (unit: ToggleInput) => void
  has: (buildingId: string, unitNumber: string) => boolean
  setNote: (buildingId: string, unitNumber: string, note: string) => void
  move: (from: number, to: number) => void
  remove: (buildingId: string, unitNumber: string) => void
  clear: () => void
}

const AgentListContext = createContext<AgentListContextValue | null>(null)

const STORAGE_KEY_PREFIX = "mag_agent_draft"

function storageKey(email: string) {
  return `${STORAGE_KEY_PREFIX}:${encodeURIComponent(email.trim().toLowerCase())}`
}

function keyOf(buildingId: string, unitNumber: string) {
  return `${buildingId}::${unitNumber}`
}

function loadDraft(email: string): DraftUnit[] {
  try {
    const raw = localStorage.getItem(storageKey(email))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((u) => u && typeof u.building_id === "string" && typeof u.unit_number === "string")
  } catch {
    return []
  }
}

function saveDraft(email: string, draft: DraftUnit[]) {
  try {
    localStorage.setItem(storageKey(email), JSON.stringify(draft))
  } catch {
    // ignore quota / privacy-mode failures
  }
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const PENDING_KEY = "mag_agent_pending_save"
const PENDING_TTL_MS = 15 * 60 * 1000
const SIGN_IN_REQUIRED_MESSAGE = "Sign in to save units."

type PendingSave = {
  unit: ToggleInput
  returnTo: string
  authed: boolean
  createdAt: number
}

function readPending(): PendingSave | null {
  try {
    const raw = localStorage.getItem(PENDING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PendingSave
    if (!parsed?.unit?.building_id || !parsed.unit.unit_number) return null
    if (Date.now() - parsed.createdAt > PENDING_TTL_MS) {
      localStorage.removeItem(PENDING_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writePending(pending: PendingSave) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending))
  } catch {
    // ignore quota / privacy-mode failures
  }
}

function clearPending() {
  try {
    localStorage.removeItem(PENDING_KEY)
  } catch {
    // ignore
  }
}

function isSafeReturnPath(path: string) {
  return path.startsWith("/") && !path.startsWith("//")
}

type Notice = { kind: "success" | "error"; text: string }

export function AgentListProvider({ children }: { children: React.ReactNode }) {
  const { isUnlocked, unlockAgentMode } = useAgentMode()
  const router = useRouter()
  const pathname = usePathname()
  const { data, mutate } = useSWR<{ agent: boolean; name?: string }>("/api/agent-lists/me", fetcher, {
    revalidateOnFocus: false,
  })
  const isAgent = data?.agent === true
  const agentName = data?.name ?? null

  const [draft, setDraft] = useState<DraftUnit[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [signInUnit, setSignInUnit] = useState<ToggleInput | null>(null)
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null)
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    const sb = createClient()
    let active = true
    void sb.auth.getUser().then(({ data: { user } }) => {
      if (active) setSignedInEmail(user?.email?.trim().toLowerCase() ?? null)
    })
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event, session) => {
      setSignedInEmail(session?.user?.email?.trim().toLowerCase() ?? null)
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") mutate()
      // OAuth lands on the allowlisted /agent URL; send the user back to the unit they tapped.
      if (event === "SIGNED_IN" && session?.user && window.location.pathname === "/agent") {
        const pending = readPending()
        if (pending && isSafeReturnPath(pending.returnTo)) {
          writePending({ ...pending, authed: true })
          setTimeout(() => router.replace(pending.returnTo), 0)
        }
      }
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [mutate, router])

  useEffect(() => {
    setHydrated(false)
    if (!signedInEmail) {
      setDraft([])
      return
    }
    setDraft(loadDraft(signedInEmail))
    setHydrated(true)
  }, [signedInEmail])

  useEffect(() => {
    if (hydrated && signedInEmail) saveDraft(signedInEmail, draft)
  }, [draft, hydrated, signedInEmail])

  // After the OAuth round trip: complete the tapped save for signed-in users.
  useEffect(() => {
    if (!hydrated || data === undefined || pathname === "/agent") return
    const pending = readPending()
    if (!pending || !pending.authed) return
    clearPending()
    unlockAgentMode()
    if (data.agent) {
      const { unit } = pending
      setDraft((prev) =>
        prev.some((u) => u.building_id === unit.building_id && u.unit_number === unit.unit_number)
          ? prev
          : [...prev, { ...unit, note: unit.note ?? "" }],
      )
      setNotice({ kind: "success", text: `Unit ${unit.unit_number} saved to your list.` })
    } else {
      setNotice({ kind: "error", text: SIGN_IN_REQUIRED_MESSAGE })
    }
  }, [hydrated, data, pathname, unlockAgentMode])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 5000)
    return () => clearTimeout(timer)
  }, [notice])

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

  // Hearts are shown on the PIN alone. Saving is still gated: writes need a verified agent
  // (enforced server-side on every publish route), and the sign-in prompt below covers the rest.
  const showHearts = isUnlocked

  const requestToggle = useCallback(
    (unit: ToggleInput) => {
      if (!unit.building_id || !unit.unit_number) return
      if (isAgent) {
        toggle(unit)
        return
      }
      setAuthError(null)
      setSignInUnit(unit)
    },
    [isAgent, toggle],
  )

  const closeSignIn = useCallback(() => {
    setSignInUnit(null)
    setAuthError(null)
    setAuthBusy(false)
  }, [])

  const startSignIn = useCallback(async () => {
    if (!signInUnit) return
    setAuthBusy(true)
    setAuthError(null)
    try {
      const sb = createClient()
      if (signedInEmail) await sb.auth.signOut()
      writePending({
        unit: signInUnit,
        returnTo: window.location.pathname + window.location.search,
        authed: false,
        createdAt: Date.now(),
      })
      const { error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/agent" },
      })
      if (error) {
        clearPending()
        setAuthError(`Sign-in failed: ${error.message}`)
        setAuthBusy(false)
      }
    } catch {
      clearPending()
      setAuthError("Sign-in failed. Please try again.")
      setAuthBusy(false)
    }
  }, [signInUnit, signedInEmail])

  const value = useMemo<AgentListContextValue>(
    () => ({ isAgent, agentName, showHearts, draft, toggle, requestToggle, has, setNote, move, remove, clear }),
    [isAgent, agentName, showHearts, draft, toggle, requestToggle, has, setNote, move, remove, clear],
  )

  const signedInNotApproved = Boolean(signedInEmail) && !isAgent

  return (
    <AgentListContext.Provider value={value}>
      {children}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            left: 12,
            right: 12,
            bottom: "calc(80px + env(safe-area-inset-bottom))",
            zIndex: 90,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              pointerEvents: "auto",
              maxWidth: 360,
              padding: "12px 18px",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              background: notice.kind === "success" ? "#0F6E56" : "#B42318",
              boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
            }}
          >
            {notice.text}
          </span>
        </div>
      )}
      {signInUnit && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="agent-signin-title"
          onClick={closeSignIn}
          onKeyDown={(event) => {
            if (event.key === "Escape") closeSignIn()
          }}
          style={{ position: "fixed", inset: 0, zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.6)" }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{ position: "relative", width: "100%", maxWidth: 380, padding: 24, borderRadius: 16, background: "#fff", color: "#222" }}
          >
            <button
              type="button"
              onClick={closeSignIn}
              aria-label="Close sign-in"
              style={{ position: "absolute", top: 8, right: 8, display: "grid", placeItems: "center", width: 40, height: 40, border: 0, background: "transparent", cursor: "pointer", color: "#6A6A6A" }}
            >
              <X size={20} aria-hidden="true" />
            </button>
            <Heart size={22} aria-hidden="true" style={{ color: "#E5285A" }} />
            <h2 id="agent-signin-title" style={{ margin: "10px 0 6px", fontSize: 18, fontWeight: 700 }}>
              Sign in to save units
            </h2>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "#6A6A6A" }}>
              {signedInNotApproved
                ? `${signedInEmail} is already signed in. Please continue with a different account if needed.`
                : `Sign in to save unit ${signInUnit.unit_number} to your list.`}
            </p>
            {authError && (
              <p role="alert" style={{ margin: "10px 0 0", fontSize: 14, color: "#B42318" }}>
                {authError}
              </p>
            )}
            <button
              type="button"
              onClick={startSignIn}
              disabled={authBusy}
              style={{ marginTop: 18, width: "100%", minHeight: 44, border: 0, borderRadius: 10, background: "#0F6E56", color: "#fff", fontSize: 15, fontWeight: 700, cursor: authBusy ? "default" : "pointer", opacity: authBusy ? 0.7 : 1 }}
            >
              {authBusy ? "Redirecting…" : signedInNotApproved ? "Use a different account" : "Continue with Google"}
            </button>
          </div>
        </div>
      )}
    </AgentListContext.Provider>
  )
}

export function useAgentList() {
  const ctx = useContext(AgentListContext)
  if (!ctx) throw new Error("useAgentList must be used within AgentListProvider")
  return ctx
}

export { keyOf as agentDraftKey }
