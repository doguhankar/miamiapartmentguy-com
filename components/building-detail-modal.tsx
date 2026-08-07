'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSupabaseImages } from '@/hooks/use-supabase-images'
import { Building } from '@/lib/buildings'

interface BuildingDetailModalProps {
  building: Building
  onClose: () => void
}

type Unit = {
  id?: string | number
  unit?: string
  unit_number?: string
  beds?: string | number
  baths?: string | number
  sqft?: string | number
  price?: number
  availableDate?: string | null
  available_date?: string | null
}

const COLORS = {
  ink: '#0B1220',
  muted: '#687487',
  line: '#E5E9EF',
  soft: '#F5F7FA',
  pink: '#F34C86',
  teal: '#09A8A4',
  amber: '#F0A51A',
}

function Icon({ name, size = 18 }: { name: 'pin' | 'bed' | 'bath' | 'ruler' | 'calendar' | 'check' | 'chevron' | 'receipt' | 'spark'; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  const paths = {
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    bed: <><path d="M3 18v-7h18v7" /><path d="M3 14h18M6 11V8h5a3 3 0 0 1 3 3" /><path d="M3 18v2M21 18v2" /></>,
    bath: <><path d="M4 12h16" /><path d="M5 12v3a4 4 0 0 0 4 4h6a4 4 0 0 0 4-4v-3" /><path d="M7 12V6a2 2 0 0 1 4-1v1" /><path d="M4 19v2M20 19v2" /></>,
    ruler: <><path d="m4 19 15-15 2 2L6 21z" /><path d="m8 15 2 2M11 12l2 2M14 9l2 2M17 6l2 2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2z" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
    spark: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" /></>,
  }
  return <svg {...common} aria-hidden="true">{paths[name]}</svg>
}

function money(value?: number | string | null) {
  if (value === undefined || value === null || value === '') return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? `$${amount.toLocaleString()}` : String(value)
}

function availability(value?: string | null) {
  if (!value) return 'Contact for availability'
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function unitLabel(unit: Unit) {
  const beds = String(unit.beds ?? '').toLowerCase()
  if (beds === '0' || beds.includes('studio')) return 'Studio'
  if (beds.includes('1') || beds === '1b') return '1 Bed'
  if (beds.includes('2') || beds === '2b') return '2 Bed'
  if (beds.includes('3') || beds === '3b') return '3 Bed'
  return String(unit.beds || 'Available home')
}

function FeeRow({ label, value }: { label: string; value: number | string }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '11px 0', borderBottom: `1px solid ${COLORS.line}` }}>
    <span style={{ color: COLORS.muted, fontSize: 13 }}>{label}</span>
    <span style={{ color: COLORS.ink, fontSize: 13, fontWeight: 700 }}>{money(value)}</span>
  </div>
}

