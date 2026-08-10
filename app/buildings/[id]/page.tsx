'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { buildings } from '@/lib/buildings'
import { useSupabaseImages } from '@/hooks/use-supabase-images'

// ─── Types ───────────────────────────────────────────────────────────────────
interface LiveUnit {
  unit?: string
  floorPlanType?: string
  beds?: string | number
  sqft?: number
  square_feet?: number
  price?: number
  availableDate?: string | null
  available_date?: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => '$' + n.toLocaleString()

function formatAvail(rawDate: string | null | undefined): { label: string; now: boolean } {
  if (!rawDate) return { label: 'Avail now', now: true }
  const today = new Date().toISOString().slice(0, 10)
  if (rawDate <= today) return { label: 'Avail now', now: true }
  const d = new Date(rawDate + 'T00:00:00')
  return { label: `Avail ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`, now: false }
}

function unitLabel(u: LiveUnit) {
  const t = u.floorPlanType ?? ''
  if (/studio/i.test(t)) return 'Studio'
  if (/3/i.test(t)) return '3 Bed'
  if (/2/i.test(t)) return '2 Bed'
  if (/1/i.test(t)) return '1 Bed'
  return t || '1 Bed'
}

function bedsKey(u: LiveUnit): string {
  const lbl = unitLabel(u)
  if (lbl === 'Studio') return 'Studio'
  if (lbl === '1 Bed') return '1BR'
  if (lbl === '2 Bed') return '2BR'
  if (lbl === '3 Bed') return '3BR'
  return lbl
}

function parseMonthsFree(concession?: string): number {
  if (!concession) return 0
  const m = concession.match(/(\d+)\s*month/i)
  return m ? Number(m[1]) : 0
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const IconBack = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconHeart = ({ filled }: { filled: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#FF3D82' : 'none'} stroke={filled ? '#FF3D82' : 'currentColor'} strokeWidth="2" strokeLinecap="round">
    <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 000-7.6z" />
  </svg>
)
const IconDollar = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
)
const IconHome = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path d="M9 22V12h6v10" />
  </svg>
)
const IconCard = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
  </svg>
)
const IconStar = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.6-6.3 4.6 2.3-7.2-6-4.6h7.6z" />
  </svg>
)
const IconPin = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M21 10c0 7-9 12-9 12s-9-5-9-12a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
)
const IconShare = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 10.6 15.4 6.4M8.6 13.4l6.8 4.2" />
  </svg>
)
const IconCalc = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 2l2.4 7.2H22l-6 4.6 2.3 7.2-6.3-4.6-6.3 4.6 2.3-7.2-6-4.6h7.6z" />
  </svg>
)
const IconPrev = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
)
  const IconNext = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )

