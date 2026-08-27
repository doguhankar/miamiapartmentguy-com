'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// `floor_plan_code` now exists on public.units (added via migration) and is
// backfilled for Flow Brickell with placeholder codes: real Studio mapping
// (S02/S03/S04/S06) plus a {bed-prefix}{last-two-digits} convention for
// 1BR/2BR/3BR pending Don's real plan-code naming.
const FLOOR_PLAN_CODE_ENABLED = true

interface FloorPlanUnit {
  unitNumber?: string
  price?: number
  sqft?: number
  availabilityDate?: string | null
  floorPlanImage?: string | null
}

interface FloorPlanGroup {
  code: string
  bedType: string
  sqft?: number
  units: FloorPlanUnit[]
  floorPlanImage?: string | null
}

const TABS = ['Studio', '1BR', '2BR', '3BR']
const TEAL = '#19C6C0'
const TEAL_DARK = '#0F6E56'
const TEAL_TEXT = '#04342C'
const CARD_BG = '#F9F8F6'
const CARD_BORDER = '#D3D1C7'
const TAB_BORDER = '#B4B2A9'
const MUTED = '#888780'
const TEXT = '#3D3D3A'
const AVAIL_NOW = '#639922'
const AVAIL_LATER = '#92660B'

function fmt(n: number) {
  return '$' + n.toLocaleString()
}

