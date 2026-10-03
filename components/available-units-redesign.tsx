'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, X, Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAgentList } from '@/components/agent-list-provider'

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
  beds?: number | null
  baths?: number | null
  buildingName?: string | null
  unitType?: string | null
}

interface FloorPlanGroup {
  code: string
  bedType: string
  sqft?: number
  units: FloorPlanUnit[]
  floorPlanImage?: string | null
}

const TABS = ['Studio', '1BR', '2BR', '3BR']
const TEAL = '#0B7F7A'
const TEAL_DARK = '#0E9A93'
const TEAL_TEXT = '#04342C'
const CARD_BG = '#FFFFFF'
const CARD_BORDER = '#DDDDDD'
const TAB_BORDER = '#DDDDDD'
const MUTED = '#6A6A6A'
const TEXT = '#222222'
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
  const { showHearts, toggle, has } = useAgentList()
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
        .select('unitnumber, price, beds, baths, sqft, availabilitydate, floor_plan_code, plan_name, floor_plan_image, buildingname, unittype')
        .eq('building_id', buildingId)

      if (cancelled) return

      const byCode = new Map<string, FloorPlanGroup>()
      ;(data ?? []).forEach((row: any) => {
        // Some units are missing floor_plan_code entirely. Rather than hide
        // real available inventory, fall back to plan_name, then unittype,
        // then a generic bed-count label so every priced unit still surfaces.
        const code: string = row.floor_plan_code || row.plan_name || row.unittype || bedTypeLabel(row.beds)
        const unit: FloorPlanUnit = {
          unitNumber: row.unitnumber ?? undefined,
          price: typeof row.price === 'number' ? row.price : undefined,
          sqft: typeof row.sqft === 'number' ? row.sqft : undefined,
          availabilityDate: row.availabilitydate ?? null,
          floorPlanImage: row.floor_plan_image ?? null,
          beds: typeof row.beds === 'number' ? row.beds : null,
          baths: typeof row.baths === 'number' ? row.baths : null,
          buildingName: row.buildingname ?? null,
          unitType: row.unittype ?? null,
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
                  border: active ? '1px solid #222222' : `1px solid ${TAB_BORDER}`,
                  background: active ? '#222222' : '#fff',
                  color: active ? '#fff' : MUTED,
                  cursor: 'pointer',
                }}
              >
                {tab}
              </button>
            )
          })}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, alignItems: 'start' }}>
        {loading ? (
          <div style={{ padding: 14, color: MUTED, fontSize: 12 }}>Loading floor plans…</div>
        ) : filteredGroups.length === 0 ? (
          <div style={{ padding: 14, color: MUTED, fontSize: 12 }}>Floor plan data not available yet.</div>
        ) : (
          filteredGroups.map((group) => {
            const prices = group.units.map((u) => u.price).filter((v): v is number => typeof v === 'number')
            return (
              <div key={group.code} style={{ position: 'relative', background: CARD_BG, border: `1px solid ${CARD_BORDER}`, borderRadius: 14, overflow: 'hidden' }}>
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
                  style={{ width: '100%', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ position: 'relative', width: '100%', height: 196, background: '#ffffff' }}>
                    <button
                      type="button"
                      onClick={(event) => { event.stopPropagation(); setSelectedImage(group.floorPlanImage || '/placeholder.svg') }}
                      aria-label={`View larger ${group.code} floor plan`}
                      style={{ width: '100%', height: '100%', padding: 0, border: 0, background: 'transparent', cursor: 'zoom-in' }}
                    >
                      <img
                        src={group.floorPlanImage || '/placeholder.svg'}
                        alt={`${group.bedType} floor plan`}
                        onError={(event) => { event.currentTarget.src = '/placeholder.svg' }}
                        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }}
                      />
                    </button>
                    {(() => { const availability = formatAvail(group.units[0]?.availabilityDate); return <span style={{ position: 'absolute', top: 14, left: 14, padding: '5px 11px', borderRadius: 999, background: availability.now ? '#EAF5DC' : '#FFF2D6', color: availability.now ? AVAIL_NOW : AVAIL_LATER, fontSize: 12, fontWeight: 700 }}>{availability.label}</span> })()}
                  </div>
                  <div style={{ padding: '18px 20px 20px' }}>
                    <div style={{ fontFamily: 'var(--font-archivo)', fontSize: 18, fontWeight: 700, color: TEXT }}>Plan {group.code}</div>
                    <div style={{ marginTop: 5, fontSize: 15, color: MUTED }}>{group.sqft ? `${group.sqft.toLocaleString()} sqft · ` : ''}{group.units.length} available</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 14 }}>
                      <span style={{ fontFamily: 'var(--font-archivo)', fontSize: 22, fontWeight: 800, color: TEAL }}>{prices.length ? fmt(Math.min(...prices)) : 'Contact'}<span style={{ marginLeft: 4, fontFamily: 'inherit', fontSize: 15, fontWeight: 400, color: MUTED }}>{prices.length ? '/mo' : ''}</span></span>
                      <span style={{ color: TEXT, fontSize: 14, fontWeight: 600, textDecoration: 'underline' }}>View units</span>
                    </div>
                  </div>
                </div>
                {expandedPlans[group.code] && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: `1px solid ${CARD_BORDER}`, paddingTop: 12 }}>
                    {group.units.map((unit) => {
                      const availability = formatAvail(unit.availabilityDate)
                      const canHeart = showHearts && Boolean(buildingId) && Boolean(unit.unitNumber)
                      const saved = canHeart ? has(buildingId, unit.unitNumber as string) : false
                      return (
                        <div key={unit.unitNumber ?? `${group.code}-${unit.price}-${unit.sqft}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, fontSize: 12, color: TEXT }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {canHeart && (
                              <button
                                type="button"
                                aria-label={saved ? `Remove unit ${unit.unitNumber} from list` : `Add unit ${unit.unitNumber} to list`}
                                aria-pressed={saved}
                                onClick={(event) => {
                                  event.stopPropagation()
                                  toggle({
                                    building_id: buildingId,
                                    unit_number: unit.unitNumber as string,
                                    building_name: unit.buildingName ?? null,
                                    unit_type: unit.unitType ?? null,
                                    beds: unit.beds ?? null,
                                    baths: unit.baths ?? null,
                                    price: unit.price ?? null,
                                  })
                                }}
                                style={{ display: 'grid', placeItems: 'center', width: 24, height: 24, padding: 0, border: 0, background: 'transparent', cursor: 'pointer', flexShrink: 0 }}
                              >
                                <Heart size={16} aria-hidden="true" style={{ color: saved ? '#E5285A' : MUTED, fill: saved ? '#E5285A' : 'none' }} />
                              </button>
                            )}
                            <span>{unit.unitNumber ? `Unit ${unit.unitNumber}` : 'Unit available'}</span>
                          </span>
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
