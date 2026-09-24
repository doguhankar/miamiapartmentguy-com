"use client"

import { useEffect } from "react"

export function AgentListViewBeacon({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `mag_viewed_${slug}`
    let alreadyViewed = false
    try {
      alreadyViewed = sessionStorage.getItem(key) === "1"
    } catch {
      alreadyViewed = false
    }
    if (alreadyViewed) return

    const timer = window.setTimeout(() => {
      if (document.visibilityState !== "visible") return
      try {
        sessionStorage.setItem(key, "1")
      } catch {
        // ignore
      }
      fetch(`/api/agent-lists/${encodeURIComponent(slug)}/view`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {})
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [slug])

  return null
}
