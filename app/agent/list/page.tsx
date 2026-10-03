"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, X, ChevronLeft, Check, Copy, Share2 } from "lucide-react"
import { useAgentList, type DraftUnit } from "@/components/agent-list-provider"
import { AgentListView, type AgentListViewData } from "@/components/agent-list-view"
import type { PublicListItem } from "@/lib/agent-lists"

const TEAL_DARK = "#0F6E56"
const INK = "#0A0F1C"
const MUTED = "#6b6b68"
const BORDER = "#E2E0D8"

function draftToViewData(draft: DraftUnit[], title: string, agentName: string | null): AgentListViewData {
  const now = new Date().toISOString()
  return {
    slug: null,
    title: title.trim() || null,
    createdAt: now,
    agentName: agentName || "Don",
    agentPhone: "+14077657306",
    items: draft.map((u): PublicListItem => ({
      building_id: u.building_id,
      unit_number: u.unit_number,
      note: u.note?.trim() || null,
      snapshot: {
        building_id: u.building_id,
        building_name: u.building_name,
        unit_number: u.unit_number,
        unit_type: u.unit_type,
        beds: u.beds,
        baths: u.baths,
        sqft: null,
        price: u.price,
        available_date: null,
        floor_plan_code: null,
        floor_plan_image: null,
        photo_url: null,
        captured_at: now,
      },
      live: { price: u.price, available_date: null },
    })),
  }
}

