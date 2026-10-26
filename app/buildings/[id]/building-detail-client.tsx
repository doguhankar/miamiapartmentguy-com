'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FormEvent } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { buildings } from '@/lib/buildings'
import { useSupabaseImages } from '@/hooks/use-supabase-images'
import { createClient } from '@/lib/supabase/client'
import { AvailableUnitsRedesign } from '@/components/available-units-redesign'
import { SimilarBuildings } from '@/components/similar-buildings'
import { RelatedBuildings } from '@/components/related-buildings'
import { buildingAlt } from '@/lib/building-alt'
import { CommissionPill } from '@/components/commission-pill'
import { SaveBuildingButton } from '@/components/save-building-button'
import { useAgentMode } from '@/components/agent-mode-provider'
import { useSaveList } from '@/components/save-list-provider'
import { BuildingImageGallery } from '@/components/building-image-gallery'
import { readBuildingOrigin, readMapQuery } from '@/lib/map-return'
import { hasPrice, PRICING_COMING_SOON } from '@/lib/price-display'
import { formatApproxPlan, lowestApproxPrice, useApproxPricing } from '@/lib/approx-pricing'
import type { BuildingPricing } from '@/lib/pricing/building-pricing'

// ─── Types ───────────────────────────────────────────────────────────────────
interface LiveUnit {
  unit?: string
  floorPlanType?: string
  beds?: string | number
  baths?: number
  sqft?: number
  square_feet?: number
  price?: number
  availableDate?: string | null
  available_date?: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => '$' + n.toLocaleString()

function formatHoldPeriod(holdDays: number[]): string {
  const values = holdDays.filter(Number.isFinite)
  if (values.length === 0) return ''
  if (values.length === 1) return `${values[0]} days`
  return `${values.join(', ')} days`
}

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
  if (typeof u.beds === 'number') {
    if (u.beds === 0) return 'Studio'
    return `${u.beds}BR`
  }
  if (u.floorPlanType) return unitLabel(u)
  return 'Studio'
}

// Formats a raw numeric string as "$9,000" for display while the underlying
// state stays a plain numeric string used for calculations.
function formatIncomeDisplay(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return ''
  return '$' + Number(digits).toLocaleString()
}