function LeasingForm({ buildingName, buildingId, onClose }: { buildingName: string; buildingId: string; onClose: () => void }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [intents, setIntents] = useState<string[]>([])
  const [consent, setConsent] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const toggleIntent = (intent: string) => setIntents(current => current.includes(intent) ? current.filter(item => item !== intent) : [...current, intent])
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setAttempted(true)
    if (!consent || submitting) return
    setSubmitting(true)
    try {
      const response = await fetch('/api/submit-leasing-lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ buildingName, buildingId, ...form, intents }) })
      if (!response.ok) throw new Error('Submission failed')
      setSubmitted(true)
    } catch {
      setSubmitting(false)
    }
  }

  if (submitted) return <div style={{ textAlign: 'center', padding: '28px 8px 12px' }}><div style={{ width: 48, height: 48, margin: '0 auto 14px', borderRadius: '50%', background: '#E8F8EE', color: '#0F9D7A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>✓</div><div style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>Request sent</div><p style={{ color: '#667085', fontSize: 13 }}>The leasing team will be in touch soon.</p><button onClick={onClose} style={{ marginTop: 12, border: 'none', borderRadius: 10, padding: '11px 22px', background: '#19C6C0', color: '#fff', fontWeight: 700 }}>Done</button></div>

  const field = (key: keyof typeof form, label: string, required = false, type = 'text') => <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#667085' }}>{label}{required ? ' *' : ''}<input required={required} type={type} value={form[key]} onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))} style={{ display: 'block', width: '100%', marginTop: 5, padding: '10px 11px', border: '1px solid #E5E7EB', borderRadius: 9, fontSize: 13, color: '#111827', background: '#fff' }} /></label>
  return <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>{field('firstName', 'First name', true)}{field('lastName', 'Last name', true)}</div>
    {field('email', 'Email', true, 'email')}{field('phone', 'Phone')}
    <div><div style={{ fontSize: 11, fontWeight: 700, color: '#667085', marginBottom: 7 }}>I&apos;m interested in</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>{['Schedule a Tour', 'Request more info', 'Confirm Qualifications', 'Custom Message'].map(intent => <label key={intent} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#111827' }}><input type="checkbox" checked={intents.includes(intent)} onChange={() => toggleIntent(intent)} />{intent}</label>)}</div></div>
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, lineHeight: 1.4, color: '#667085' }}><input type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); setAttempted(false) }} style={{ marginTop: 2 }} /> <span>By submitting this form, you agree to be contacted by the property owner, manager, or a third-party partner.</span></label>
    {attempted && !consent && <div style={{ color: '#FF4D8D', fontSize: 11 }}>Please agree to our terms to continue.</div>}
    <button type="submit" disabled={!consent || submitting} style={{ border: 'none', borderRadius: 12, padding: 13, background: consent ? '#19C6C0' : '#D1D5DB', color: '#fff', fontSize: 13, fontWeight: 700, cursor: consent ? 'pointer' : 'not-allowed', pointerEvents: consent ? 'auto' : 'none' }}>{submitting ? 'Sending…' : 'Send request'}</button>
  </form>
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BuildingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const buildingId = params.id as string

  const building = buildings.find(b => b.id === buildingId)
  const { images: supabaseImages } = useSupabaseImages(buildingId)

  const allImages = supabaseImages.length > 0 ? supabaseImages : (building?.images ?? [])
  const [imgIdx, setImgIdx] = useState(0)
  const [saved, setSaved] = useState(false)

  const [liveUnits, setLiveUnits] = useState<LiveUnit[]>([])
  const [showAllUnits, setShowAllUnits] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<LiveUnit | null>(null)
  const [activePriceType, setActivePriceType] = useState<string | null>('Studio')

  const [income, setIncome] = useState<string>('9000')
  const [showLeasingForm, setShowLeasingForm] = useState(false)

  // Fetch live units
  useEffect(() => {
    if (!buildingId) return
    fetch(`/api/prices/${buildingId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.units?.length) {
          setLiveUnits(data.units)
          const first = data.units[0]
          setSelectedUnit(first)
          setActivePriceType(prev => prev ?? bedsKey(first))
        }
      })
      .catch(() => {})
  }, [buildingId])

  // Auto-select first unit of active price type
  useEffect(() => {
    if (!activePriceType) return
    const match = liveUnits.find(u => bedsKey(u) === activePriceType)
    if (match) setSelectedUnit(match)
  }, [activePriceType, liveUnits])

  if (!building) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'Inter, sans-serif', color: '#667085' }}>
        Building not found. <Link href="/map" style={{ marginLeft: 8, color: '#FF3D82' }}>Back to map</Link>
      </div>
    )
  }

  // ── Derived data ────────────────────────────────────────────────────────────
  const monthsFree = parseMonthsFree(building.concession)

  // Build pricing cards from live units
  const ORDER = ['Studio', '1BR', '2BR', '3BR']
  const priceByType: Record<string, number> = {}
  liveUnits.forEach(u => {
    const k = bedsKey(u)
    if (u.price && (!priceByType[k] || u.price < priceByType[k])) priceByType[k] = u.price
  })
  // Fallback from building static data
  if (Object.keys(priceByType).length === 0) {
    const unitMap: Record<string, string> = { 'Studio': 'Studio', '1B': '1BR', '2B': '2BR', '3B': '3BR' }
    building.units.forEach(u => { if (unitMap[u]) priceByType[unitMap[u]] = building.priceMin })
  }
  const priceCards = ORDER.filter(k => priceByType[k])

  const selectedPrice = selectedUnit?.price ?? building.priceMin
  const effectiveRent = monthsFree > 0
    ? Math.round((selectedPrice * 12 - selectedPrice * monthsFree) / 12)
    : selectedPrice
  const savingsPerMo = selectedPrice - effectiveRent

  const totalMoveIn = (building.moveInFees ?? []).reduce((s, f) => s + f.amount, 0)
  const totalMonthly = (building.monthlyCharges ?? []).filter(f =>
    !/(pet fee|parking)/i.test(f.type)
  ).reduce((s, f) => s + f.amount, 0)
  const trueMonthly = effectiveRent + totalMonthly

  // Calculator
  const maxRent = Math.floor((parseFloat(income) || 0) / 3)
  const qualifies = priceCards.filter(k => priceByType[k] <= maxRent)

  // Units list
  const filteredUnits = activePriceType
    ? liveUnits.filter(u => bedsKey(u) === activePriceType)
    : liveUnits
  const visibleUnits = showAllUnits ? filteredUnits : filteredUnits.slice(0, 4)

  const sqft = (u: LiveUnit) => u.sqft ?? u.square_feet
  const avail = (u: LiveUnit) => u.availableDate ?? u.available_date

  // ── Styling tokens ──────────────────────────────────────────────────────────
  const NAVY = '#0B1220'
  const PINK = '#FF3D82'
  const GOLD = '#FFC24B'
  const MUTED = '#6B7280'
  const BORDER = '#ECEDF2'
  const PANEL = '#F8F8FA'
  const TEXT = '#0A0F1C'
  const SUCCESS = '#1B8A4A'
  const SUCCESS_BG = '#E8F8EE'
  const CYAN = '#E0F7FA'
  const CYAN_DARK = '#0097A7'

  return (
    <div className="building-detail-page" style={{ fontFamily: "'Inter', sans-serif", background: '#fff', color: TEXT, height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ── MAIN WRAPPER ── */}
      <div className="building-detail-shell" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <button
          onClick={() => router.push('/map')}
          style={{ position: 'absolute', zIndex: 5, top: 16, left: 18, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', color: TEXT, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.92)', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '8px 11px', boxShadow: '0 2px 8px rgba(10,15,28,0.08)' }}
        >
          <IconBack /> Back to map
        </button>
        {/* ── LEFT SECTION ── */}
        <div className="building-detail-left" style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* HERO */}
          <div style={{ boxSizing: 'border-box', width: '100%', padding: '58px 16px 0', flex: '0 0 338px', minHeight: 338 }}>
            <div style={{ boxSizing: 'border-box', position: 'relative', width: '100%', height: 280, minHeight: 280, borderRadius: 16, overflow: 'hidden', background: '#E5E7EB' }}>
              {allImages[imgIdx] && <Image src={allImages[imgIdx]} alt={`${building.name} photo ${imgIdx + 1}`} fill style={{ objectFit: 'cover' }} priority />}


              {allImages.length > 1 && (
                <div style={{ position: 'absolute', bottom: 12, left: 0, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  {allImages.slice(0, 8).map((_, i) => (
                    <span key={i} style={{ width: i === imgIdx ? 8 : 6, height: i === imgIdx ? 8 : 6, borderRadius: '50%', background: i === imgIdx ? '#FFFFFF' : 'rgba(255,255,255,0.55)', transition: 'all 0.2s', flexShrink: 0 }} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* THUMBNAILS */}
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '12px 16px 0', minHeight: 92, flexShrink: 0 }}>
            {allImages.map((photo, i) => (
              <button key={i} onClick={() => setImgIdx(i)} aria-label={`View photo ${i + 1}`} style={{ position: 'relative', width: 80, height: 80, flexShrink: 0, borderRadius: 12, overflow: 'hidden', border: i === imgIdx ? '2px solid #19C6C0' : 'none', opacity: i === imgIdx ? 1 : 0.7, padding: 0, cursor: 'pointer', background: '#D1D5DB' }}>
                <Image src={photo} alt="" fill style={{ objectFit: 'cover' }} />
              </button>
            ))}
          </div>

          {/* NAME + ADDRESS */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '16px 20px 0', minHeight: 82, flexShrink: 0 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED, marginBottom: 5 }}>{building.neighborhood}</div>
              <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color: TEXT }}>{building.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: MUTED, marginTop: 4 }}><IconPin /> {building.address || building.neighborhood}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button aria-label="Share building" style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '50%', cursor: 'pointer' }}><IconShare /></button>
              <button onClick={() => setSaved(s => !s)} aria-label="Save building" style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: saved ? PINK : MUTED, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '50%', cursor: 'pointer' }}><IconHeart filled={saved} /></button>
            </div>
          </div>

          {/* TOP INFO */}
          <div style={{ padding: '12px 20px 15px', background: '#fff', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}><span style={{ fontSize: 10, color: MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Starting at</span><div><strong style={{ fontFamily: 'var(--font-archivo)', fontSize: 22, color: TEXT }}>{fmt(building.priceMin)}</strong><span style={{ fontSize: 11, color: MUTED, marginLeft: 4 }}>/mo</span></div></div>
            {building.tagline && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5, marginTop: 8 }}>{building.tagline}</div>}
            <div style={{ display: 'flex', gap: 7, marginTop: 9, flexWrap: 'wrap', alignItems: 'center' }}>
              {building.concession && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#FFF6E5', color: '#92660B', borderRadius: 999, padding: '5px 11px', fontSize: 11, fontWeight: 600 }}><IconStar /> {building.concession}</span>}
              {building.holdDays && <span style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>Hold Period: {building.holdDays} days</span>}
            </div>
          </div>

          {/* CONTENT: TWO COLUMNS */}
          <div className="building-detail-content" style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', overflow: 'hidden', borderRight: `1px solid ${BORDER}` }}>

            {/* LEFT COL: Pricing + Units */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 18, borderRight: `1px solid ${BORDER}` }}>

              {/* Pricing Cards */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, fontFamily: 'var(--font-archivo)', fontSize: 13, fontWeight: 800, color: TEXT }}>
                <IconDollar /> Monthly Pricing
              </div>
              <div style={{ display: 'flex', gap: 9, marginBottom: 22 }}>
                {priceCards.map(k => {
                  const active = activePriceType === k
                  return (
                    <button
                      key={k}
                      onClick={() => {
                        setActivePriceType(active ? null : k)
                      }}
                      style={{ flex: 1, background: active ? PINK : PANEL, border: `2px solid ${active ? PINK : 'transparent'}`, borderRadius: 10, padding: '10px 8px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                      <div style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.85)' : MUTED, fontWeight: 600, marginBottom: 5 }}>{k}</div>
                      <div style={{ fontFamily: 'var(--font-archivo)', fontSize: 14, fontWeight: 800, color: active ? '#fff' : TEXT }}>
                        {fmt(priceByType[k])}<sup style={{ fontSize: 9, fontWeight: 500, color: active ? 'rgba(255,255,255,0.7)' : MUTED }}>+</sup>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Units */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, fontFamily: 'var(--font-archivo)', fontSize: 13, fontWeight: 800, color: TEXT }}>
                <IconHome /> Available Units <span style={{ color: MUTED, fontWeight: 500, fontSize: 12 }}>({filteredUnits.length})</span>
              </div>

              {visibleUnits.map((u, i) => {
                const sel = selectedUnit === u
                const { label, now } = formatAvail(avail(u))
                return (
                  <div
                    key={i}
                    onClick={() => setSelectedUnit(u)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${sel ? PINK : BORDER}`, borderRadius: 10, padding: '11px 13px', marginBottom: 9, cursor: 'pointer', background: sel ? '#FFE8F5' : '#fff', transition: 'all 0.15s' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>
                        {u.unit ? `Unit ${u.unit} · ` : ''}{unitLabel(u)}
                      </div>
                      <div style={{ fontSize: 11, color: MUTED }}>{sqft(u) ? `${sqft(u)?.toLocaleString()} sqft` : ''}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                      <div style={{ fontFamily: 'var(--font-archivo)', fontSize: 14, fontWeight: 800, color: TEXT }}>{u.price ? fmt(u.price) : '—'}</div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: now ? SUCCESS_BG : '#FFF6E5', color: now ? SUCCESS : '#92660B' }}>{label}</span>
                    </div>
                  </div>
                )
              })}

              {filteredUnits.length > 4 && (
                <button
                  onClick={() => setShowAllUnits(s => !s)}
                  style={{ width: '100%', padding: '9px', textAlign: 'center', color: MUTED, fontSize: 11, fontWeight: 600, background: 'transparent', border: `1px dashed ${BORDER}`, borderRadius: 8, cursor: 'pointer', marginTop: 6 }}
                >
                  {showAllUnits ? 'Show fewer' : `Show ${filteredUnits.length - 4} more units`} {showAllUnits ? '∧' : '∨'}
                </button>
              )}
            </div>

            {/* RIGHT COL: Building Fees */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, fontFamily: 'var(--font-archivo)', fontSize: 13, fontWeight: 800, color: TEXT }}><IconCard /> Building Fees</div>
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>Initial Fees</div>
                {(building.moveInFees ?? []).map((f, i, arr) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 12, borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none' }}><span>{f.type}{f.type.toLowerCase().includes('deposit') ? '*' : ''}</span><strong>{fmt(f.amount)}</strong></div>)}
                {(building.moveInFees ?? []).some(f => f.type.toLowerCase().includes('deposit')) && <div style={{ fontSize: 10, color: MUTED, marginTop: 6 }}>*Due on move-in or application, not upfront</div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 7, fontWeight: 800, fontSize: 13, borderTop: `2px solid ${BORDER}` }}><span>Total Initial</span><span>{fmt(totalMoveIn)}</span></div>
              </div>
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>Monthly Fees</div>
                {(building.monthlyCharges ?? []).filter(f => !/(pet fee|parking)/i.test(f.type)).map((f, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 12 }}><span>{f.type}</span><strong>{fmt(f.amount)}</strong></div>)}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: 10, marginTop: 8, fontWeight: 800, fontSize: 13, borderRadius: 8, background: CYAN, color: CYAN_DARK }}><span>Total Monthly Fees</span><span>{fmt(totalMonthly)}/mo</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="building-detail-sidebar" style={{ width: 350, flexShrink: 0, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', borderLeft: `1px solid ${BORDER}` }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '22px 20px 140px' }}>

            <div style={{ fontFamily: 'var(--font-archivo)', fontSize: 20, fontWeight: 800, marginBottom: 5, color: TEXT }}>Your Budget Breakdown</div>
            <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, marginBottom: 16 }}>See what you&apos;ll really pay each month, not just the advertised rent.</div>

            <hr style={{ border: 'none', borderTop: `1px solid ${BORDER}`, marginBottom: 22 }} />

            {/* To Qualify */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: MUTED, textTransform: 'uppercase', marginBottom: 12 }}>To Qualify</div>
              {building.requirements ? Object.values(building.requirements).map((req, i, arr) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', fontSize: 13, borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <span style={{ color: TEXT, fontWeight: 600 }}>{req.label}</span>
                  <span style={{ color: req.label.toLowerCase().includes('guarantor') ? SUCCESS : TEXT, fontWeight: 700 }}>
                    {req.label.toLowerCase().includes('guarantor') && building.guarantor ? '✓ ' : ''}{req.value}
                  </span>
                </div>
              )) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', fontSize: 13, borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ fontWeight: 600 }}>Income</span><span style={{ fontWeight: 700 }}>{building.incomeReq} rent</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', fontSize: 13, borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ fontWeight: 600 }}>Credit Score</span><span style={{ fontWeight: 700 }}>{building.creditReq}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', fontSize: 13 }}>
                    <span style={{ fontWeight: 600 }}>Guarantor</span>
                    <span style={{ fontWeight: 700, color: building.guarantor ? SUCCESS : MUTED }}>{building.guarantor ? '✓ Yes' : 'No'}</span>
                  </div>
                </>
              )}
            </div>

            <hr style={{ border: 'none', borderTop: `1px solid ${BORDER}`, marginBottom: 22 }} />

            {/* Income Calculator */}
            <div style={{ background: PANEL, borderRadius: 14, padding: 17, marginBottom: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 800, color: TEXT, marginBottom: 14 }}>
                <IconCalc /> What You Qualify For
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Gross Monthly Income</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 13, color: MUTED }}>$</span>
                <input
                  type="number"
                  value={income}
                  onChange={e => setIncome(e.target.value)}
                  placeholder="0"
                  style={{ flex: 1, padding: '10px 12px', background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10, fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 600, color: TEXT, outline: 'none' }}
                />
              </div>
              <div style={{ background: '#fff', borderRadius: 10, padding: '11px 13px', marginTop: 12, borderLeft: `3px solid ${PINK}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: MUTED, textTransform: 'uppercase', marginBottom: 3 }}>Max Monthly Rent</div>
                <div style={{ fontFamily: 'var(--font-archivo)', fontSize: 22, fontWeight: 800, color: TEXT }}>{fmt(maxRent)}</div>
                <div style={{ fontSize: 11, color: MUTED, marginTop: 5 }}>Based on 3x income rule</div>
              </div>
              {qualifies.length > 0 ? (
                <div style={{ marginTop: 11, padding: '11px 13px', background: SUCCESS_BG, borderRadius: 10, borderLeft: `3px solid ${SUCCESS}` }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: SUCCESS, textTransform: 'uppercase', marginBottom: 3 }}>You Qualify For</div>
                  <div style={{ fontSize: 13, color: TEXT, fontWeight: 600 }}>{qualifies.join(', ')}</div>
                </div>
              ) : (
                <div style={{ marginTop: 11, padding: '11px 13px', background: '#FEF2F2', borderRadius: 10, borderLeft: '3px solid #DC2626' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', marginBottom: 3 }}>Consider a Guarantor</div>
                  <div style={{ fontSize: 12, color: TEXT }}>Your income doesn&apos;t hit the 3x threshold.</div>
                  {building.guarantor && <div style={{ fontSize: 11, color: MUTED, marginTop: 5 }}>This building accepts guarantors.</div>}
                </div>
              )}
            </div>

            {/* Sidebar Move-In */}
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: MUTED, textTransform: 'uppercase', marginBottom: 12 }}>
                Move-In Costs
                {activePriceType && <span style={{ fontSize: 9, fontWeight: 800, color: PINK, background: '#FFF0F5', padding: '2px 8px', borderRadius: 4 }}>{activePriceType}</span>}
              </div>
              {(building.moveInFees ?? []).map((f, i, arr) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 12, borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <span>{f.type}{f.type.toLowerCase().includes('deposit') ? <span style={{ display: 'block', fontSize: 9, color: MUTED }}>*Due on move-in</span> : null}</span>
                  <span style={{ fontWeight: 700 }}>{fmt(f.amount)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0 0', marginTop: 7, fontWeight: 800, fontSize: 13, borderTop: `2px solid ${BORDER}` }}>
                <span>Total Upfront</span><span>{fmt(totalMoveIn)}</span>
              </div>
            </div>

            {/* Effective Monthly */}
            {monthsFree > 0 && (
              <div style={{ background: '#FFFBF0', borderRadius: 12, padding: 14, marginBottom: 16, borderLeft: `3px solid ${GOLD}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#92660B', textTransform: 'uppercase', marginBottom: 7 }}>Effective Monthly Cost</div>
                <div style={{ fontSize: 11, color: '#92660B', marginBottom: 10 }}>With {monthsFree} month{monthsFree > 1 ? 's' : ''} free on 12-month lease</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: MUTED, textDecoration: 'line-through' }}>
                  <span>Listed Price</span><span>{fmt(selectedPrice)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontWeight: 800, fontSize: 15, marginTop: 7, paddingTop: 7, borderTop: `1px solid rgba(146,102,11,0.2)`, color: TEXT }}>
                  <span>Your Effective Rate</span><span>{fmt(effectiveRent)}</span>
                </div>
                <div style={{ fontSize: 11, color: '#92660B', marginTop: 7 }}>
                  You save <strong>{fmt(savingsPerMo * 12)}/year</strong>
                </div>
              </div>
            )}

            {/* Monthly Recurring */}
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: MUTED, textTransform: 'uppercase', marginBottom: 12 }}>Monthly Recurring Fees</div>
              {(building.monthlyCharges ?? []).filter(f => !/(pet fee|parking)/i.test(f.type)).map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 12 }}>
                  <span>{f.type}</span><span style={{ fontWeight: 700 }}>{fmt(f.amount)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: 10, marginTop: 7, fontWeight: 800, fontSize: 13, borderRadius: 8, background: CYAN, color: CYAN_DARK }}>
                <span>Additional Costs</span><span>{fmt(totalMonthly)}/mo</span>
              </div>
              </div>

              {/* True Monthly Cost */}
              <div style={{ background: CYAN, borderRadius: 12, padding: 15, marginTop: 14, color: CYAN_DARK }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>True Monthly Cost</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 12 }}>
                  <span>Effective Rent</span><strong>{fmt(effectiveRent)}/mo</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', fontSize: 12 }}>
                  <span>Monthly Fees</span><strong>{fmt(totalMonthly)}/mo</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: `1px solid ${CYAN_DARK}33`, paddingTop: 10, marginTop: 6, fontSize: 15, fontWeight: 800 }}>
                  <span>Total</span><span style={{ fontSize: 20 }}>{fmt(trueMonthly)}/mo</span>
                </div>
                <p style={{ margin: '12px 0 0', fontSize: 11, lineHeight: 1.5, color: '#6B7280' }}>
                  This calculation is an estimate only based on current building information. We are not liable for any changes to pricing or fees incurred by the building. Please verify all costs directly with the leasing office before applying.
                </p>
              </div>

          </div>


          {/* MOBILE CTA */}
          <div className="building-detail-mobile-cta" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 20, display: 'flex', flexDirection: 'row', gap: 10, padding: '10px 20px', background: 'rgba(255,255,255,.94)', borderTop: `1px solid ${BORDER}`, backdropFilter: 'blur(10px)' }}>
            <button onClick={() => setShowLeasingForm(true)} style={{ flex: 1, border: 'none', borderRadius: 12, padding: '14px 8px', background: '#19C6C0', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Connect with Leasing</button>
            <a href={`sms:+14077657306?body=${encodeURIComponent(`Hi Don, I'm interested in ${building.name}`)}`} style={{ flex: 1, border: 'none', borderRadius: 12, padding: '14px 8px', background: '#FF4D8D', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Text Don</a>
          </div>

          {showLeasingForm && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowLeasingForm(false)}>
              <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, padding: '28px 24px 36px', maxHeight: '90vh', overflowY: 'auto' }} onClick={event => event.stopPropagation()}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#19C6C0', letterSpacing: '0.08em', marginBottom: 16 }}>CONNECT WITH LEASING TEAM</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#19C6C0', letterSpacing: '0.08em', marginBottom: 16 }}>CONNECT WITH LEASING TEAM</div>
                <LeasingForm buildingName={building.name} buildingId={buildingId} onClose={() => setShowLeasingForm(false)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
