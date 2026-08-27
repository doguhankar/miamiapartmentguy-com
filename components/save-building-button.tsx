'use client'

import type { MouseEvent } from 'react'
import { useSaveList } from '@/components/save-list-provider'

export function SaveBuildingButton({ buildingId, label = false }: { buildingId: string; label?: boolean }) {
  const { savedIds, toggleSave } = useSaveList()
  const saved = savedIds.includes(String(buildingId))
  const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    await toggleSave(String(buildingId))
  }
  return <button type="button" aria-label={saved ? 'Remove saved building' : 'Save building'} aria-pressed={saved} onClick={handleClick} className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition-colors ${saved ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background/90 text-foreground hover:border-primary'}`}><span aria-hidden="true" className="text-base leading-none">{saved ? '♥' : '♡'}</span>{label && (saved ? 'Saved' : 'Save')}</button>
}
