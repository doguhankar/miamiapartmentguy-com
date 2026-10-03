'use client'

// Client self-saving is retired in favor of agent-built lists (see
// components/agent-list-provider.tsx). This component is intentionally a no-op
// but kept, with its exports and props, so existing imports don't break.
export function SaveBuildingButton(_props: { buildingId: string; label?: boolean }) {
  return null
}