function formatAvail(rawDate: string | null | undefined): { label: string; now: boolean } {
  if (!rawDate) return { label: 'Avail now', now: true }
  const today = new Date().toISOString().slice(0, 10)
  if (rawDate <= today) return { label: 'Avail now', now: true }
  const d = new Date(rawDate + 'T00:00:00')
  return { label: `Avail ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, now: false }
}

function bedTypeLabel(beds: number | null | undefined): string {
  if (beds === 0) return 'Studio'
  if (typeof beds === 'number') return `${beds}BR`
  return 'Studio'
}

export function AvailableUnitsRedesign({ buildingId }: { buildingId: string }) {
  const [groups, setGroups] = useState<FloorPlanGroup[]>([])
  const [loading, setLoading] = useState(FLOOR_PLAN_CODE_ENABLED)
  const [activeTab, setActiveTab] = useState<string>('')
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({})
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    if (!FLOOR_PLAN_CODE_ENABLED) {
      setGroups([])
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadFloorPlans() {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('units')
        .select('unitnumber, price, beds, sqft, availabilitydate, floor_plan_code, floor_plan_image')
        .eq('building_id', buildingId)
        .not('floor_plan_code', 'is', null)

      if (cancelled) return

      const byCode = new Map<string, FloorPlanGroup>()
      ;(data ?? []).forEach((row: any) => {
        const code = row.floor_plan_code as string
        const unit: FloorPlanUnit = {
          unitNumber: row.unitnumber ?? undefined,
          price: typeof row.price === 'number' ? row.price : undefined,
          sqft: typeof row.sqft === 'number' ? row.sqft : undefined,
          availabilityDate: row.availabilitydate ?? null,
          floorPlanImage: row.floor_plan_image ?? null,
        }
        const existing = byCode.get(code)
        if (existing) {
          existing.units.push(unit)
        } else {
          byCode.set(code, {
            code,
            bedType: bedTypeLabel(row.beds),
            sqft: typeof row.sqft === 'number' ? row.sqft : undefined,
            units: [unit],
            floorPlanImage: row.floor_plan_image ?? null,
          })
        }
      })

      const loadedGroups = Array.from(byCode.values())
      setGroups(loadedGroups)
      setActiveTab((current) => current || TABS.find((tab) => loadedGroups.some((g) => g.bedType === tab)) || '')
      setLoading(false)
    }

    loadFloorPlans()

    return () => {
      cancelled = true
    }
  }, [buildingId])

  const availableTabs = TABS.filter((tab) => groups.some((g) => g.bedType === tab))
  const filteredGroups = groups.filter((g) => g.bedType === activeTab)

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ paddingTop: 14 }}>
      {groups.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {availableTabs.map((tab) => {
            const active = activeTab === tab
            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab)
                }}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 500,
                  border: active ? `0.5px solid ${TEAL_DARK}` : `0.5px solid ${TAB_BORDER}`,
                  background: active ? TEAL : '#fff',
                  color: active ? TEAL_TEXT : MUTED,
                  cursor: 'pointer',
                }}
              >
                {tab}
              </button>
            )
          })}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
        {loading ? (
          <div style={{ padding: 14, color: MUTED, fontSize: 12 }}>Loading floor plans…</div>
        ) : filteredGroups.length === 0 ? (
          <div style={{ padding: 14, color: MUTED, fontSize: 12 }}>Floor plan data not available yet.</div>
        ) : (
          filteredGroups.map((group) => {
            const prices = group.units.map((u) => u.price).filter((v): v is number => typeof v === 'number')
            return (
              <div key={group.code} style={{ background: '#f2f0ea', border: `1px solid ${CARD_BORDER}`, borderRadius: 12, overflow: 'hidden', padding: '10px 12px' }}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedPlans((current) => ({ ...current, [group.code]: !current[group.code] }))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setExpandedPlans((current) => ({ ...current, [group.code]: !current[group.code] }))
                    }
                  }}
                  aria-expanded={Boolean(expandedPlans[group.code])}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 0, cursor: 'pointer', textAlign: 'left' }}
                >
                  <button
                    type="button"
                    onClick={(event) => { event.stopPropagation(); setSelectedImage(group.floorPlanImage || '/placeholder.svg') }}
                    aria-label={`View larger ${group.code} floor plan`}
                    style={{ padding: 0, border: 0, background: 'transparent', cursor: 'zoom-in', flexShrink: 0 }}
                  >
                    <img
                      src={group.floorPlanImage || '/placeholder.svg'}
                      alt={`${group.bedType} floor plan`}
                      onError={(event) => { event.currentTarget.src = '/placeholder.svg' }}
                      style={{ width: 88, height: 88, display: 'block', flexShrink: 0, objectFit: 'cover', borderRadius: 8, border: `1px solid ${CARD_BORDER}`, background: '#ffffff' }}
                    />
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0A0F1C' }}>
                      Plan {group.code}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b6b68', margin: '2px 0 6px' }}>
                      {group.sqft ? `${group.sqft.toLocaleString()} sqft · ` : ''}
                      {group.units.length} available
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: TEAL_DARK }}>
                      {prices.length ? `${fmt(Math.min(...prices))}+` : 'Contact'}
                    </div>
                  </div>
                </div>
                {expandedPlans[group.code] && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: `1px solid ${CARD_BORDER}`, paddingTop: 12 }}>
                    {group.units.map((unit) => {
                      const availability = formatAvail(unit.availabilityDate)
                      return (
                        <div key={unit.unitNumber ?? `${group.code}-${unit.price}-${unit.sqft}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 12, color: TEXT }}>
                          <span>{unit.unitNumber ? `Unit ${unit.unitNumber}` : 'Unit available'}</span>
                          <span>{unit.price ? fmt(unit.price) : 'Contact'} · <span style={{ color: availability.now ? AVAIL_NOW : AVAIL_LATER }}>{availability.label}</span></span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
      </div>

      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Floor plan preview"
          onClick={() => setSelectedImage(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'rgba(0, 0, 0, 0.82)' }}
        >
          <div onClick={(event) => event.stopPropagation()} style={{ position: 'relative', width: 'min(900px, 100%)', minWidth: 'min(600px, calc(100vw - 48px))', maxWidth: 'calc(100vw - 48px)', maxHeight: '94vh', background: '#fff', borderRadius: 12, padding: 16 }}>
            <button type="button" onClick={() => setSelectedImage(null)} aria-label="Close floor plan preview" style={{ position: 'absolute', top: 8, right: 8, zIndex: 1, display: 'grid', placeItems: 'center', width: 32, height: 32, border: 0, borderRadius: '50%', background: 'rgba(0, 0, 0, 0.65)', color: '#fff', cursor: 'pointer' }}>
              <X aria-hidden="true" />
            </button>
            <img
              src={selectedImage}
              alt="Larger floor plan preview"
              onError={(event) => { event.currentTarget.src = '/placeholder.svg' }}
              style={{ display: 'block', width: '100%', minHeight: 420, maxHeight: 'calc(94vh - 32px)', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
