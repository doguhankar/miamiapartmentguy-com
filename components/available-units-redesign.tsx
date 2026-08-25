'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Flip this to true once Farhan adds and backfills the `floor_plan_code`
// column on public.units. Until then the column does not exist, so we skip
// the live query entirely instead of issuing a query that would error.
const FLOOR_PLAN_CODE_ENABLED = false

interface FloorPlanUnit {
  unitNumber?: string
  price?: number
  sqft?: number
  availabilityDate?: string | null
}

interface FloorPlanGroup {
  code: string
  bedType: string
  sqft?: number
  units: FloorPlanUnit[]
}

const TABS = ['All', 'Studio', '1BR', '2BR', '3BR']
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
  const [activeTab, setActiveTab] = useState('All')
  const [openCard, setOpenCard] = useState<string | null>(null)

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
        .select('unitnumber, price, beds, sqft, availabilitydate, floor_plan_code')
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
          })
        }
      })

      setGroups(Array.from(byCode.values()))
      setLoading(false)
    }

    loadFloorPlans()

    return () => {
      cancelled = true
    }
  }, [buildingId])

  const availableTabs = TABS.filter((tab) => tab === 'All' || groups.some((g) => g.bedType === tab))
  const filteredGroups = activeTab === 'All' ? groups : groups.filter((g) => g.bedType === activeTab)

  return (
    <div style={{ marginBottom: 20 }}>
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
                  setOpenCard(null)
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ padding: 14, color: MUTED, fontSize: 12 }}>Loading floor plans…</div>
        ) : filteredGroups.length === 0 ? (
          <div style={{ padding: 14, color: MUTED, fontSize: 12 }}>Floor plan data not available yet.</div>
        ) : (
          filteredGroups.map((group) => {
            const isOpen = openCard === group.code
            const prices = group.units.map((u) => u.price).filter((v): v is number => typeof v === 'number')
            return (
              <div key={group.code} style={{ background: CARD_BG, border: `0.5px solid ${CARD_BORDER}`, borderRadius: 10, overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setOpenCard(isOpen ? null : group.code)}
                  style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', border: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, color: TEXT }}>
                      {group.bedType} · Plan {group.code}
                    </div>
                    <div style={{ fontSize: 11, color: MUTED, margin: '2px 0 6px' }}>
                      {group.sqft ? `${group.sqft.toLocaleString()} sqft · ` : ''}
                      {group.units.length} available
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: TEAL_DARK }}>
                      {prices.length ? `${fmt(Math.min(...prices))}+` : 'Contact'}
                    </div>
                  </div>
                  <i
                    className="ti ti-chevron-down"
                    aria-hidden="true"
                    style={{ color: TAB_BORDER, fontSize: 16, marginTop: 2, transition: 'transform 180ms ease', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  />
                </button>

                {isOpen && (
                  <div style={{ borderTop: `0.5px solid ${CARD_BORDER}` }}>
                    {group.units.map((unit, idx) => {
                      const { label, now } = formatAvail(unit.availabilityDate)
                      return (
                        <div
                          key={idx}
                          style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', fontSize: 12, borderTop: idx === 0 ? 'none' : `0.5px solid ${CARD_BORDER}` }}
                        >
                          <span style={{ color: MUTED }}>{unit.unitNumber ? `Unit ${unit.unitNumber}` : 'Unit —'}</span>
                          <span style={{ fontWeight: 500, color: TEXT }}>
                            {unit.price ? fmt(unit.price) : '—'}
                            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: now ? AVAIL_NOW : AVAIL_LATER }}>{label}</span>
                          </span>
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
  )
}