export default function AgentListPage() {
  const { isAgent, agentName, draft, setNote, move, remove, clear } = useAgentList()
  const [step, setStep] = useState<"edit" | "review" | "success">("edit")
  const [title, setTitle] = useState("")
  const [customSlug, setCustomSlug] = useState("")
  const [slugState, setSlugState] = useState<{ checking: boolean; available: boolean | null; reason: string | null }>({
    checking: false,
    available: null,
    reason: null,
  })
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Debounced slug check
  useEffect(() => {
    const raw = customSlug.trim()
    if (!raw) {
      setSlugState({ checking: false, available: null, reason: null })
      return
    }
    setSlugState((s) => ({ ...s, checking: true }))
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/agent-lists/slug-check?slug=${encodeURIComponent(raw)}`)
        const data = await res.json()
        setSlugState({ checking: false, available: Boolean(data.available), reason: data.reason ?? null })
      } catch {
        setSlugState({ checking: false, available: null, reason: "Could not check link." })
      }
    }, 400)
    return () => window.clearTimeout(t)
  }, [customSlug])

  const viewData = useMemo(() => draftToViewData(draft, title, agentName), [draft, title, agentName])
  const fullUrl = publishedUrl ? `${typeof window !== "undefined" ? window.location.origin : ""}${publishedUrl}` : ""

  async function handlePublish() {
    setPublishing(true)
    setError(null)
    try {
      const res = await fetch("/api/agent-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || undefined,
          slug: customSlug.trim() || undefined,
          items: draft.map((u) => ({ building_id: u.building_id, unit_number: u.unit_number, note: u.note })),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Could not publish.")
        setStep("edit")
        return
      }
      setPublishedUrl(data.url as string)
      setStep("success")
    } catch {
      setError("Could not publish. Try again.")
      setStep("edit")
    } finally {
      setPublishing(false)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // ignore
    }
  }

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: title.trim() || "Apartment picks", url: fullUrl })
      } catch {
        // user cancelled
      }
    }
  }

  if (!isAgent) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#fff" }}>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: INK, margin: 0 }}>Log in as an agent to build lists</h1>
          <p style={{ fontSize: 14, color: MUTED, margin: "10px 0 18px" }}>
            Agent Lists are only available to approved MAG agents.
          </p>
          <Link
            href="/agent"
            style={{
              display: "inline-block",
              background: TEAL_DARK,
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              padding: "12px 22px",
              borderRadius: 12,
              textDecoration: "none",
            }}
          >
            Go to agent login
          </Link>
        </div>
      </main>
    )
  }

  if (step === "success" && publishedUrl) {
    const waText = encodeURIComponent(fullUrl)
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#fff" }}>
        <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
          <div style={{ display: "grid", placeItems: "center", width: 52, height: 52, borderRadius: "50%", background: "#EAF7F2", margin: "0 auto 14px" }}>
            <Check size={26} style={{ color: TEAL_DARK }} aria-hidden="true" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: INK, margin: 0 }}>List published</h1>
          <p style={{ fontSize: 14, color: MUTED, margin: "8px 0 18px" }}>Share this permanent link with your client.</p>

          <div style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "10px 12px", marginBottom: 12 }}>
            <span style={{ flex: 1, fontSize: 13, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>
              {fullUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, background: TEAL_DARK, color: "#fff", border: 0, borderRadius: 8, padding: "8px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              <Copy size={14} aria-hidden="true" />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {typeof navigator !== "undefined" && "share" in navigator && (
              <button
                type="button"
                onClick={handleShare}
                style={{ display: "inline-flex", justifyContent: "center", alignItems: "center", gap: 8, background: INK, color: "#fff", border: 0, borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                <Share2 size={16} aria-hidden="true" /> Share
              </button>
            )}
            <a
              href={`sms:?&body=${waText}`}
              style={{ textAlign: "center", background: "#fff", color: TEAL_DARK, border: `1.5px solid ${TEAL_DARK}`, borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}
            >
              Text it
            </a>
            <a
              href={`https://wa.me/?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textAlign: "center", background: "#fff", color: TEAL_DARK, border: `1.5px solid ${TEAL_DARK}`, borderRadius: 12, padding: "12px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}
            >
              WhatsApp
            </a>
          </div>

          <button
            type="button"
            onClick={() => {
              clear()
              setPublishedUrl(null)
              setTitle("")
              setCustomSlug("")
              setStep("edit")
            }}
            style={{ marginTop: 18, background: "transparent", border: 0, color: MUTED, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
          >
            Start a new list
          </button>
        </div>
      </main>
    )
  }

  if (step === "review") {
    return (
      <main style={{ minHeight: "100vh", background: "#fff" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(8px)", borderBottom: `1px solid ${BORDER}`, padding: "10px 14px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", gap: 10 }}>
            <button type="button" onClick={() => setStep("edit")} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "transparent", border: 0, color: INK, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              <ChevronLeft size={18} aria-hidden="true" /> Edit
            </button>
            <span style={{ marginLeft: "auto", fontSize: 13, color: MUTED }}>Preview</span>
          </div>
        </div>

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 14px 0" }}>
          <p style={{ fontSize: 13, color: "#92660B", background: "#FBF3E2", border: "1px solid #F0DFB8", borderRadius: 10, padding: "10px 12px" }}>
            This link can&apos;t be changed or deleted after you publish.
          </p>
        </div>

        <AgentListView data={viewData} preview />

        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(8px)", borderTop: `1px solid ${BORDER}`, padding: "10px 14px calc(10px + env(safe-area-inset-bottom))" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {error && <p style={{ margin: "0 0 8px", fontSize: 13, color: "#b3261e" }}>{error}</p>}
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              style={{ width: "100%", background: TEAL_DARK, color: "#fff", border: 0, borderRadius: 12, padding: "13px", fontSize: 15, fontWeight: 700, cursor: publishing ? "default" : "pointer", opacity: publishing ? 0.7 : 1 }}
            >
              {publishing ? "Publishing…" : "Publish list"}
            </button>
          </div>
        </div>
      </main>
    )
  }

  // step === "edit"
  const slugHint = customSlug.trim()
    ? slugState.checking
      ? "Checking…"
      : slugState.available === true
        ? "Available"
        : slugState.reason || "Unavailable"
    : "Leave blank for a random link."
  const slugHintColor = customSlug.trim()
    ? slugState.checking
      ? MUTED
      : slugState.available === true
        ? TEAL_DARK
        : "#b3261e"
    : MUTED

  return (
    <main style={{ minHeight: "100vh", background: "#fff", paddingBottom: 96 }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "22px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Link href="/map" style={{ display: "inline-flex", alignItems: "center", gap: 4, color: INK, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            <ChevronLeft size={18} aria-hidden="true" /> Map
          </Link>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: INK, margin: "0 0 4px" }}>Build a list</h1>
        <p style={{ fontSize: 14, color: MUTED, margin: "0 0 18px" }}>
          {draft.length} {draft.length === 1 ? "unit" : "units"} selected
        </p>

        {draft.length === 0 ? (
          <div style={{ border: `1px dashed ${BORDER}`, borderRadius: 12, padding: 24, textAlign: "center", color: MUTED, fontSize: 14 }}>
            No units yet. Turn on Agent Mode and heart units on any building page.
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: INK, marginBottom: 6 }}>
                List title <span style={{ color: MUTED, fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                type="text"
                value={title}
                maxLength={80}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Brickell 1BRs under $3k"
                style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px", fontSize: 14, color: INK }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: INK, marginBottom: 6 }}>
                Custom link <span style={{ color: MUTED, fontWeight: 400 }}>(optional)</span>
              </label>
              <div style={{ display: "flex", alignItems: "center", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "0 12px" }}>
                <span style={{ fontSize: 13, color: MUTED, flexShrink: 0 }}>/l/</span>
                <input
                  type="text"
                  value={customSlug}
                  maxLength={40}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  placeholder="random"
                  style={{ flex: 1, border: 0, outline: "none", padding: "10px 6px", fontSize: 14, color: INK, background: "transparent" }}
                />
              </div>
              <p style={{ margin: "6px 2px 0", fontSize: 12, color: slugHintColor }}>{slugHint}</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {draft.map((u, index) => (
                <div key={`${u.building_id}::${u.unit_number}`} style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: INK }}>{u.building_name || "Building"}</div>
                      <div style={{ fontSize: 13, color: MUTED, margin: "2px 0" }}>
                        Unit {u.unit_number}
                        {u.beds === 0 ? " · Studio" : typeof u.beds === "number" ? ` · ${u.beds} bd` : ""}
                        {typeof u.baths === "number" ? ` · ${u.baths} ba` : ""}
                        {typeof u.price === "number" ? ` · $${u.price.toLocaleString()}` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                      <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => move(index, index - 1)} style={{ display: "grid", placeItems: "center", width: 30, height: 30, border: 0, background: "transparent", cursor: index === 0 ? "default" : "pointer", opacity: index === 0 ? 0.3 : 1 }}>
                        <ArrowUp size={16} aria-hidden="true" />
                      </button>
                      <button type="button" aria-label="Move down" disabled={index === draft.length - 1} onClick={() => move(index, index + 1)} style={{ display: "grid", placeItems: "center", width: 30, height: 30, border: 0, background: "transparent", cursor: index === draft.length - 1 ? "default" : "pointer", opacity: index === draft.length - 1 ? 0.3 : 1 }}>
                        <ArrowDown size={16} aria-hidden="true" />
                      </button>
                      <button type="button" aria-label={`Remove unit ${u.unit_number}`} onClick={() => remove(u.building_id, u.unit_number)} style={{ display: "grid", placeItems: "center", width: 30, height: 30, border: 0, background: "transparent", cursor: "pointer", color: "#b3261e" }}>
                        <X size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={u.note}
                    maxLength={200}
                    onChange={(e) => setNote(u.building_id, u.unit_number, e.target.value)}
                    placeholder="Add a note for your client (optional)"
                    style={{ width: "100%", marginTop: 8, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: INK }}
                  />
                </div>
              ))}
            </div>

            {error && <p style={{ margin: "14px 0 0", fontSize: 13, color: "#b3261e" }}>{error}</p>}
          </>
        )}
      </div>

      {draft.length > 0 && (
        <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60, background: "rgba(255,255,255,0.96)", backdropFilter: "blur(8px)", borderTop: `1px solid ${BORDER}`, padding: "10px 14px calc(10px + env(safe-area-inset-bottom))" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <button
              type="button"
              onClick={() => {
                setError(null)
                setStep("review")
              }}
              disabled={customSlug.trim() !== "" && slugState.available === false}
              style={{ width: "100%", background: TEAL_DARK, color: "#fff", border: 0, borderRadius: 12, padding: "13px", fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: customSlug.trim() !== "" && slugState.available === false ? 0.6 : 1 }}
            >
              Review &amp; publish
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