export function BuildingDetailModal({ building, onClose }: BuildingDetailModalProps) {
  const [expanded, setExpanded] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [units, setUnits] = useState<Unit[]>([])
  const [loadingUnits, setLoadingUnits] = useState(true)
  const [showAllUnits, setShowAllUnits] = useState(false)
  const { images: supabaseImages } = useSupabaseImages(building.id)
  const images = supabaseImages.length ? supabaseImages : building.images || []

  useEffect(() => {
    let active = true
    setLoadingUnits(true)
    fetch(`/api/prices/${building.id}?t=${Date.now()}`)
      .then((res) => res.ok ? res.json() : { units: [] })
      .then((data) => { if (active) setUnits(Array.isArray(data?.units) ? data.units : []) })
      .catch(() => { if (active) setUnits([]) })
      .finally(() => { if (active) setLoadingUnits(false) })
    return () => { active = false }
  }, [building.id])

  const groupedUnits = useMemo(() => {
    const groups = new Map<string, Unit[]>()
    units.forEach((unit) => {
      const label = unitLabel(unit)
      groups.set(label, [...(groups.get(label) || []), unit])
    })
    return Array.from(groups.entries()).map(([label, entries]) => ({ label, entries, price: Math.min(...entries.map((u) => Number(u.price) || Infinity)) }))
  }, [units])

  const visibleUnits = showAllUnits ? units : units.slice(0, 5)
  const deal = building.concession && building.concession.toLowerCase() !== 'tbd' ? building.concession : 'Ask about current specials'
  const allFees = [...(building.moveInFees || []), ...(building.monthlyCharges || [])]
  const hero = images[currentImageIndex]
  const textHref = `sms:+14077657306?body=${encodeURIComponent(`Hi Don, I'm interested in ${building.name}`)}`

  const nextImage = () => setCurrentImageIndex((index) => (index + 1) % Math.max(images.length, 1))
  const prevImage = () => setCurrentImageIndex((index) => (index - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1))

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6" style={{ background: 'rgba(11,18,32,.68)', backdropFilter: 'blur(3px)' }} onClick={onClose}>
      <div className="relative flex w-full flex-col overflow-hidden bg-white md:max-w-[520px] md:rounded-[24px]" style={{ height: expanded ? '100dvh' : 'min(86dvh, 760px)', maxHeight: '100dvh', color: COLORS.ink }} onClick={(event) => event.stopPropagation()}>
        <div className="relative shrink-0" style={{ height: expanded ? 202 : 250, background: COLORS.ink }}>
          {hero ? <img src={hero} alt={`${building.name} exterior`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-white/60">No photos available</div>}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(11,18,32,.5), transparent 45%, rgba(11,18,32,.65))' }} />
          <button aria-label="Close building details" onClick={onClose} className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full text-white" style={{ background: 'rgba(11,18,32,.78)' }}>
            <span style={{ fontSize: 24, lineHeight: 1 }}>×</span>
          </button>
          {images.length > 1 && <>
            <button aria-label="Previous photo" onClick={prevImage} className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-white" style={{ background: 'rgba(11,18,32,.64)' }}>‹</button>
            <button aria-label="Next photo" onClick={nextImage} className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-white" style={{ background: 'rgba(11,18,32,.64)' }}>›</button>
          </>}
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
            <div><div className="font-mono text-[11px] uppercase tracking-[.18em] text-white/75">{building.neighborhood}</div><h2 className="mt-1 text-[28px] font-bold tracking-[-.04em]">{building.name}</h2></div>
            <span className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: COLORS.pink }}>#{currentImageIndex + 1} / {Math.max(images.length, 1)}</span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}>
          <div className="flex gap-2 overflow-x-auto px-4 py-3" style={{ scrollbarWidth: 'none' }}>
            {images.slice(0, 5).map((image, index) => <button key={image} aria-label={`View photo ${index + 1}`} onClick={() => setCurrentImageIndex(index)} className="h-14 w-16 shrink-0 overflow-hidden rounded-lg" style={{ border: index === currentImageIndex ? `2px solid ${COLORS.pink}` : '2px solid transparent' }}><img src={image} alt="" className="h-full w-full object-cover" /></button>)}
          </div>

          <div className="px-4 pb-8">
            <div className="flex items-start justify-between gap-4 border-b py-3" style={{ borderColor: COLORS.line }}>
              <div><div className="text-xs font-bold uppercase tracking-[.12em]" style={{ color: COLORS.muted }}>Starting at</div><div className="mt-1 text-[30px] font-bold tracking-[-.05em]">{money(building.priceMin)}<span className="text-sm font-medium" style={{ color: COLORS.muted }}>/mo</span></div></div>
              <div className="max-w-[180px] text-right text-sm leading-5" style={{ color: COLORS.muted }}>{building.tagline || building.address}</div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: '#FFF3D8', color: '#9A6800' }}><Icon name="spark" size={13} /> <span>{deal}</span></span>
              <span className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: COLORS.soft, color: COLORS.muted }}><Icon name="pin" size={13} /> {building.neighborhood}</span>
            </div>

            {expanded && <>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[['Income', building.incomeReq], ['Credit', building.creditReq], ['Guarantor', building.guarantor ? 'Yes' : 'No']].map(([label, value]) => <div key={label} className="rounded-xl p-3" style={{ background: COLORS.soft }}><div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: COLORS.muted }}>{label}</div><div className="mt-1 text-sm font-bold">{value}</div></div>)}
              </div>

              <section className="mt-6"><div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold">Unit types</h3><span className="text-xs font-semibold" style={{ color: COLORS.muted }}>{units.length || building.units.length} available</span></div><div className="grid grid-cols-2 gap-2">{(groupedUnits.length ? groupedUnits : building.units.map((label) => ({ label, price: building.priceMin, entries: [] }))).map((group) => <div key={group.label} className="rounded-xl border p-3" style={{ borderColor: COLORS.line }}><div className="text-sm font-bold">{group.label}</div><div className="mt-2 text-lg font-bold" style={{ color: COLORS.teal }}>{money(group.price)}<span className="text-xs font-medium" style={{ color: COLORS.muted }}>/mo</span></div><div className="mt-1 text-[11px]" style={{ color: COLORS.muted }}>{group.entries.length || 'Select'} homes</div></div>)}</div></section>

              <section className="mt-6"><div className="mb-3 flex items-center justify-between"><h3 className="text-lg font-bold">Available homes</h3>{units.length > 5 && <button onClick={() => setShowAllUnits((value) => !value)} className="text-xs font-bold" style={{ color: COLORS.pink }}>{showAllUnits ? 'Show less' : 'View all'}</button>}</div>{loadingUnits ? <div className="rounded-xl p-4 text-sm" style={{ background: COLORS.soft, color: COLORS.muted }}>Loading live availability…</div> : visibleUnits.length ? <div className="divide-y rounded-xl border" style={{ borderColor: COLORS.line }}>{visibleUnits.map((unit, index) => <div key={unit.id || index} className="flex items-center justify-between gap-3 p-3"><div><div className="text-sm font-bold">{unit.unit || unit.unit_number || unitLabel(unit)}</div><div className="mt-1 flex gap-2 text-xs" style={{ color: COLORS.muted }}><span>{unit.sqft ? `${unit.sqft} sqft` : 'See floor plan'}</span><span>•</span><span>{availability(unit.availableDate || unit.available_date)}</span></div></div><div className="text-right text-sm font-bold">{money(unit.price)}<div className="text-[10px] font-medium" style={{ color: COLORS.muted }}>/mo</div></div></div>)}</div> : <div className="rounded-xl p-4 text-sm" style={{ background: COLORS.soft, color: COLORS.muted }}>Contact Don for current availability.</div>}</section>

              {allFees.length > 0 && <section className="mt-6"><div className="mb-3 flex items-center gap-2"><Icon name="receipt" size={18} /><h3 className="text-lg font-bold">Fees & policies</h3></div><div className="rounded-xl border px-3" style={{ borderColor: COLORS.line }}>{allFees.map((fee, index) => <FeeRow key={`${fee.type}-${index}`} label={fee.type} value={fee.amount} />)}</div></section>}

              <section className="mt-6 rounded-xl p-4" style={{ background: COLORS.soft }}><div className="flex items-center gap-2 text-sm font-bold"><Icon name="check" size={17} /> Why this building</div><div className="mt-3 flex flex-wrap gap-2">{building.amenities.slice(0, 8).map((amenity) => <span key={amenity} className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold" style={{ color: COLORS.muted }}>{amenity}</span>)}</div></section>
            </>}
          </div>
        </div>

        {!expanded && <button onClick={() => setExpanded(true)} className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-lg" style={{ background: COLORS.ink }}>View building details <span aria-hidden="true">↑</span></button>}
        {expanded && <div className="shrink-0 border-t bg-white p-3" style={{ borderColor: COLORS.line, paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}><a href={textHref} onClick={(event) => event.stopPropagation()} className="block rounded-xl py-3.5 text-center text-sm font-bold text-white" style={{ background: COLORS.pink }}>Text Don about {building.name}</a></div>}
      </div>
    </div>
  )
}
