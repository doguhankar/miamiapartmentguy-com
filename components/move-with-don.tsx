'use client'

import { useEffect, useMemo, useState } from 'react'
import { buildings } from '@/lib/buildings'

interface LeadData {
  neighborhood: string
  buildingId: string
  moveDate: string
  budget: string
  name: string
  phone: string
}

interface MoveWithDonProps {
  isOpen: boolean
  onClose: () => void
  agentId?: string
  source?: string
  slackChannel?: string
  skipAgentSelection?: boolean
  agentDisplayName?: string
}

const NEIGHBORHOODS = ['Downtown', 'Midtown', 'Wynwood', 'Edgewater', 'FTL', 'Other']
const BUDGETS = ['$2,000–2,500', '$2,500–3,000', '$3,000–4,000+', 'You tell me']
const today = () => new Date().toISOString().slice(0, 10)
const threeMonthsOut = () => { const date = new Date(); date.setMonth(date.getMonth() + 3); return date.toISOString().slice(0, 10) }

const emptyLead = (): LeadData => ({ neighborhood: '', buildingId: '', moveDate: '', budget: '', name: '', phone: '' })

export function MoveWithDon({ isOpen, onClose, agentId = 'doguhankar1@gmail.com', source = 'Move with Don', slackChannel }: MoveWithDonProps) {
  const [intro, setIntro] = useState(true)
  const [data, setData] = useState<LeadData>(emptyLead())
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (isOpen) { setIntro(true); setData(emptyLead()); setDone(false); setError('') } }, [isOpen])

  const buildingNeighborhood = data.neighborhood === 'FTL' ? 'Las Olas' : data.neighborhood
  const filteredBuildings = useMemo(() => buildingNeighborhood && buildingNeighborhood !== 'Other' ? buildings.filter((building) => building.neighborhood === buildingNeighborhood) : [], [buildingNeighborhood])
  const selectedBuilding = buildings.find((building) => building.id === data.buildingId)
  const setField = <K extends keyof LeadData>(key: K, value: LeadData[K]) => setData((current) => ({ ...current, [key]: value }))
  const canSubmit = Boolean(data.neighborhood && data.moveDate && data.budget && data.name.trim() && data.phone.trim().length >= 7)

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true); setError('')
    try {
      const response = await fetch('/api/submit-lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: data.name, phone: data.phone, moveDate: data.moveDate, budget: data.budget, neighborhoods: [data.neighborhood], buildingId: data.buildingId || null, buildingName: selectedBuilding?.name || '', apartmentSize: '', creditScore: '', agentId, source, slackChannel }) })
      if (!response.ok) throw new Error('Unable to submit your request')
      setDone(true)
    } catch (submissionError) { console.error('[v0] Submit error:', submissionError); setError('Something went wrong. Please try again.') } finally { setSubmitting(false) }
  }

  if (!isOpen) return null
  const fieldStyle: React.CSSProperties = { width: '100%', background: '#16253A', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: 11, padding: '13px 14px', fontSize: 14, color: '#E6ECF5', outline: 'none' }
  const labelStyle: React.CSSProperties = { display: 'block', color: '#E6ECF5', fontSize: 13, fontWeight: 700, marginBottom: 8 }
  const pillStyle = (active: boolean): React.CSSProperties => ({ border: `1px solid ${active ? '#FF4D8D' : 'rgba(255,255,255,0.12)'}`, borderRadius: 999, padding: '10px 13px', background: active ? 'rgba(255,77,141,0.14)' : '#16253A', color: active ? '#FF77A8' : '#B4C0D1', fontSize: 13, fontWeight: 600, cursor: 'pointer' })
  const updateNeighborhood = (neighborhood: string) => setData((current) => ({ ...current, neighborhood, buildingId: '' }))

  return <div role="presentation" style={{ position: 'fixed', inset: 0, background: 'rgba(4,8,16,0.82)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={(event) => event.target === event.currentTarget && onClose()}>
    <div role="dialog" aria-modal="true" aria-labelledby="move-with-don-title" style={{ background: '#111C2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: 470, maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '17px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}><div><div style={{ fontSize: 11, letterSpacing: '0.1em', color: '#19C6C0', textTransform: 'uppercase', fontWeight: 700 }}>MOVE WITH DON</div><h2 id="move-with-don-title" style={{ fontSize: 18, color: '#E6ECF5', margin: '4px 0 0' }}>{done ? 'Request received' : intro ? "Let's get moving" : 'Find your next place'}</h2></div><button type="button" onClick={onClose} aria-label="Close" style={{ border: 0, background: 'rgba(255,255,255,0.07)', color: '#B4C0D1', width: 32, height: 32, borderRadius: '50%', fontSize: 20, cursor: 'pointer' }}>×</button></header>
      <div style={{ padding: '22px 20px 24px' }}>{done ? <div style={{ textAlign: 'center', padding: '32px 0 18px' }}><div style={{ color: '#19C6C0', fontSize: 44 }}>✓</div><h3 style={{ color: '#E6ECF5', fontSize: 24 }}>You&apos;re in.</h3></div> : intro ? <div style={{ textAlign: 'center' }}><div style={{ fontSize: 44, margin: '8px 0 16px' }}>🌴</div><div style={{ color: '#19C6C0', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em' }}>MOVE WITH DON</div><h1 style={{ color: '#E6ECF5', fontSize: 26, margin: '10px 0 8px' }}>¿Qué bolá, 305!</h1><p style={{ color: '#8FA0B8', fontSize: 15, margin: '0 0 32px' }}>Let&apos;s get moving.</p><div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative', marginBottom: 32 }}><div style={{ position: 'absolute', top: 17, left: 40, right: 40, height: 2, background: 'rgba(255,255,255,0.12)' }} />{[['1', "Answer some q's"], ['2', 'Our local team reaches out'], ['3', 'Tour, sign, move in']].map(([number, label]) => <div key={number} style={{ width: '31%', position: 'relative', zIndex: 1, color: '#B4C0D1', fontSize: 12, lineHeight: 1.35 }}><div style={{ margin: '0 auto 10px', width: 34, height: 34, borderRadius: '50%', background: '#FF4D8D', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800 }}>{number}</div>{label}</div>)}</div><button type="button" onClick={() => setIntro(false)} style={{ width: '100%', border: 0, borderRadius: 11, padding: 15, background: '#FF4D8D', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Let&apos;s go</button></div> : <form onSubmit={(event) => { event.preventDefault(); void submit() }}><p style={{ color: '#8FA0B8', fontSize: 13, margin: '0 0 20px' }}>Tell us a bit about what you&apos;re looking for.</p><div style={{ display: 'grid', gap: 18 }}><div><label style={labelStyle}>Which neighborhood?</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{NEIGHBORHOODS.map((neighborhood) => <button type="button" key={neighborhood} onClick={() => updateNeighborhood(neighborhood)} style={pillStyle(data.neighborhood === neighborhood)}>{neighborhood}</button>)}</div></div><div><label style={labelStyle} htmlFor="building">Any building in particular? <span style={{ color: '#6F7F96', fontWeight: 400 }}>(optional)</span></label><select id="building" value={data.buildingId} disabled={!data.neighborhood || data.neighborhood === 'Other'} onChange={(event) => setField('buildingId', event.target.value)} style={{ ...fieldStyle, opacity: !data.neighborhood || data.neighborhood === 'Other' ? 0.55 : 1 }}><option value="">Not sure yet</option>{filteredBuildings.map((building) => <option key={building.id} value={building.id}>{building.name}</option>)}</select>{selectedBuilding && <div style={{ marginTop: 10, padding: 12, border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', gap: 12, color: '#8FA0B8', fontSize: 12 }}><span>{selectedBuilding.name}</span><a href={`/buildings/${selectedBuilding.id}`} target="_blank" rel="noreferrer" style={{ color: '#19C6C0', whiteSpace: 'nowrap' }}>View →</a></div>}</div><div><label style={labelStyle} htmlFor="move-date">Move-in date</label><input id="move-date" required type="date" min={today()} max={threeMonthsOut()} value={data.moveDate} onChange={(event) => setField('moveDate', event.target.value)} style={fieldStyle} /><p style={{ color: '#6F7F96', fontSize: 11, lineHeight: 1.5, margin: '8px 0 0' }}>We can usually see up to 3 months out. Moving later than that? Submit anyway and we&apos;ll reach back out closer to your date.</p></div><div><label style={labelStyle}>Budget</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>{BUDGETS.map((budget) => <button type="button" key={budget} onClick={() => setField('budget', budget)} style={pillStyle(data.budget === budget)}>{budget}</button>)}</div></div><div><label style={labelStyle} htmlFor="lead-name">Your name</label><input id="lead-name" required type="text" autoComplete="name" placeholder="First and last name" value={data.name} onChange={(event) => setField('name', event.target.value)} style={fieldStyle} /></div><div><label style={labelStyle} htmlFor="lead-phone">Phone number</label><input id="lead-phone" required type="tel" autoComplete="tel" placeholder="(305) 555-0123" value={data.phone} onChange={(event) => setField('phone', event.target.value)} style={fieldStyle} /></div></div><p style={{ color: '#6F7F96', fontSize: 11, lineHeight: 1.5, margin: '18px 0 0' }}>{"By submitting, you give permission for the team at Miami Apartment Guy to contact you. We're cool people, happy to help."}</p>{error && <p role="alert" style={{ color: '#FF8CA8', fontSize: 13 }}>{error}</p>}<button type="submit" disabled={!canSubmit || submitting} style={{ width: '100%', marginTop: 18, border: 0, borderRadius: 11, padding: '14px 16px', background: canSubmit ? '#FF4D8D' : '#334159', color: canSubmit ? '#fff' : '#8FA0B8', fontWeight: 800, cursor: canSubmit ? 'pointer' : 'not-allowed' }}>{submitting ? 'Sending...' : 'Find my match'}</button></form>}</div>
    </div>
  </div>
}