// ─── Icons ───────────────────────────────────────────────────────────────────
const IconBack = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const IconHeart = ({ filled }: { filled: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? '#E61E4D' : 'none'} stroke={filled ? '#E61E4D' : 'currentColor'} strokeWidth="2" strokeLinecap="round">
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

// ─── Pricing display (all numbers come from the server-computed `pricing` prop) ──
function formatChecked(stamp: string): string {
  const date = new Date(stamp.length <= 10 ? `${stamp}T00:00:00Z` : /[zZ]|[+-]\d\d:?\d\d$/.test(stamp) ? stamp : `${stamp}Z`)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

function FeeRow({ label, value, size, pad, border }: { label: string; value: string; size: number; pad: string; border: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: pad, fontSize: size, borderBottom: `1px solid ${border}` }}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function FeeGroupLabel({ children, size }: { children: string; size: number }) {
  return <div style={{ padding: '10px 0 2px', fontSize: Math.max(11, size - 3), fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#6B7280' }}>{children}</div>
}

type FeeRowsProps = { pricing: BuildingPricing; size: number; pad: string; border: string }

function MoveInRows({ pricing, size, pad, border }: FeeRowsProps) {
  if (pricing.moveInFees.length === 0 && pricing.petMoveInFees.length === 0) {
    return <div style={{ padding: pad, fontSize: size, color: '#6B7280' }}>{PRICING_COMING_SOON}</div>
  }
  return (
    <>
      {pricing.moveInFees.map((fee, i) => <FeeRow key={`m${i}`} label={fee.type} value={fmt(fee.amount)} size={size} pad={pad} border={border} />)}
      {pricing.petMoveInFees.length > 0 && (
        <>
          <FeeGroupLabel size={size}>If you have a pet (not in total)</FeeGroupLabel>
          {pricing.petMoveInFees.map((fee, i) => <FeeRow key={`p${i}`} label={fee.type} value={fmt(fee.amount)} size={size} pad={pad} border={border} />)}
        </>
      )}
    </>
  )
}

function MonthlyRows({ pricing, size, pad, border }: FeeRowsProps) {
  if (!pricing.feesKnown) {
    return <div style={{ padding: pad, fontSize: size, color: '#6B7280' }}>{PRICING_COMING_SOON}</div>
  }
  return (
    <>
      {pricing.requiredCharges.map((fee, i) => <FeeRow key={`r${i}`} label={fee.type} value={fmt(fee.amount)} size={size} pad={pad} border={border} />)}
      {pricing.optionalCharges.length > 0 && (
        <>
          <FeeGroupLabel size={size}>Optional (not in total)</FeeGroupLabel>
          {pricing.optionalCharges.map((fee, i) => <FeeRow key={`o${i}`} label={fee.type} value={fmt(fee.amount)} size={size} pad={pad} border={border} />)}
        </>
      )}
      {pricing.petCharges.length > 0 && (
        <>
          <FeeGroupLabel size={size}>If you have a pet (not in total)</FeeGroupLabel>
          {pricing.petCharges.map((fee, i) => <FeeRow key={`pc${i}`} label={fee.type} value={fmt(fee.amount)} size={size} pad={pad} border={border} />)}
        </>
      )}
    </>
  )
}

function PriceBlock({ pricing, tone, concessionText }: { pricing: BuildingPricing; tone: 'dark' | 'light'; concessionText?: string }) {
  const dark = tone === 'dark'
  const text = dark ? '#FFFFFF' : '#222222'
  const muted = dark ? '#7A8296' : '#6A6A6A'
  const accent = dark ? '#19C6C0' : '#0B7F7A'
  const deal = dark ? '#FF6FA3' : '#E61E4D'
  const line = dark ? 'rgba(255,255,255,0.12)' : '#EBEBEB'

  const row = (label: string, value: string, emphasis = false) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, padding: '7px 0', borderBottom: `1px solid ${line}`, color: text, fontSize: emphasis ? 15 : 13, fontWeight: emphasis ? 700 : 500 }}>
      <span style={{ color: emphasis ? text : muted }}>{label}</span>
      <span>{value}</span>
    </div>
  )

  const dealNote =
    pricing.monthsFree > 0
      ? `${Number(pricing.monthsFree.toFixed(2))} ${pricing.monthsFree === 1 ? 'month' : 'months'} free — save up to ${fmt(pricing.annualSavings)}/yr${concessionText ? ` (${concessionText})` : ''}`
      : pricing.moveInCredit > 0
        ? `${fmt(pricing.moveInCredit)} move-in credit`
        : null
  const checked = pricing.lastUpdated ? formatChecked(pricing.lastUpdated) : ''

  return (
    <div>
      {!pricing.feesKnown ? (
        row('Monthly fees', PRICING_COMING_SOON)
      ) : (
        <>
          {row('Required monthly fees', `${fmt(pricing.requiredMonthly)}/mo`)}
          {row('True monthly (before deal)', pricing.trueMonthly !== null ? `${fmt(pricing.trueMonthly)}/mo` : PRICING_COMING_SOON, !pricing.hasDeal)}
          {pricing.hasDeal && row('Net monthly with deal', pricing.netMonthly !== null ? `${fmt(pricing.netMonthly)}/mo` : PRICING_COMING_SOON, true)}
          {pricing.hasDeal && dealNote && <div style={{ padding: '6px 0 0', fontSize: 12, fontWeight: 600, color: deal }}>{dealNote}</div>}
          {pricing.petMonthly > 0 && <div style={{ padding: '8px 0 0', fontSize: 12, fontWeight: 600, color: accent }}>{`+ ${fmt(pricing.petMonthly)}/mo if you have a pet`}</div>}
          {pricing.optionalCharges.length > 0 && (
            <div style={{ padding: '8px 0 0', fontSize: 12, color: muted }}>
              {`Optional, not included: ${pricing.optionalCharges.map((charge) => `${charge.type} ${fmt(charge.amount)}/mo`).join(', ')}`}
            </div>
          )}
        </>
      )}
      {checked && <div style={{ padding: '10px 0 0', fontSize: 11, color: muted }}>{`Prices last updated ${checked}`}</div>}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BuildingDetailClient({ pricing }: { pricing: BuildingPricing }) {
  const params = useParams()
  const router = useRouter()
  const buildingId = params.id as string
  const { hasAccess } = useAgentMode()
  const { savedIds, toggleSave } = useSaveList()

  // Return to the map the user came from. If this building was opened from
  // within the app in this tab, step back so the map viewport and list scroll
  // stay put; otherwise (direct link / fresh tab) fall back to the saved
  // filtered map URL rather than a bare /map.
  const handleBack = useCallback(() => {
    const origin = readBuildingOrigin()
    if (origin) {
      router.back()
      return
    }
    const saved = readMapQuery('/map')
    router.replace(saved ? `/map?${saved}` : '/map')
  }, [router])

  const building = buildings.find(b => b.id === buildingId)
  const { images: supabaseImages } = useSupabaseImages(buildingId)

  const allImages = supabaseImages.length > 0 ? supabaseImages : (building?.images ?? [])
  const [imgIdx, setImgIdx] = useState(0)

  const [liveUnits, setLiveUnits] = useState<LiveUnit[]>([])
  const [unitsLoaded, setUnitsLoaded] = useState(false)
  const approxPlans = useApproxPricing()[buildingId]
  const [showAllUnits, setShowAllUnits] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<LiveUnit | null>(null)
  const [activePriceType, setActivePriceType] = useState<string | null>('Studio')
  const [expandedBeds, setExpandedBeds] = useState<Record<string, boolean>>({})
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({})

  const [income, setIncome] = useState<string>('9000')
  const [showLeasingForm, setShowLeasingForm] = useState(false)
  const [feesOpen, setFeesOpen] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadLiveUnits() {
      const supabase = createClient()
      const { data } = await supabase
        .from('units')
        .select('price, beds, baths, sqft, unitnumber, availabilitydate, unittype')
        .eq('building_id', buildingId)

      if (cancelled) return

      setLiveUnits((data ?? []).map(unit => ({
        unit: unit.unitnumber ?? undefined,
        floorPlanType: unit.unittype ?? undefined,
        price: typeof unit.price === 'number' ? unit.price : undefined,
        beds: unit.beds ?? undefined,
        baths: typeof unit.baths === 'number' ? unit.baths : undefined,
        sqft: typeof unit.sqft === 'number' ? unit.sqft : undefined,
        availabilityDate: unit.availabilitydate ?? null,
      })))
      setUnitsLoaded(true)
    }

    loadLiveUnits()

    return () => {
      cancelled = true
    }
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

  // Build pricing cards from live units
  const ORDER = ['Studio', '1BR', '2BR', '3BR']
  const priceByType: Record<string, number> = {}
  liveUnits.forEach(u => {
    const k = bedsKey(u)
    if (u.price && (!priceByType[k] || u.price < priceByType[k])) priceByType[k] = u.price
  })
  // Fallback from building static data
  if (Object.keys(priceByType).length === 0 && hasPrice(building.priceMin)) {
    const unitMap: Record<string, string> = { 'Studio': 'Studio', '1B': '1BR', '2B': '2BR', '3B': '3BR' }
    building.units.forEach(u => { if (unitMap[u]) priceByType[unitMap[u]] = building.priceMin })
  }
  const priceCards = ORDER.filter(k => priceByType[k])

  const selectedPrice = selectedUnit?.price ?? building.priceMin

  const totalMoveInLabel = pricing.moveInFees.length > 0 ? fmt(pricing.moveInDue) : PRICING_COMING_SOON

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
  const livePrices = liveUnits.map((u) => u.price).filter((value): value is number => hasPrice(value))
  const approxLowest = livePrices.length ? null : lowestApproxPrice(approxPlans)
  const showApproxPricing = unitsLoaded && livePrices.length === 0 && approxLowest !== null

  // ── Styling tokens ──────────────────────────────���────────���──────────────────
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
  const AB_TEXT = '#222222'
  const AB_MUTED = '#6A6A6A'
  const AB_BORDER = '#DDDDDD'
  const AB_HAIRLINE = '#EBEBEB'
  const AB_PANEL_BORDER = '#B0B0B0'
  const TEAL = '#0B7F7A'
  const TEAL_LIGHT = '#E6F6F5'
  const BADGE_BG = '#FFE3EE'
  const BADGE_TEXT = '#A80F47'

  // ── Shared content blocks (reused by both mobile and desktop layouts) ──────
  const unitsContent = showApproxPricing && approxPlans ? (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: MUTED, marginBottom: 10 }}>Approximate pricing.</div>
      {approxPlans.map((plan, i) => (
        <div key={plan.type} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '12px 0', fontSize: 14, borderTop: i === 0 ? 'none' : `1px solid ${BORDER}` }}>
          <span style={{ color: TEXT, fontWeight: 600 }}>{plan.type}</span>
          <strong style={{ color: TEXT }}>{formatApproxPlan(plan)}</strong>
        </div>
      ))}
    </div>
  ) : (
    <AvailableUnitsRedesign buildingId={buildingId} />
  )

  const unitsSection = (
    <div style={{ border: '1px solid #E8EBF0', borderRadius: 20, background: '#ffffff', padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12, fontFamily: 'var(--font-archivo)', fontSize: 13, fontWeight: 800, color: TEXT }}><IconHome /> Available Units</div>
      {unitsContent}
    </div>
  )

  const feesSection = (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 12, background: '#ffffff', overflow: 'hidden' }}>
      <button
        type="button"
        className="fees-toggle-btn"
        onClick={() => setFeesOpen((current) => !current)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 7, margin: 0, padding: '16px 18px', fontFamily: 'var(--font-archivo)', fontSize: 13, fontWeight: 800, color: TEXT, border: 'none', background: '#ffffff', cursor: 'pointer', textAlign: 'left', outline: 'none', boxShadow: 'none' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: '#E6F6F5', color: '#0B7F7A' }}><IconCard /></span>
          <span><span style={{ display: 'block' }}>Building Fees</span><span style={{ display: 'block', marginTop: 3, fontFamily: 'inherit', fontSize: 13, fontWeight: 400, color: '#9AA1AC' }}>What to budget for at move-in and each month</span></span>
        </span>
        <i aria-hidden="true" className="fees-chevron" style={{ display: 'block', width: 8, height: 8, flexShrink: 0, borderRight: `2px solid ${MUTED}`, borderBottom: `2px solid ${MUTED}`, transition: 'transform 180ms ease', transform: feesOpen ? 'rotate(225deg)' : 'rotate(45deg)' }} />
      </button>
      {feesOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 18px 16px', background: '#ffffff' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch' }}>
            <div style={{ flex: '1 1 220px', padding: '16px 18px', background: '#F8F9FB', border: '1px solid #E8EBF0', borderRadius: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>Due at move-in</div>
              <MoveInRows pricing={pricing} size={12} pad="6px 0" border={BORDER} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0 0', marginTop: 6, fontWeight: 800, fontSize: 13, borderTop: `2px solid ${BORDER}` }}><span>Total Initial</span><span>{totalMoveInLabel}</span></div>
            </div>
            <div style={{ flex: '1 1 220px', padding: '16px 18px', background: '#F8F9FB', border: '1px solid #E8EBF0', borderRadius: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: MUTED, textTransform: 'uppercase', marginBottom: 8 }}>Recurring monthly</div>
              <MonthlyRows pricing={pricing} size={12} pad="6px 0" border={BORDER} />
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const sidebarBudgetSection = (
    <>
      <div style={{ fontFamily: 'var(--font-archivo)', fontSize: 18, fontWeight: 600, marginBottom: 5, color: '#0B1220' }}>Your Budget Breakdown</div>
      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, marginBottom: 16 }}>See what you&apos;ll really pay each month.</div>

      <hr style={{ border: 'none', borderTop: `1px solid ${BORDER}`, marginBottom: 18 }} />

      <div style={{ background: '#fff', border: '1px solid #E5E3DC', borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <label htmlFor="gross-income" style={{ display: 'block', fontSize: 12, color: '#6B7280', marginBottom: 7 }}>Gross monthly income</label>
        <input id="gross-income" type="number" value={income} onChange={e => setIncome(e.target.value)} placeholder="0" style={{ width: '100%', boxSizing: 'border-box', border: '1px dashed rgba(25, 198, 192, 0.55)', borderRadius: 8, background: '#F7F7F5', padding: '11px 12px', color: '#0B1220', fontSize: 20, lineHeight: 1.2, fontWeight: 700, outline: 'none', boxShadow: '0 0 0 2px rgba(25, 198, 192, 0.08)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 14, paddingTop: 14, borderTop: '1px solid #E5E3DC' }}>
          <div><span style={{ fontSize: 12, color: '#6B7280' }}>Max monthly rent</span><div style={{ fontSize: 20, fontWeight: 600, color: '#FF4D8D', marginTop: 3 }}>{fmt(maxRent)}</div></div>
          <div style={{ textAlign: 'right' }}><span style={{ fontSize: 12, color: '#6B7280' }}>You qualify for</span><div style={{ fontSize: 20, fontWeight: 600, color: '#0B1220', marginTop: 3 }}>{qualifies.length > 0 ? qualifies.join(', ') : 'Guarantor'}</div></div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 12, padding: '0 4px' }}>
        {[
          { label: 'Income', value: building.incomeReq ? `${building.incomeReq}x income` : 'Income' },
          { label: 'Credit', value: building.creditReq || '650+ credit' },
          { label: 'Guarantors', value: building.guarantor ? 'Guarantors ok' : 'No guarantor' },
        ].map(item => <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: MUTED }}><span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: '50%', background: '#19C6C0', flexShrink: 0 }} />{item.value}</div>)}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E3DC', borderRadius: 12, padding: 16, marginBottom: 14 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#0B1220', marginBottom: 10 }}>Move-in costs</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0' }}><span style={{ color: MUTED }}>Total upfront</span><span style={{ color: TEXT }}>{totalMoveInLabel}</span></div>
      </div>

      <div style={{ background: '#0B1220', borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <PriceBlock pricing={pricing} tone="dark" concessionText={building.concession} />
      </div>
    </>
  )

  const ctaBarSection = (
    <div className="building-detail-cta" style={{ position: 'sticky', bottom: 0, zIndex: 10, display: 'flex', flexDirection: 'row', gap: 10, padding: '10px 0', background: '#fff', borderTop: `1px solid ${BORDER}` }}>
      <button onClick={() => setShowLeasingForm(true)} style={{ flex: 1, border: 'none', borderRadius: 12, padding: '14px 8px', background: '#19C6C0', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Connect with Leasing</button>
      <a href={`sms:+14077657306?body=${encodeURIComponent(`Hi Don, I'm interested in ${building.name}`)}`} style={{ flex: 1, border: 'none', borderRadius: 12, padding: '14px 8px', background: '#FF4D8D', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Text Don</a>
    </div>
  )

  return (
    <div className="building-detail-page" style={{ fontFamily: "'Inter', sans-serif", background: '#f2f1ed', color: TEXT, height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style jsx global>{`
        .fees-toggle-btn {
          outline: none;
        }
        .fees-toggle-btn:focus,
        .fees-toggle-btn:focus-visible {
          outline: none;
          box-shadow: none;
        }
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
        .detail-mobile-shell {
          display: flex;
          flex: 1;
          min-width: 0;
          min-height: 0;
          width: 100%;
          overflow: hidden;
        }
        @media (max-width: 768px) {
          .detail-mobile-shell .building-detail-shell {
            width: 100% !important;
            min-width: 0 !important;
          }
        }
        .detail-desktop-shell {
          display: none;
        }
        @media (min-width: 769px) {
          .detail-mobile-shell {
            display: none;
          }
          .detail-desktop-shell {
            display: block;
            flex: 1;
            min-height: 0;
            overflow-y: auto;
          }
        }
        .desktop-ke-scroll::-webkit-scrollbar {
          height: 6px;
        }
      `}</style>

      {/* ── MOBILE SHELL (unchanged) ── */}
      <div className="detail-mobile-shell">
      <div className="building-detail-shell" style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <button
          onClick={handleBack}
          style={{ position: 'absolute', zIndex: 5, top: 16, left: 18, display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', color: TEXT, fontSize: 11, fontWeight: 700, background: 'rgba(255,255,255,0.92)', border: `1px solid ${BORDER}`, borderRadius: 7, padding: '8px 11px', boxShadow: '0 2px 8px rgba(10,15,28,0.08)' }}
        >
          <IconBack /> Back to map
        </button>
        {/* ── LEFT SECTION ── */}
        <div className="building-detail-left" style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* HERO */}
          <div style={{ boxSizing: 'border-box', width: '100%', padding: '58px 16px 0', flex: '0 0 338px', minHeight: 338 }}>
            <div style={{ boxSizing: 'border-box', position: 'relative', width: '100%', height: 280, minHeight: 280, borderRadius: 16, overflow: 'hidden', background: '#E5E7EB' }}>
              <BuildingImageGallery images={allImages} buildingName={building.name} height={280} currentIndex={imgIdx} onCurrentIndexChange={setImgIdx} />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color: TEXT }}>{building.name}</div><CommissionPill buildingName={building.name} /></div>
              <a href={`https://maps.apple.com/?address=${encodeURIComponent(building.address || building.neighborhood)}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#185FA5', marginTop: 4, textDecoration: 'none' }}><IconPin /> {building.address || building.neighborhood}</a>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button aria-label="Share building" style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, background: '#fff', border: `1px solid ${BORDER}`, borderRadius: '50%', cursor: 'pointer' }}><IconShare /></button>
              <SaveBuildingButton buildingId={String(building.id)} />
            </div>
          </div>

          {/* TOP INFO */}
          <div style={{ padding: '12px 20px 15px', background: '#fff', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>{pricing.base !== null ? <><span style={{ fontSize: 10, color: MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Starting at</span> <strong style={{ fontFamily: 'var(--font-archivo)', fontSize: 22, color: TEXT }}>{fmt(pricing.base)}</strong><span style={{ fontSize: 11, color: MUTED }}>/mo</span></> : <strong style={{ fontFamily: 'var(--font-archivo)', fontSize: 18, color: MUTED }}>{PRICING_COMING_SOON}</strong>}</div>
            {building.tagline && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5, marginTop: 8 }}>{building.tagline}</div>}
            <div style={{ display: 'flex', gap: 7, marginTop: 9, flexWrap: 'wrap', alignItems: 'center' }}>
              {building.concession && <span style={{ display: 'inline-flex', alignItems: 'center', background: '#FFE3EE', color: '#A80F47', borderRadius: 999, padding: '7px 14px', fontSize: 12, fontWeight: 700 }}>{building.concession}</span>}
              {building.holdDays?.length > 0 && <span style={{ fontSize: 11, color: MUTED, fontWeight: 600 }}>Hold Period: {formatHoldPeriod(building.holdDays)}</span>}
            </div>
          </div>

          {/* CONTENT: TWO COLUMNS */}
          <div className="building-detail-content" style={{ flex: 1, minHeight: 0, minWidth: 0, display: 'flex', overflow: 'hidden', borderRight: `1px solid ${BORDER}` }}>

            {/* LEFT COL: Pricing + Units */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 18, borderRight: `1px solid ${BORDER}` }}>
              {unitsSection}
            </div>

            {/* RIGHT COL: Building Fees */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
              {feesSection}
            </div>
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="building-detail-sidebar" style={{ width: 350, flexShrink: 0, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', borderLeft: `1px solid ${BORDER}` }}>
          <div className="building-detail-scroll" style={{ flex: 1, overflowY: 'auto', padding: '22px 20px 0' }}>

            {sidebarBudgetSection}

            <SimilarBuildings buildingId={buildingId} />

            {ctaBarSection}

          </div>
        </div>
      </div>
      </div>

      {/* ── DESKTOP SHELL (Airbnb-style layout, >=769px) ── */}
      <div className="detail-desktop-shell" style={{ minHeight: '100%', padding: '0 80px', background: '#FFFFFF', color: AB_TEXT }}>
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '26px 0 14px' }}>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-archivo)', fontSize: 28, fontWeight: 800, lineHeight: 1.2, letterSpacing: '-0.02em' }}>{building.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
              <button type="button" onClick={() => navigator.share?.({ title: building.name, url: window.location.href })} style={{ height: 40, display: 'inline-flex', alignItems: 'center', gap: 8, padding: 0, border: 0, background: 'transparent', color: AB_TEXT, fontSize: 14, fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}><IconShare /> Share</button>
              {hasAccess && (() => {
                const isSaved = savedIds.includes(String(building.id))
                return (
                  <button
                    type="button"
                    aria-pressed={isSaved}
                    aria-label={`${isSaved ? 'Remove' : 'Save'} ${building.name}`}
                    onClick={() => toggleSave(String(building.id))}
                    style={{ height: 40, display: 'inline-flex', alignItems: 'center', gap: 8, padding: 0, border: 0, background: 'transparent', color: AB_TEXT, fontSize: 14, fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    <IconHeart filled={isSaved} /> {isSaved ? 'Saved' : 'Save'}
                  </button>
                )
              })()}
            </div>
          </div>

          <div style={{ position: 'relative', width: '100%', height: 600, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: 8 }}>
            {Array.from({ length: 5 }).map((_, index) => {
              const photo = allImages[index]
              const tileStyle = index === 0 ? { gridColumn: '1 / 3', gridRow: '1 / 3', borderRadius: '12px 0 0 12px' } : index === 1 ? { gridColumn: 3, gridRow: 1, borderRadius: 0 } : index === 2 ? { gridColumn: 4, gridRow: 1, borderRadius: '0 12px 0 0' } : index === 3 ? { gridColumn: 3, gridRow: 2, borderRadius: 0 } : { gridColumn: 4, gridRow: 2, borderRadius: '0 0 12px 0' }
              return <div key={index} style={{ position: 'relative', overflow: 'hidden', background: '#E8ECF2', ...tileStyle }}>{photo && <Image src={photo} alt={`${buildingAlt(building.name, building.neighborhood)} ${index + 1}`} fill sizes="25vw" style={{ objectFit: 'cover' }} />}</div>
            })}
            <button type="button" onClick={() => document.querySelector<HTMLButtonElement>(`button[aria-label="Open ${building.name} photo gallery"]`)?.click()} style={{ position: 'absolute', right: 24, bottom: 24, height: 40, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 14px', border: '1px solid #222222', borderRadius: 8, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}><span aria-hidden="true">▦</span> Show all photos</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 72, paddingTop: 44 }}>
            <div style={{ flex: '1 1 auto', minWidth: 0 }}>
              <section style={{ paddingBottom: 24, borderBottom: `1px solid ${AB_HAIRLINE}` }}>
                <div style={{ fontFamily: 'var(--font-archivo)', fontSize: 22, fontWeight: 700 }}>Apartment building in {building.neighborhood}, Miami</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 15 }}>
                  {building.management && <><span>Managed by <span style={{ textDecoration: 'underline' }}>{building.management}</span></span><span style={{ color: AB_MUTED }}>·</span></>}
                  <a href={`https://maps.apple.com/?address=${encodeURIComponent(building.address || building.neighborhood)}`} target="_blank" rel="noreferrer" style={{ color: TEAL, textDecoration: 'underline' }}>{building.address || building.neighborhood}</a>
                </div>
                {building.tagline && <div style={{ marginTop: 14, maxWidth: 680, color: AB_MUTED, fontSize: 16, fontStyle: 'italic', lineHeight: 1.6 }}>“{building.tagline}”</div>}
              </section>

              <section style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '26px 0', borderBottom: `1px solid ${AB_HAIRLINE}` }}>
                {building.concession && <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}><span style={{ flexShrink: 0, marginTop: 2, fontSize: 24, color: TEAL }}>✦</span><div><div style={{ fontSize: 16, fontWeight: 600 }}>{building.concession}</div><div style={{ color: AB_MUTED, fontSize: 15, lineHeight: 1.5 }}>Concession applies to 12-month leases signed this month. Ask Don which lines qualify.</div></div></div>}
                {building.holdDays?.length > 0 && <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}><span style={{ flexShrink: 0, marginTop: 2, fontSize: 24, color: TEAL }}>◷</span><div><div style={{ fontSize: 16, fontWeight: 600 }}>{formatHoldPeriod(building.holdDays)} hold period</div><div style={{ color: AB_MUTED, fontSize: 15, lineHeight: 1.5 }}>Pricing and availability are held from application.</div></div></div>}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}><span style={{ flexShrink: 0, marginTop: 2, fontSize: 24, color: TEAL }}>✓</span><div><div style={{ fontSize: 16, fontWeight: 600 }}>Guarantor accepted</div><div style={{ color: AB_MUTED, fontSize: 15, lineHeight: 1.5 }}>Third-party guarantors and co-signers approved — helpful for students and new-to-market renters.</div></div></div>
              </section>

              <section style={{ padding: '30px 0', borderBottom: `1px solid ${AB_HAIRLINE}` }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-archivo)', fontSize: 22, fontWeight: 700 }}>Available units</h2>
                <div style={{ margin: '7px 0 20px', color: AB_MUTED, fontSize: 15 }}>Explore current floor plans, pricing, and availability.</div>
                {unitsContent}
              </section>

              <section style={{ padding: '30px 0', borderBottom: `1px solid ${AB_HAIRLINE}` }}>
                <h2 style={{ margin: 0, fontFamily: 'var(--font-archivo)', fontSize: 22, fontWeight: 700 }}>Building fees</h2>
                <div style={{ marginTop: 7, color: AB_MUTED, fontSize: 15 }}>What to budget for at move-in and each month</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 40, marginTop: 22 }}>
                  <div><div style={{ color: AB_MUTED, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em' }}>DUE AT MOVE-IN</div><MoveInRows pricing={pricing} size={16} pad="11px 0" border={AB_HAIRLINE} /><div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 13, fontSize: 16, fontWeight: 700 }}><span>Total initial</span><span>{totalMoveInLabel}</span></div></div>
                  <div><div style={{ color: AB_MUTED, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em' }}>RECURRING MONTHLY</div><MonthlyRows pricing={pricing} size={16} pad="11px 0" border={AB_HAIRLINE} /></div>
                </div>
              </section>


            </div>

            <aside style={{ flex: '0 0 372px', position: 'sticky', top: 24, padding: 24, border: `1px solid ${AB_BORDER}`, borderRadius: 12, boxShadow: '0 6px 16px rgba(0,0,0,0.12)', background: '#fff' }}>
              <div>{pricing.base !== null ? <><span style={{ color: AB_MUTED, fontSize: 16 }}>Starting at</span> <strong style={{ fontFamily: 'var(--font-archivo)', fontSize: 24, fontWeight: 800 }}>{fmt(pricing.base)}</strong><span style={{ color: AB_MUTED, fontSize: 16 }}>/mo</span></> : <strong style={{ fontFamily: 'var(--font-archivo)', fontSize: 20, fontWeight: 800, color: AB_MUTED }}>{PRICING_COMING_SOON}</strong>}</div>
              {building.concession && <div style={{ display: 'inline-flex', marginTop: 12, padding: '7px 13px', borderRadius: 999, background: BADGE_BG, color: BADGE_TEXT, fontSize: 13, fontWeight: 700 }}>{building.concession}</div>}
              <div style={{ marginTop: 18, border: `1px solid ${AB_PANEL_BORDER}`, borderRadius: 10, overflow: 'hidden' }}><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}><div style={{ padding: 14 }}><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em' }}>HOLD PERIOD</div><div style={{ marginTop: 5, fontSize: 14 }}>{formatHoldPeriod(building.holdDays)}</div></div><div style={{ padding: 14, borderLeft: `1px solid ${AB_PANEL_BORDER}` }}><div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.06em' }}>MOVE-IN</div><div style={{ marginTop: 5, color: AB_MUTED, fontSize: 14 }}>Add date</div></div></div><div style={{ display: 'flex', justifyContent: 'space-between', padding: 14, borderTop: `1px solid ${AB_PANEL_BORDER}`, fontSize: 14 }}><span><span style={{ display: 'block', fontSize: 10, fontWeight: 800, letterSpacing: '0.06em' }}>FLOOR PLAN</span><span style={{ display: 'block', marginTop: 5 }}>Any · Studio–3BR</span></span><span>⌄</span></div></div>
              <a href={`sms:+14077657306?body=${encodeURIComponent(`Hi Don, I'm interested in ${building.name}`)}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: 52, marginTop: 16, borderRadius: 10, background: 'linear-gradient(90deg,#E61E4D,#D70466)', color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none' }}>Text Don</a>
              <button type="button" onClick={() => setShowLeasingForm(true)} style={{ width: '100%', height: 52, marginTop: 10, border: `1px solid ${TEAL}`, borderRadius: 10, background: '#fff', color: TEAL, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>Connect with leasing</button>
              <div style={{ marginTop: 14, textAlign: 'center', color: AB_MUTED, fontSize: 14 }}>You won&apos;t be charged — no credit impact</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 22, paddingBottom: 22, borderBottom: `1px solid ${AB_HAIRLINE}`, fontSize: 15 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ textDecoration: 'underline' }}>Income requirement</span><span>3× rent</span></div><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ textDecoration: 'underline' }}>Credit score</span><span>650+</span></div><div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ textDecoration: 'underline' }}>Guarantor</span><span>Accepted</span></div></div>
              <div style={{ marginTop: 18 }}><PriceBlock pricing={pricing} tone="light" concessionText={building.concession} /></div>
              <div style={{ marginTop: 16, textAlign: 'center', color: AB_MUTED, fontSize: 14 }}>◈ &nbsp;Pre-qualify before you tour</div>
            </aside>
          </div>

          <div style={{ marginTop: 40, paddingTop: 30, borderTop: `1px solid ${AB_HAIRLINE}` }}><RelatedBuildings building={building} /></div>
          <div style={{ marginTop: 30, paddingTop: 30, borderTop: `1px solid ${AB_HAIRLINE}`, paddingBottom: 40 }}><SimilarBuildings buildingId={buildingId} variant="carousel" /></div>
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
  )
}
