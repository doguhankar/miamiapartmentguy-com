'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { buildings } from '@/lib/buildings'
import { useSupabaseImages } from '@/hooks/use-supabase-images'
import { SimilarBuildings } from '@/components/similar-buildings'

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
    <div style={{ textAlign: 'center', marginBottom: 4 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', textAlign: 'center' }}>Connect with Leasing</div>
      <div style={{ fontSize: 13, color: '#667085', marginTop: 4, textAlign: 'center' }}>{buildingName}</div>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>{field('firstName', 'First name', true)}{field('lastName', 'Last name', true)}</div>
    {field('phone', 'Phone', true, 'tel')}{field('email', 'Email', false, 'email')}
    <div><div style={{ fontSize: 11, fontWeight: 700, color: '#667085', marginBottom: 7 }}>I&apos;m interested in</div><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{['Schedule a Tour', 'Request more info', 'Confirm Qualifications', 'Custom Message'].map(intent => { const active = intents.includes(intent); return <button key={intent} type="button" onClick={() => toggleIntent(intent)} style={{ borderRadius: 999, border: active ? '1px solid #19C6C0' : '1px solid #E5E7EB', padding: '10px 14px', fontSize: 11, fontWeight: 600, color: active ? '#0F9D7A' : '#111827', background: active ? '#E8F8F7' : '#fff', cursor: 'pointer', textAlign: 'center' }}>{intent}</button> })}</div></div>
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11, lineHeight: 1.4, color: '#667085' }}><input type="checkbox" checked={consent} onChange={event => { setConsent(event.target.checked); setAttempted(false) }} style={{ marginTop: 2 }} /> <span>By submitting this form, you agree to be contacted by the building&apos;s management, leasing agent, or by Miami Apartment Guy.</span></label>
    {attempted && !consent && <div style={{ color: '#FF4D8D', fontSize: 11 }}>Please agree to our terms to continue.</div>}
    <button type="submit" disabled={!consent || submitting} style={{ border: 'none', borderRadius: 999, padding: '16px 13px', background: consent ? '#19C6C0' : '#D1D5DB', color: '#fff', fontSize: 13, fontWeight: 700, cursor: consent ? 'pointer' : 'not-allowed', pointerEvents: consent ? 'auto' : 'none' }}>{submitting ? 'Sending…' : 'Send request'}</button>
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
  const [expandedBeds, setExpandedBeds] = useState<Record<string, boolean>>({})
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({})

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
  const bedroomGroups = Array.from(new Set(liveUnits.map(bedsKey))).map((key) => ({
    key,
    units: liveUnits.filter((unit) => bedsKey(unit) === key),
  }))
  const floorPlanGroups = (units: LiveUnit[]) => Array.from(new Set(units.map((unit) => unit.floorPlanType || unitLabel(unit)))).map((plan) => ({
    plan,
    units: units.filter((unit) => (unit.floorPlanType || unitLabel(unit)) === plan),
  }))

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
      <style jsx>{`
        .leasing-modal-backdrop {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
        }
        @media (max-width: 768px) {
          .building-detail-cta {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            box-sizing: border-box;
            padding: 10px 20px !important;
            z-index: 50 !important;
          }
          .building-detail-scroll {
            padding-bottom: 100px !important;
          }
        }
      `}</style>

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
              <a href={`https://maps.apple.com/?address=${encodeURIComponent(building.address || building.neighborhood)}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#185FA5', marginTop: 4, textDecoration: 'none' }}><IconPin /> {building.address || building.neighborhood}</a>
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

              {/* Expandable pricing hierarchy */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, fontFamily: 'var(--font-archivo)', fontSize: 13, fontWeight: 800, color: TEXT }}><IconHome /> Available Units</div>
              <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                {bedroomGroups.length ? bedroomGroups.map(({ key, units }) => {
                  const open = expandedBeds[key] ?? false
                  const prices = units.map((unit) => unit.price).filter((value): value is number => Boolean(value))
                  const plans = floorPlanGroups(units)
                  return <div key={key} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <button type="button" onClick={() => { setExpandedBeds((current) => ({ ...current, [key]: !open })); setActivePriceType(key) }} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 14px', border: 0, background: open ? '#FFF7FA' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: TEXT }}>{key} <span style={{ color: MUTED, fontSize: 11, fontWeight: 500 }}>· {units.length} available</span></span>
                      <span style={{ fontFamily: 'var(--font-archivo)', fontSize: 13, fontWeight: 800, color: PINK }}>{prices.length ? `${fmt(Math.min(...prices))}+` : 'Contact'} <span style={{ color: MUTED, fontSize: 16 }}>{open ? '−' : '+'}</span></span>
                    </button>
                    {open && <div style={{ padding: '0 10px 10px', background: '#fff' }}>{plans.map(({ plan, units: planUnits }) => { const planKey = `${key}-${plan}`; const planOpen = expandedPlans[planKey]; const planPrices = planUnits.map((unit) => unit.price).filter((value): value is number => Boolean(value)); return <div key={planKey} style={{ border: `1px solid ${BORDER}`, borderRadius: 9, marginTop: 8, overflow: 'hidden' }}>
                      <button type="button" onClick={() => setExpandedPlans((current) => ({ ...current, [planKey]: !planOpen }))} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '10px 11px', border: 0, background: PANEL, cursor: 'pointer', textAlign: 'left' }}><span><strong style={{ fontSize: 12 }}>{plan}</strong><span style={{ display: 'block', color: MUTED, fontSize: 10, marginTop: 2 }}>{planUnits[0] && sqft(planUnits[0]) ? `${sqft(planUnits[0])?.toLocaleString()} sqft` : 'Floor plan'} · {planUnits.length} units</span></span><span style={{ fontSize: 11, fontWeight: 800 }}>{planPrices.length ? `${fmt(Math.min(...planPrices))}+` : 'Contact'} {planOpen ? '−' : '+'}</span></button>
                      {planOpen && <div style={{ padding: '6px 10px' }}>{(showAllUnits ? planUnits : planUnits.slice(0, 4)).map((u, i) => { const sel = selectedUnit === u; const { label, now } = formatAvail(avail(u)); return <button type="button" key={i} onClick={() => setSelectedUnit(u)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, border: 0, borderBottom: i < planUnits.length - 1 ? `1px solid ${BORDER}` : 'none', padding: '9px 2px', cursor: 'pointer', background: sel ? '#FFE8F5' : '#fff', textAlign: 'left' }}><span style={{ fontSize: 11, color: TEXT }}>{u.unit ? `Unit ${u.unit}` : `Available unit ${i + 1}`} · {sqft(u) ? `${sqft(u)?.toLocaleString()} sqft` : 'Size n/a'}</span><span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><strong style={{ fontSize: 12 }}>{u.price ? fmt(u.price) : '—'}</strong><span style={{ fontSize: 9, color: now ? SUCCESS : '#92660B' }}>{label}</span></span></button> })}</div>}
                    </div> })}</div>}
                  </div>
                }) : <div style={{ padding: 14, color: MUTED, fontSize: 12 }}>Pricing is not available yet.</div>}
              </div>
            </div>

            {/* RIGHT COL: Building Fees */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, fontFamily: 'var(--font-archivo)', fontSize: 13, fontWeight: 800, color: TEXT }}><IconCard /> Building Fees</div>
  <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 18px', marginBottom: 14, background: '#fff' }}>
  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>Due at move-in</div>
  {(building.moveInFees ?? []).map((f, i, arr) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none' }}><span>{f.type}</span><strong>{fmt(f.amount)}</strong></div>)}
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0 0', marginTop: 6, fontWeight: 800, fontSize: 13, borderTop: `2px solid ${BORDER}` }}><span>Total Initial</span><span>{fmt(totalMoveIn)}</span></div>
  <div style={{ height: 16 }} />
  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>Recurring monthly</div>
  {(building.monthlyCharges ?? []).filter(f => !/(pet fee|parking)/i.test(f.type)).map((f, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}><span>{f.type}</span><strong>{fmt(f.amount)}</strong></div>)}
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', marginTop: 8, fontWeight: 800, fontSize: 13, borderRadius: 8, background: '#19C6C0', color: '#04342C' }}><span>Total Monthly Fees</span><span>{fmt(totalMonthly)}/mo</span></div>
  </div>
  {(building.moveInFees ?? []).some(f => f.type.toLowerCase().includes('deposit')) && <div style={{ fontSize: 10, color: MUTED, margin: '-5px 2px 14px' }}>Deposits are due on move-in or application, not upfront.</div>}
            </div>
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="building-detail-sidebar" style={{ width: 350, flexShrink: 0, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', borderLeft: `1px solid ${BORDER}` }}>
          <div className="building-detail-scroll" style={{ flex: 1, overflowY: 'auto', padding: '22px 20px 0' }}>

            <div style={{ fontFamily: 'var(--font-archivo)', fontSize: 18, fontWeight: 600, marginBottom: 5, color: '#0B1220' }}>Your Budget Breakdown</div>
            <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, marginBottom: 16 }}>See what you&apos;ll really pay each month.</div>

            <hr style={{ border: 'none', borderTop: `1px solid ${BORDER}`, marginBottom: 18 }} />

            {/* Income + qualify */}
            <div style={{ background: '#fff', border: '1px solid #E5E3DC', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <label htmlFor="gross-income" style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 7 }}>Gross monthly income</label>
              <input id="gross-income" type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder="0" style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #E5E3DC', borderRadius: 8, background: '#F7F7F5', padding: '11px 12px', color: '#0B1220', fontSize: 20, lineHeight: 1.2, fontWeight: 700, outline: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 14, paddingTop: 14, borderTop: '1px solid #E5E3DC' }}>
                <div><span style={{ fontSize: 12, color: '#6B7280' }}>Max monthly rent</span><div style={{ fontSize: 20, fontWeight: 600, color: '#FF4D8D', marginTop: 3 }}>{fmt(maxRent)}</div></div>
                <div style={{ textAlign: 'right' }}><span style={{ fontSize: 12, color: '#6B7280' }}>You qualify for</span><div style={{ fontSize: 20, fontWeight: 600, color: '#0B1220', marginTop: 3 }}>{qualifies.length > 0 ? qualifies.join(', ') : 'Guarantor'}</div></div>
              </div>
            </div>

            {/* Requirements */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 12, padding: '0 4px' }}>
              {[
                { label: 'Income', value: building.incomeReq ? `${building.incomeReq}x income` : 'Income' },
                { label: 'Credit', value: building.creditReq || '650+ credit' },
                { label: 'Guarantors', value: building.guarantor ? 'Guarantors ok' : 'No guarantor' },
              ].map(item => <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUTED }}><span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: '50%', background: '#19C6C0', flexShrink: 0 }} />{item.value}</div>)}
            </div>

            {/* Costs summary */}
            <div style={{ background: '#fff', border: '1px solid #E5E3DC', borderRadius: 12, padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#0B1220', marginBottom: 10 }}>Move-in and monthly costs</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0' }}><span style={{ color: MUTED }}>Total upfront</span><span style={{ color: TEXT }}>{fmt(totalMoveIn)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0' }}><span style={{ color: MUTED }}>Monthly fees</span><span style={{ color: TEXT }}>{fmt(totalMonthly)}/mo</span></div>
            </div>

            {/* True Monthly Cost */}
            <div style={{ background: '#0B1220', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              {monthsFree > 0 && <p style={{ fontSize: 12, color: '#19C6C0', margin: '0 0 7px' }}>With {monthsFree} month{monthsFree > 1 ? 's' : ''} free on a 12-month lease</p>}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 13 }}><span style={{ fontSize: 14, color: '#7A8296', textDecoration: 'line-through' }}>{fmt(selectedPrice)}</span>{monthsFree > 0 && <span style={{ fontSize: 12, color: '#FFC24B' }}>Save {fmt(savingsPerMo * 12)}/yr</span>}</div>
              <p style={{ fontSize: 12, color: '#7A8296', margin: '0 0 3px' }}>True monthly cost</p>
              <p style={{ fontSize: 32, fontWeight: 600, color: '#fff', margin: 0 }}>{fmt(trueMonthly)}<span style={{ fontSize: 15, fontWeight: 400, color: '#7A8296' }}>/mo</span></p>
            </div>

            <SimilarBuildings buildingId={buildingId} />

              <div className="building-detail-cta" style={{ position: 'sticky', bottom: 0, zIndex: 10, display: 'flex', flexDirection: 'row', gap: 10, padding: '10px 0', background: '#fff', borderTop: `1px solid ${BORDER}` }}>
                <button onClick={() => setShowLeasingForm(true)} style={{ flex: 1, border: 'none', borderRadius: 12, padding: '14px 8px', background: '#19C6C0', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Connect with Leasing</button>
                <a href={`sms:+14077657306?body=${encodeURIComponent(`Hi Don, I'm interested in ${building.name}`)}`} style={{ flex: 1, border: 'none', borderRadius: 12, padding: '14px 8px', background: '#FF4D8D', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Text Don</a>
              </div>

          </div>

          {showLeasingForm && (
            <div className="leasing-modal-backdrop" style={{ zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowLeasingForm(false)}>
              <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, padding: '28px 24px 36px', maxHeight: '90vh', overflowY: 'auto' }} onClick={event => event.stopPropagation()}>
                <LeasingForm buildingName={building.name} buildingId={buildingId} onClose={() => setShowLeasingForm(false)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
