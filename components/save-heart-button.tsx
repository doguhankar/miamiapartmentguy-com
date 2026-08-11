'use client'

import type { MouseEvent } from 'react'
import { useSaveList } from '@/components/save-list-provider'

export function SaveHeartButton({ buildingId }: { buildingId: string }) {
  const { savedIds, toggle } = useSaveList()
  const saved = savedIds.has(String(buildingId))

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    await toggle(String(buildingId))
  }

  return (
    <button
      type="button"
      aria-label={saved ? 'Remove saved building' : 'Save building'}
      aria-pressed={saved}
      onClick={handleClick}
      onPointerDown={(event) => event.stopPropagation()}
      style={{
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(11,18,32,.12)',
        borderRadius: '50%',
        background: '#fff',
        color: saved ? '#FF4D8D' : '#667085',
        cursor: 'pointer',
        fontSize: 21,
        lineHeight: 1,
        boxShadow: '0 2px 8px rgba(11,18,32,.12)',
      }}
    >
      <span aria-hidden="true">{saved ? '♥' : '♡'}</span>
    </button>
  )
}
