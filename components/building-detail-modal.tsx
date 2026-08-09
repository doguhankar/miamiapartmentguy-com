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
  navy: '#0B1220',
  pink: '#FF3D82',
  muted: '#6B7280',
  border: '#ECEDF2',
  panel: '#F8F8FA',
  text: '#0A0F1C',
  teal: '#1B8A4A',
  gold: '#92660B',
}

type IconName = 'back' | 'heart' | 'chevronLeft' | 'chevronRight' | 'pin' | 'money' | 'home' | 'receipt' | 'chevronDown' | 'star' | 'share'

function Icon({ name, size = 16, filled = false }: { name: IconName; size?: number; filled?: boolean }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: filled ? 'currentColor' : 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  const paths = {
    back: <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6Z" />,
    chevronLeft: <path d="m15 18-6-6 6-6" />,
    chevronRight: <path d="m9 18 6-6-6-6" />,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    money: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
    home: <><path d="m3 9 9-7 9 7" /><path d="M5 8v12h14V8" /><path d="M9 20v-6h6v6" /></>,
    receipt: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M7 8h10M7 12h10M7 16h5" /></>,
    chevronDown: <path d="m6 9 6 6 6-6" />,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
    share: (
      <>
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.6 10.6 15.4 6.4M8.6 13.4l6.8 4.2" />
      </>
    ),
  }
  return <svg {...common}>{paths[name]}</svg>
}

function money(value?: number | string | null) {
  if (value === undefined || value === null || value === '') return '—'
  const amount = Number(value)
  return Number.isFinite(amount) ? `$${amount.toLocaleString()}` : String(value)
}

function formatAvailability(value?: string | null) {
  if (!value) return 'Contact for availability'
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  const isToday = date.toDateString() === new Date().toDateString()
  return isToday ? 'Avail now' : `Avail ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

function unitLabel(unit: Unit) {
  const beds = String(unit.beds ?? '').toLowerCase()
  if (!beds || beds === '0' || beds.includes('studio')) return 'Studio'
  if (beds.includes('1')) return '1 Bed'
  if (beds.includes('2')) return '2 Bed'
  if (beds.includes('3')) return '3 Bed'
  return String(unit.beds)
}

function FeeRow({ label, value, emphasis = false }: { label: string; value: number | string; emphasis?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t px-4 py-2.5 text-xs" style={{ borderColor: COLORS.border, background: emphasis ? '#FFFFFF' : undefined }}>
      <span style={{ color: emphasis ? COLORS.pink : COLORS.muted, fontWeight: emphasis ? 800 : 400 }}>{label}</span>
      <span style={{ color: emphasis ? COLORS.pink : COLORS.text, fontWeight: 800 }}>{money(value)}</span>
    </div>
  )
}

export function BuildingDetailModal({ building, onClose }: BuildingDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [activePriceType, setActivePriceType] = useState<string | null>('Studio')
  const [units, setUnits] = useState<Unit[]>([])
  const [loadingUnits, setLoadingUnits] = useState(true)
  const [showAllUnits, setShowAllUnits] = useState(false)
  const [saved, setSaved] = useState(false)
  const { images: supabaseImages } = useSupabaseImages(building.id)
  const images = supabaseImages.length ? supabaseImages : building.images || []

  useEffect(() => {
    let active = true
    setLoadingUnits(true)
    fetch(`/api/prices/${building.id}?t=${Date.now()}`)
      .then((res) => res.ok ? res.json() : { units: [] })
      .then((data) => {
        if (active) {
          const nextUnits = Array.isArray(data?.units) ? data.units : []
          setUnits(nextUnits)
          const first = nextUnits[0]
          if (first) setActivePriceType((prev) => prev ?? unitLabel(first))
        }
      })
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
    return Array.from(groups.entries()).map(([label, entries]) => ({ label, entries, price: Math.min(...entries.map((unit) => Number(unit.price) || Infinity)) }))
  }, [units])

  const priceGroups = groupedUnits.length ? groupedUnits : building.units.map((label) => ({ label: unitLabel({ beds: label }), entries: [], price: building.priceMin }))
  const filteredUnits = activePriceType ? units.filter((unit) => unitLabel(unit) === activePriceType) : units
  const visibleUnits = showAllUnits ? filteredUnits : filteredUnits.slice(0, 3)
  const allFees = [...(building.moveInFees || []), ...(building.monthlyCharges || [])]
  const deal = building.concession && building.concession.toLowerCase() !== 'tbd' ? building.concession : 'Ask about current specials'
  const image = images[currentImageIndex]
  const textHref = `sms:+14077657306?body=${encodeURIComponent(`Hi Don, I'm interested in ${building.name}`)}`
  const nextImage = () => setCurrentImageIndex((index) => (index + 1) % Math.max(images.length, 1))
  const prevImage = () => setCurrentImageIndex((index) => (index - 1 + Math.max(images.length, 1)) % Math.max(images.length, 1))

  return (
    <div className="fixed inset-0 z-50 bg-white" style={{ color: COLORS.text }} role="dialog" aria-modal="true" aria-label={`${building.name} details`}>
      <div className="h-full overflow-y-auto" style={{ paddingBottom: '108px', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
        <div className="px-4 pt-3">
          <div className="relative h-[280px] w-full overflow-hidden rounded-2xl" style={{ background: COLORS.panel }}>
            {image ? <img src={image} alt={`${building.name} photo ${currentImageIndex + 1}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm" style={{ color: COLORS.muted }}>No photos available</div>}

            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold text-white" style={{ background: '#19C6C0' }}>
              <span className="inline-block rounded-full" style={{ width: 7, height: 7, background: '#FFFFFF' }} />
              Available
            </div>


            {images.length > 1 && (
              <div className="absolute bottom-3 left-0 flex w-full items-center justify-center gap-1.5">
                {images.map((_, index) => (
                  <span key={index} className="rounded-full" style={{ width: index === currentImageIndex ? 8 : 6, height: index === currentImageIndex ? 8 : 6, background: index === currentImageIndex ? '#FFFFFF' : 'rgba(255,255,255,.55)' }} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2.5 overflow-x-auto px-4 pt-3" style={{ scrollbarWidth: 'none' }}>
          {images.map((photo, index) => <button key={`${photo}-${index}`} aria-label={`View photo ${index + 1}`} onClick={() => setCurrentImageIndex(index)} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl" style={{ border: index === currentImageIndex ? '2px solid #19C6C0' : 'none', opacity: index === currentImageIndex ? 1 : 0.7 }}><img src={photo} alt="" className="h-full w-full object-cover" /></button>)}
        </div>

        <div className="flex items-start justify-between gap-3 px-5 pt-1">
          <div className="min-w-0">
            <div className="text-[22px] font-medium leading-tight" style={{ color: COLORS.text }}>{building.name}</div>
            <div className="mt-1 flex items-center gap-1.5 text-[13px]" style={{ color: COLORS.muted }}><Icon name="pin" size={13} />{building.address || building.neighborhood}</div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button aria-label="Share building" className="flex size-[34px] items-center justify-center rounded-full border bg-white" style={{ borderColor: COLORS.border, color: COLORS.muted }}><Icon name="share" size={15} /></button>
            <button aria-label={saved ? 'Remove from saved buildings' : 'Save building'} onClick={() => setSaved((value) => !value)} className="flex size-[34px] items-center justify-center rounded-full border bg-white" style={{ borderColor: COLORS.border, color: saved ? COLORS.pink : COLORS.muted }}><Icon name="heart" size={15} filled={saved} /></button>
          </div>
        </div>

        <main className="px-5 pb-6">
          <div className="flex items-start justify-between gap-4 border-b py-3.5" style={{ borderColor: COLORS.border }}><div><div className="mb-1 text-[10.5px] font-bold uppercase tracking-[.06em]" style={{ color: COLORS.muted }}>Starting at</div><div className="font-extrabold tracking-[-.05em]" style={{ fontSize: 30 }}>{money(building.priceMin)}<span className="text-sm font-medium" style={{ color: COLORS.muted }}>/mo</span></div></div><p className="max-w-[150px] text-right text-[12.5px] leading-[1.5]" style={{ color: COLORS.muted }}>{building.tagline}</p></div>

          <div className="flex flex-wrap gap-2 py-4"><span className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold" style={{ background: '#FFF6E5', color: COLORS.gold }}><Icon name="star" size={13} filled />{deal}</span><span className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold" style={{ background: COLORS.panel, color: COLORS.text }}><Icon name="pin" size={13} />{building.neighborhood}</span></div>

          <hr style={{ border: 0, borderTop: `1px solid ${COLORS.border}`, margin: '4px 0 22px' }} />

          <section><h2 className="mb-3.5 flex items-center gap-2 text-sm font-extrabold"><Icon name="money" size={15} />Monthly Pricing</h2><button
            onPointerDown={() => alert('PILL TAPPED')}
            style={{
              width: '100%',
              padding: 20,
              background: 'red',
              color: 'white',
              fontSize: 20,
              zIndex: 9999,
              position: 'relative',
            }}
          >
            TAP ME
          </button></section>

          <section className="mt-7"><h2 className="mb-3.5 flex items-center gap-2 text-sm font-extrabold"><Icon name="home" size={15} />Available Units <span className="text-[11px] font-medium" style={{ color: COLORS.muted }}>({filteredUnits.length})</span></h2>{loadingUnits ? <div className="rounded-xl p-4 text-sm" style={{ background: COLORS.panel, color: COLORS.muted }}>Loading live availability…</div> : visibleUnits.length ? <div>{visibleUnits.map((unit, index) => { const status = formatAvailability(unit.availableDate || unit.available_date); const now = status === 'Avail now'; return <div key={unit.id || index} className="mb-2 flex items-center justify-between rounded-xl border px-3.5 py-3" style={{ borderColor: COLORS.border }}><div className="flex flex-col gap-1"><div className="text-[12.5px] font-bold">{unit.unit || unit.unit_number || `Unit ${index + 1}`} · {unitLabel(unit)}</div><div className="text-[10.5px]" style={{ color: COLORS.muted }}>{unit.sqft ? `${unit.sqft} sqft` : 'See floor plan'}{unit.baths ? ` · ${unit.baths} bath` : ''}</div></div><div className="flex flex-col items-end gap-1"><div className="font-extrabold text-[13px]">{money(unit.price)}</div><span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: now ? '#E8F8EE' : '#FFF6E5', color: now ? COLORS.teal : COLORS.gold }}>{status}</span></div></div> })}</div> : <div className="rounded-xl p-4 text-sm" style={{ background: COLORS.panel, color: COLORS.muted }}>Contact Don for current availability.</div>}{filteredUnits.length > 3 && <button onClick={() => setShowAllUnits((value) => !value)} className="flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed p-2.5 text-[11.5px] font-semibold" style={{ borderColor: COLORS.border, color: COLORS.muted }}>{showAllUnits ? 'Show fewer units' : `Show ${filteredUnits.length - 3} more units`}<Icon name="chevronDown" size={12} /></button>}</section>

          {allFees.length > 0 && <section className="mt-7 overflow-hidden rounded-[14px]" style={{ background: COLORS.panel }}><div className="flex items-center gap-2 px-4 py-3.5 text-[12.5px] font-bold"><Icon name="receipt" size={15} />Fees &amp; Policies</div><div className="px-4 pb-2 pt-1 text-[9.5px] font-bold uppercase tracking-[.05em]" style={{ color: COLORS.muted }}>Move-In</div>{allFees.slice(0, 3).map((fee, index) => <FeeRow key={`move-${fee.type}-${index}`} label={fee.type} value={fee.amount} emphasis={fee.type.toLowerCase().includes('est')} />)}{allFees.length > 3 && <><div className="px-4 pb-2 pt-3 text-[9.5px] font-bold uppercase tracking-[.05em]" style={{ color: COLORS.muted }}>Monthly &amp; Other</div>{allFees.slice(3).map((fee, index) => <FeeRow key={`other-${fee.type}-${index}`} label={fee.type} value={fee.amount} />)}</>}</section>}
        </main>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[520px] bg-gradient-to-t from-white via-white/95 to-transparent px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-9"><a href={textHref} onClick={(event) => event.stopPropagation()} className="pointer-events-auto block rounded-[14px] py-[15px] text-center text-sm font-bold text-white shadow-[0_8px_24px_rgba(255,61,130,.35)]" style={{ background: COLORS.pink }}>Text Don about this building</a></div>
    </div>
  )
}
